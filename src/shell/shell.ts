// shell.ts — l'orchestrateur : machine à états des modes (lock / home / app /
// switcher) et des sheets (cc / nc), routage gestuel, composition du frame.
// Tout le mouvement vit dans la banque de ressorts WASM ; ici on pilote.
import { Spring } from "../wasm/spring";
import { motion } from "../core/motion";
import { GestureRouter, type GestureInfo } from "../core/gestures";
import { a11y } from "../core/a11y";
import { on, set, sys } from "../system/state";
import { Wallpaper } from "./wallpaper";
import { StatusBar } from "./statusbar";
import { LockScreen } from "./lock";
import { HomeScreen } from "./home";
import { ControlCenter } from "./cc";
import { NotificationCenter } from "./nc";
import { Switcher } from "./switcher";
import { AppWindow } from "./appwin";
import { APPS, DOCK, type AppDef } from "../apps/registry";

type Mode = "lock" | "home" | "app" | "switcher";
type DragKind =
  | "none" | "unlock" | "cc" | "nc" | "sheetClose"
  | "sw" | "swScroll" | "swKill" | "appClose" | "back";

const TRAVEL = { unlock: 340, sheet: 560, app: 430, back: 300, sw: 480 };

function findApp(id: string): AppDef {
  return [...APPS, ...DOCK].find((a) => a.id === id) ?? APPS[0];
}

export class Shell {
  private phone: HTMLElement;
  private wallpaper: Wallpaper;
  private lock: LockScreen;
  private home: HomeScreen;
  private cc: ControlCenter;
  private nc: NotificationCenter;
  private sw: Switcher;
  private appwin: AppWindow;

  private mode: Mode = "lock";
  private unlockP = new Spring(0, "snappy");
  private homeP = new Spring(0, "soft");
  private ccP = new Spring(0, "sheet");
  private ncP = new Spring(0, "sheet");
  private swP = new Spring(0, "soft");
  private appP = new Spring(0, "soft");

  private drag: DragKind = "none";
  private dragBase = 0;
  private killNode: HTMLElement | null = null;
  private running: string[] = [];

  constructor() {
    this.phone = document.getElementById("phone")!;
    const layers = document.getElementById("layers")!;
    this.wallpaper = new Wallpaper(document.getElementById("wallpaper") as HTMLCanvasElement);
    const statusbar = new StatusBar();

    this.home = new HomeScreen((app) => this.openApp(app));
    this.appwin = new AppWindow();
    this.lock = new LockScreen(() => {});
    this.cc = new ControlCenter(() => this.relock());
    this.nc = new NotificationCenter((m) => a11y.announce(m));
    this.sw = new Switcher((app) => this.openFromSwitcher(app));
    this.cc.onClose = () => this.closeSheet("cc");
    this.nc.onClose = () => this.closeSheet("nc");
    this.sw.onClose = () => this.closeSwitcher();

    layers.append(this.home.node, this.appwin.node, this.lock.node, this.sw.node, this.cc.node, this.nc.node);
    document.getElementById("chrome")!.append(statusbar.node);

    new GestureRouter(this.phone, {
      onDragStart: (g) => this.dragStart(g),
      onDrag: (g) => this.dragMove(g),
      onDragEnd: (g) => this.dragEnd(g),
    });

    // état système → présentation
    on("theme", (v) => {
      this.phone.dataset.theme = v;
      if (v === "light" && sys.wallpaper === 0) set("wallpaper", 1);
      if (v === "dark" && sys.wallpaper === 1) set("wallpaper", 0);
    });
    on("reduced", (v) => a11y.setReduceMotion(v));
    on("textScale", (v) => a11y.setTextScale(v));
    this.phone.dataset.theme = sys.theme;
    this.wallpaper.bake();

    motion.every(() => this.frame());
  }

  // ---------- transitions ----------
  private unlock(): void {
    this.mode = "home";
    this.homeP.to(1);
    a11y.announce("Déverrouillé — accueil");
  }

  private relock(): void {
    this.ccP.to(0);
    this.mode = "lock";
    this.unlockP.set(0);
    this.homeP.set(0);
    this.swP.set(0);
    this.appP.set(0);
    this.appwin.node.style.visibility = "hidden";
    
    this.lock.tick();
    a11y.announce("Verrouillé");
  }

