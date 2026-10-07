// appwin.ts — la fenêtre d'app : morph continu icône ↔ plein écran.
// Un seul ressort (p 0→1) pilote position, échelle, rayon et opacité du
// contenu ; pendant le geste retour, le doigt pilote le même ressort.
import { el } from "../core/el";
import { glyph } from "../core/icons";
import { motion } from "../core/motion";
import { iconFor, phHero, type AppDef } from "../apps/registry";

interface Rect { x: number; y: number; w: number; h: number }

export class AppWindow {
  node: HTMLElement;
  private body: HTMLElement;
  private appbar: HTMLElement;
  private from: Rect = { x: 166, y: 400, w: 60, h: 60 };
  private current: AppDef | null = null;
  onBack?: () => void;

  constructor() {
    this.body = el("div", { class: "appbody" });
    this.node = el("div", { id: "layer-app", class: "layer" });
    this.appbar = el("div", { class: "appbar" });
    this.node.style.visibility = "hidden";
  }

  /** Montre la fenêtre pour l'app, morphant depuis `from` (coords logiques). */
  show(app: AppDef, from: Rect, onBack: () => void): void {
    this.current = app;
    this.from = from;
    this.onBack = onBack;
    const back = el("button", { class: "back g g-thin", "aria-label": "Retour" }, glyph("chevronL"));
    back.addEventListener("click", () => this.onBack?.());
    this.appbar.replaceChildren(back, iconFor(app, 34), el("h2", {}, app.name));
    const content = app.content ? app.content() : phHero(app.name, "Prototype — cette app est une coque d'exploration.");
    this.body.replaceChildren(content);
    const win = el("div", { class: "appwin", role: "dialog", "aria-label": app.name }, this.appbar, this.body);
    this.node.replaceChildren(win);
    this.node.style.visibility = "visible";
  }

  get app(): AppDef | null { return this.current; }

  /** p : 0 = tuile (rect source), 1 = plein écran. */
  render(p: number): void {
    const win = this.node.firstElementChild as HTMLElement | null;
    if (!win) return;
    const cl = motion.clamp;
    const e = cl(p, 0, 1);
    const f = this.from;
    // centre cible : plein écran = centre 196.5,426 ; source = centre de la tuile
    const cx = motion.lerp(f.x + f.w / 2, 196.5, e);
    const cy = motion.lerp(f.y + f.h / 2, 426, e);
    const sx = motion.lerp(f.w / 393, 1, e);
    const sy = motion.lerp(f.h / 852, 1, e);
    win.style.width = "393px";
    win.style.height = "852px";
    win.style.left = "0";
    win.style.top = "0";
    win.style.transform = `translate(${cx - 196.5}px, ${cy - 426}px) scale(${sx}, ${sy})`;
    // rayon « écran » interpolé, compensé de l'échelle (radius cohérent visuellement)
    const rScreen = motion.lerp(18, 40, e < 0.5 ? e * 2 : 1) * (1 - e) + 0 * e;
    const sEff = Math.max(0.06, Math.min(sx, sy));
    win.style.borderRadius = `${rScreen / sEff}px`;
    win.style.opacity = String(cl(e * 2.2, 0, 1));
    this.body.style.opacity = String(cl((p - 0.35) / 0.45, 0, 1));
    this.appbar.style.opacity = String(cl((p - 0.5) / 0.4, 0, 1));
    if (p <= 0.001) this.node.style.visibility = "hidden";
  }
}
