// shell.ts — orchestrateur : couches, boucle RAF unique, routage gestes/état.
import { Wallpaper } from "./wallpaper";
import { StatusBar } from "./statusbar";
import { Lock } from "./lock";
import { Home } from "./home";
import { AppWindow } from "./appwin";
import { DynamicIsland } from "./di";
import { ControlCenter } from "./cc";
import { NotificationCenter } from "./nc";
import { renderApp } from "../apps";
import { registerAppCloser } from "./api";
import { sys, set, onChange } from "../system/state";
import { Spring, tick, tickTweens } from "../core/motion";
import { setZoneResolver, attachGestures } from "../core/gestures";
import type { Drag } from "../core/gestures";
import { tween } from "../core/motion";

const H = 850;

export class Shell {
  private phone: HTMLElement;
  private wp = new Wallpaper();
  private sb = new StatusBar();
  private lock: Lock;
  private home: Home;
  private di = new DynamicIsland();
  private appwin: AppWindow | null = null;
  private cc: ControlCenter | null = null;
  private nc: NotificationCenter | null = null;

  constructor(phone: HTMLElement) {
    this.phone = phone;
    this.home = new Home((id, rect) => this.openApp(id, rect));
    this.lock = new Lock(() => {});
    phone.append(this.wp.el, this.home.el, this.sb.el, this.di.el, this.lock.el);
    this.lock.bar.style.pointerEvents = "auto";
    attachGestures(phone);
    registerAppCloser(() => this.closeActiveApp());
    setZoneResolver((x, y, el) => this.resolveZone(x, y, el));
    onChange(() => this.syncTargets());
    this.syncTargets();
    this.loop();
  }

  // ---------- transitions d'état ----------
  private syncTargets() {
    // voile wallpaper : lock|panneau = 2, app = 1, sinon 0
    this.wp.level = sys.locked || sys.sheet ? 2 : sys.activeApp ? 1 : 0;
    this.sb.hidden = sys.locked;
    // maquette : le springboard n'existe pas sous le lock
    this.home.el.style.visibility = sys.locked ? "hidden" : "visible";
    this.home.setMode(sys.sheet ? "sheet" : sys.activeApp ? "app" : "full");
    // panneaux
    if (sys.sheet === "cc" && !this.cc) this.openCC();
    if (sys.sheet === "nc" && !this.nc) this.openNC();
  }

  private openApp(id: import("../system/state").AppId, tileRect: DOMRect) {
    if (sys.locked || sys.activeApp || this.appwin) return;
    const pr = this.phone.getBoundingClientRect();
    const sx = this.phone.clientWidth / pr.width, sy = this.phone.clientHeight / pr.height;
    const from = {
      x: (tileRect.left - pr.left) * sx,
      y: (tileRect.top - pr.top) * sy,
      w: tileRect.width * sx,
      h: tileRect.height * sy,
    };
    set("activeApp", id);
    this.appwin = new AppWindow(id, from, renderApp(id));
    this.appwin.onClosed = () => {
      this.appwin = null;
      set("activeApp", null);
      this.home.setIconHidden(id, false);
    };
    this.phone.append(this.appwin.el);
    this.home.setIconHidden(id, true);
  }

  closeActiveApp() { this.appwin?.close(); }

  private openCC() {
    const cc = this.ensureCC();
    cc.sy.set(-H);
    cc.open();
    if (this.nc) this.closeNC();
  }
  private openNC() {
    const nc = this.ensureNC();
    nc.sy.set(-H);
    nc.open();
  }
  private closeCC() { this.cc?.close(); if (sys.sheet === "cc") set("sheet", null); }
  private closeNC() { this.nc?.close(); if (sys.sheet === "nc") set("sheet", null); }

  private unlock() {
    // maquette : le lock fond + floute pendant que le home arrive
    tween(450, (v) => {
      this.lock.el.style.opacity = (1 - v).toFixed(3);
      this.lock.el.style.filter = `blur(${(v * 10).toFixed(1)}px)`;
    }, { done: () => { this.lock.visible = false; } });
    set("locked", false);
  }