  private openApp(app: AppDef): void {
    const r = this.home.iconRect(app) ?? { x: 166, y: 396, w: 60, h: 60 };
    
    if (!this.running.includes(app.id)) this.running.push(app.id);
    this.appwin.show(app, r, () => this.closeApp());
    this.appP.to(1, 2.4); // élan initial — la fenêtre « part » de la tuile
    this.mode = "app";
    a11y.announce(`${app.name} ouverte`);
  }

  private openFromSwitcher(app: AppDef): void {
    const rect = this.sw.cardRect(app);
    const pr = this.phone.getBoundingClientRect();
    const s = Math.min(pr.width / 393, pr.height / 852);
    const from = rect
      ? { x: (rect.left - pr.left) / s, y: (rect.top - pr.top) / s, w: rect.width / s, h: rect.height / s }
      : { x: 76, y: 150, w: 240, h: 520 };
    
    this.appwin.show(app, from, () => this.closeApp());
    this.swP.to(0);
    this.appP.to(1, 1.5);
    this.mode = "app";
  }

  private closeApp(): void { this.appP.to(0); }
  private closeSheet(which: "cc" | "nc"): void { (which === "cc" ? this.ccP : this.ncP).to(0); }
  private closeSwitcher(): void { this.swP.to(0); }

  // ---------- gestes ----------
  private dragStart(g: GestureInfo): boolean {
    const targetEl = g.target as HTMLElement | null;
    const onInteractive = !!targetEl?.closest(".cc-slider, .set-row, .nc-card, button, .toggle, .slider-h");
    if (onInteractive) return false;

    const sheetOpen = this.ccP.v > 0.02 || this.ncP.v > 0.02;

    if (sheetOpen) {
      // un sheet ouvert n'écoute que « refermer » — drag vers le haut
      if (g.dy < -2) { this.drag = "sheetClose"; this.dragBase = this.ccP.v > this.ncP.v ? this.ccP.v : this.ncP.v; return true; }
      return false;
    }

    switch (this.mode) {
      case "lock":
        if (g.dy < -2) { this.drag = "unlock"; this.dragBase = this.unlockP.v; return true; }
        if (g.dy > 2) { this.drag = "nc"; this.dragBase = 0; return true; }
        return false;
      case "home":
        if (g.edge === "top-right" && g.dy > 2) { this.drag = "cc"; return true; }
        if ((g.edge === "top-left" || g.edge === "top-mid") && g.dy > 2) { this.drag = "nc"; return true; }
        if (g.edge === "bottom" && g.dy < -2 && this.running.length) { this.drag = "sw"; this.dragBase = this.swP.v; this.sw.setRunning(this.running.map(findApp)); return true; }
        if (g.edge === "bottom" && g.dy < -2) { this.drag = "sw"; this.dragBase = 0; this.sw.setRunning(this.running.map(findApp)); return true; }
        return false;
      case "app":
        if (g.edge === "top-right" && g.dy > 2) { this.drag = "cc"; return true; }
        if ((g.edge === "top-left" || g.edge === "top-mid") && g.dy > 2) { this.drag = "nc"; return true; }
        if (g.edge === "bottom" && g.dy < -2) { this.drag = "appClose"; this.dragBase = this.appP.v; return true; }
        if (g.edge === "left" && g.dx > 2) { this.drag = "back"; this.dragBase = this.appP.v; return true; }
        return false;
      case "switcher": {
        const card = this.sw.cardAt(g.startX);
        if (g.dy < -2 && Math.abs(g.dy) > Math.abs(g.dx) && card) {
          this.drag = "swKill"; this.killNode = card; return true;
        }
        if (g.dy > 2 && Math.abs(g.dy) > Math.abs(g.dx)) { this.drag = "sw"; this.dragBase = 1; return true; }
        this.drag = "swScroll"; this.sw.dragStart(); return true;
      }
    }
  }

