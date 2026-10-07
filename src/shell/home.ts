// home.ts — page d'accueil : widgets (météo + calendrier réel), grille 4×N,
// pilule Rechercher, dock. La cascade d'entrée et le décalage « app ouverte »
// sont pilotés par les ressorts du shell, jamais par des transitions CSS.
import { el } from "../core/el";
import { glyph } from "../core/icons";
import { motion } from "../core/motion";
import { APPS, DOCK, iconFor, type AppDef } from "../apps/registry";

const GRID_STEP = 0.035; // cascade : décalage entre rangées

export class HomeScreen {
  node: HTMLElement;
  private gridSlots: HTMLElement[] = [];
  private dockSlots: HTMLElement[] = [];
  private widgetsEl: HTMLElement;
  private searchEl: HTMLElement;
  private dockEl: HTMLElement;
  private bySlot = new Map<HTMLElement, AppDef>();

  constructor(private onApp: (app: AppDef) => void) {
    const d = new Date();
    const days = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];

    const weather = el("div", { class: "widget weather g" },
      el("div", {},
        el("div", { class: "w-label" }, "Météo — Lyon"),
        el("div", { class: "w-big" }, "19°")),
      el("div", {},
        el("div", { class: "w-sub" }, "Éclaircies · max 21°"),
        el("div", { class: "w-row", style: "margin-top:8px" },
          el("span", {}, "18h 19°"), el("span", {}, "19h 18°"), el("span", {}, "20h 17°"))));

    const cal = el("div", { class: "widget calendar" },
      el("div", {},
        el("div", { class: "w-label" }, days[d.getDay()]),
        el("div", { class: "w-big" }, String(d.getDate()))),
      el("div", { class: "w-sub" }, "Design review — 16:00"));
    this.widgetsEl = el("div", { id: "home-widgets" }, weather, cal);

    const grid = el("div", { id: "home-grid" });
    for (const app of APPS) grid.append(this.slot(app, this.gridSlots));

    this.searchEl = el("button", { id: "home-search", class: "g g-thin" }, glyph("search"), "Rechercher");

    this.dockEl = el("div", { id: "dock", class: "g g-regular" });
    for (const app of DOCK) this.dockEl.append(this.slot(app, this.dockSlots));

    this.node = el("div", { id: "layer-home", class: "layer" },
      this.widgetsEl, grid, this.searchEl, this.dockEl);
  }

  private slot(app: AppDef, sink: HTMLElement[]): HTMLElement {
    const ic = iconFor(app, 60);
    const s = el("div", { class: "app-slot", role: "button", tabindex: "0", "aria-label": app.name }, ic,
      el("span", { class: "name" }, app.name));
    s.addEventListener("click", () => this.onApp(app));
    s.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") this.onApp(app); });
    this.bySlot.set(s, app);
    sink.push(s);
    return s;
  }

  /** Rect logique (393×852) de l'icône d'une app — ancre du morph d'ouverture. */
  iconRect(app: AppDef): { x: number; y: number; w: number; h: number } | null {
    for (const [slot, a] of this.bySlot) {
      if (a.id !== app.id) continue;
      const pr = this.node.getBoundingClientRect();
      const r = slot.querySelector(".icon")!.getBoundingClientRect();
      const s = Math.min(pr.width / 393, pr.height / 852);
      return { x: (r.left - pr.left) / s, y: (r.top - pr.top) / s, w: r.width / s, h: r.height / s };
    }
    return null;
  }

  /**
   * p = apparition (0 → caché, 1 → posé). Chaque élément suit le ressort avec
   * un décalage — la cascade est une conséquence du moteur, pas un setTimeout.
   */
  render(p: number, dim: number): void {
    const cl = motion.clamp;
    this.widgetsEl.style.opacity = String(cl(p, 0, 1));
    this.widgetsEl.style.transform = `translateY(${(1 - cl(p, 0, 1)) * 26}px)`;
    const kids = [...this.gridSlots];
    for (let i = 0; i < kids.length; i++) {
      const pi = cl((p - i * GRID_STEP) / (1 - i * GRID_STEP), 0, 1);
      const e = motion.easeOut(pi);
      const sc = 0.86 + 0.14 * e;
      kids[i].style.opacity = String(e);
      kids[i].style.transform = `translateY(${(1 - e) * 34}px) scale(${sc})`;
    }
    const pd = cl((p - 4 * GRID_STEP) / (1 - 4 * GRID_STEP), 0, 1);
    this.searchEl.style.opacity = String(pd);
    const pe = cl((p - 6 * GRID_STEP) / (1 - 6 * GRID_STEP), 0, 1);
    this.dockEl.style.opacity = String(pe);
    this.dockEl.style.transform = `translateY(${(1 - motion.easeOut(pe)) * 48}px)`;
    this.node.style.opacity = String(1 - dim * 0.6);
    this.node.style.transform = `scale(${1 + dim * -0.055})`;
  }
}