  // ---------- zones de geste ----------
  private resolveZone(x: number, y: number, interactive: HTMLElement | null): Drag | null {
    // lock : drag de la barre « swipe up »
    if (sys.locked) {
      if (y > H - 100 && !interactive) return this.lockDrag();
      return null;
    }
    // panneau ouvert : drag vers le haut pour fermer (maquette : onDragEnd sheet)
    if (sys.sheet === "cc" && this.cc) {
      if (interactive) return null; // contrôles internes prioritaires
      return this.sheetDrag(this.cc, () => this.closeCC());
    }
    if (sys.sheet === "nc" && this.nc) {
      if (interactive) return null;
      return this.sheetDrag(this.nc, () => this.closeNC());
    }
    // app ouverte : barre du bas -> drag fenêtre
    if (sys.activeApp && this.appwin) {
      if (y > H - 48 && !interactive) {
        const win = this.appwin;
        return {
          move: (_dx, dy) => win.drag(dy),
          end: (_dx, dy, _vx, vy) => { win.release(dy, vy); },
        };
      }
      return null;
    }
    // home : zones hautes (maquette : hover zones top-8, moitié gauche NC / droite CC)
    if (!interactive && y <= 44) {
      const which = x < 200 ? "nc" : "cc";
      const sheet = which === "nc" ? this.ensureNC() : this.ensureCC();
      return {
        move: (_dx, dy) => { sheet.sy.set(Math.min(0, -H + Math.max(0, dy))); },
        end: (_dx, dy, _vx, vy) => {
          if (dy > 60 || vy > 300) { sheet.open(); set("sheet", which); }
          else { sheet.close(); }
        },
      };
    }
    return null;
  }

  private lockDrag(): Drag {
    return {
      move: (_dx, dy) => {
        const v = Math.min(0, dy);
        this.lock.bar.style.transform = `translateY(${v}px)`;
        const p = Math.min(1, -v / 200);
        this.lock.el.style.opacity = (1 - p).toFixed(3);
        this.lock.el.style.filter = `blur(${(p * 10).toFixed(1)}px)`;
      },
      end: (_dx, dy, _vx, vy) => {
        if (dy < -100 || vy < -400) { this.unlock(); }
        else {
          const o0 = parseFloat(this.lock.el.style.opacity || "1");
          tween(250, (v) => {
            this.lock.el.style.opacity = (o0 + (1 - o0) * v).toFixed(3);
            this.lock.el.style.filter = `blur(${((1 - v) * 10 * (1 - o0)).toFixed(1)}px)`;
          }, { done: () => { this.lock.el.style.opacity = "1"; this.lock.el.style.filter = "none"; } });
        }
        this.lock.bar.style.transform = "";
      },
    };
  }

  private sheetDrag(sheet: { sy: Spring; open(): void; close(): void }, done: () => void): Drag {
    return {
      move: (_dx, dy) => { sheet.sy.set(Math.min(0, dy)); },
      end: (_dx, dy, _vx, vy) => {
        if (dy < -100 || vy < -500) { done(); }
        else sheet.open();
      },
    };
  }

  private ensureCC() {
    if (!this.cc) { this.cc = new ControlCenter(); this.phone.append(this.cc.el); }
    return this.cc;
  }
  private ensureNC() {
    if (!this.nc) { this.nc = new NotificationCenter(); this.phone.append(this.nc.el); }
    return this.nc;
  }

  // ---------- boucle ----------
  private last = performance.now();
  private loop = () => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    tick(dt);
    tickTweens(dt * 1000);
    if (sys.locked) this.lock.render();
    this.wp.render();
    this.home.render();
    this.di.render();
    if (this.appwin && this.appwin.render()) this.appwin = null;
    if (this.cc && this.cc.render() && sys.sheet !== "cc") { this.cc.el.remove(); this.cc = null; }
    if (this.nc) { this.nc.tick(); if (this.nc.render() && sys.sheet !== "nc") { this.nc.el.remove(); this.nc = null; } }
    requestAnimationFrame(this.loop);
  };
}