  private dragMove(g: GestureInfo): void {
    switch (this.drag) {
      case "unlock": this.unlockP.set(motion.clamp(this.dragBase - g.dy / TRAVEL.unlock, 0, 1)); break;
      case "cc": this.ccP.set(motion.clamp(g.dy / TRAVEL.sheet, 0, 1)); break;
      case "nc": this.ncP.set(motion.clamp(g.dy / TRAVEL.sheet, 0, 1)); break;
      case "sheetClose": {
        const base = this.dragBase;
        const p = motion.clamp(base + g.dy / TRAVEL.sheet, 0, 1);
        if (this.ccP.v > this.ncP.v) this.ccP.set(p); else this.ncP.set(p);
        break;
      }
      case "sw": this.swP.set(motion.clamp(this.dragBase - g.dy / TRAVEL.sw, 0, 1)); break;
      case "swScroll": this.sw.drag(g.dx); break;
      case "swKill": if (this.killNode) this.sw.killDrag(this.killNode, g.dy); break;
      case "appClose": this.appP.set(motion.clamp(this.dragBase + g.dy / TRAVEL.app, 0, 1)); break;
      case "back": this.appP.set(motion.clamp(this.dragBase - g.dx / TRAVEL.back, 0, 1)); break;
      case "none": break;
    }
  }

  private dragEnd(g: GestureInfo): void {
    const kind = this.drag;
    this.drag = "none";
    const commit = (spring: Spring, openThresh: number, vScale: number, vy: number) => {
      const vel = vy / vScale;
      const predicted = spring.v + vel * 0.22; // momentum court — sensation « doigt qui lâche »
      spring.to(predicted > openThresh ? 1 : 0, vel);
    };
    switch (kind) {
      case "unlock": commit(this.unlockP, 0.42, TRAVEL.unlock, -g.vy); break;
      case "cc": commit(this.ccP, 0.34, TRAVEL.sheet, g.vy); break;
      case "nc": commit(this.ncP, 0.34, TRAVEL.sheet, g.vy); break;
      case "sheetClose": {
        const s = this.ccP.v > this.ncP.v ? this.ccP : this.ncP;
        const vel = g.vy / TRAVEL.sheet;
        s.to(s.v + vel * 0.22 > 0.6 ? 1 : 0, vel);
        break;
      }
      case "sw": commit(this.swP, 0.4, TRAVEL.sw, -g.vy); break;
      case "swScroll": this.sw.commitScroll(g.vx); break;
      case "swKill": if (this.killNode) this.sw.commitKill(this.killNode, g.vy); this.killNode = null;
        this.running = this.sw.runningIds();
        if (this.running.length === 0) this.swP.to(0); // plus de cartes : retour accueil
        break;
      case "appClose": commit(this.appP, 0.6, TRAVEL.app, g.vy); break;
      case "back": commit(this.appP, 0.6, TRAVEL.back, -g.vx); break;
    }
  }

  // ---------- frame ----------
  private frame(): void {
    const cl = motion.clamp;

    // transitions de mode au repos
    if (this.mode === "lock" && this.unlockP.settled && this.unlockP.v > 0.99) this.unlock();
    if (this.mode === "app" && this.appP.settled && this.appP.v < 0.002) {
      this.mode = "home"; this.appwin.node.style.visibility = "hidden"; 
      a11y.announce("Accueil");
    }
    if (this.mode === "switcher" && this.swP.settled && this.swP.v < 0.002) this.mode = "home";
    if (this.mode === "home" && this.swP.v > 0.9) this.mode = "switcher";

    const up = cl(this.unlockP.v, 0, 1);
    this.lock.render(up);
    this.home.render(cl(this.homeP.v, 0, 1), this.appP.v);
    this.appwin.render(this.appP.v);
    this.cc.render(this.ccP.v);
    this.nc.render(this.ncP.v);
    this.sw.render(this.swP.v);
    this.lock.tick(); this.nc.tick();

    // scrim adaptatif : mesuré sur la luminance réelle du fond sous la zone
    const sheet = Math.max(this.ccP.v, this.ncP.v, this.swP.v);
    const scrim = document.getElementById("scrim")!;
    const depth = cl(0.10 + sheet * 0.42 + this.appP.v * 0.22 + (1 - up) * 0.10, 0, 0.72);
    scrim.style.opacity = String(depth);
    this.wallpaper.render(sheet * 0.5 + this.appP.v * 0.2);
  }
}
