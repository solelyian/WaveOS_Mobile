// appwin.ts — morph icône→fenêtre (maquette : le conteneur coloré grandit de la tuile,
// le contenu app crossfade par-dessus ; drag vertical -> fermeture dans les deux sens).
import { h } from "../core/el";
import { Spring, tween } from "../core/motion";
import { lerp } from "../wasm/bridge";
import { appMeta } from "../apps/registry";
import type { AppId } from "../system/state";
import { tokens } from "../tokens.gen";

export interface Rect { x: number; y: number; w: number; h: number }

const R_ICON = 22, R_SCREEN = 60;

export class AppWindow {
  el = h("div", { class: "appwin" });
  body = h("div", { class: "app-body" });
  private morph = new Spring(0, "morph");
  private oy = new Spring(0, "morph");   // offset drag vertical
  private meta;
  private closing = false;
  onClosed?: () => void;

  constructor(public id: AppId, private from: Rect, content: HTMLElement) {
    this.meta = appMeta(id);
    this.el.style.background = this.meta.color;
    this.body.classList.add(this.meta.theme);
    this.body.style.opacity = "0";
    this.body.append(content);
    const grab = h("div", { class: "grabber" },
      h("i", { class: this.meta.theme === "dark" ? "dark" : "light" }));
    this.el.append(this.body, grab);
    this.morph.to(1);
  }

  private progress = 0; // progression du morph de fermeture pilotée par le doigt

  /** Suivi du doigt : vers le haut, la fenêtre SE RÉSORBE vers son icône à
   *  l'unisson du geste (progress 0→1 sur closeTravelPx) ; vers le bas, simple
   *  résistance élastique. */
  drag(dy: number) {
    if (this.closing) return;
    if (dy < 0) {
      this.progress = Math.min(1, -dy / tokens.motion.closeTravelPx);
      this.morph.set(1 - this.progress);
      this.oy.set(0);
    } else {
      this.oy.set(dy * 0.35);
    }
  }
  /** Lâcher : morph entamé >~40% ou flick -> fermeture complète ; sinon
   *  ressort de retour à plein écran. */
  release(dy: number, vy: number): "close" | "stay" {
    if (this.progress > 0.4 || vy < -tokens.motion.velocityCommit * 0.9 || Math.abs(vy) > tokens.motion.velocityCommit * 1.6) {
      this.close();
      return "close";
    }
    this.progress = 0;
    this.morph.to(1);
    this.oy.to(0);
    return "stay";
  }
  close() {
    if (this.closing) return;
    this.closing = true;
    this.morph.to(0);
    this.oy.to(0); // retour à l'icône, pas de glissé (maquette : layoutId morph direct)
    // contenu : fondu de sortie quasi instantané (maquette : exit durée .1, scale .98)
    tween(110, (v) => {
      this.body.style.opacity = ((1 - v) * this.bodyOp).toFixed(3);
      this.body.style.transform = `scale(${lerp(1, 0.98, v).toFixed(4)})`;
    }, { from: 0, to: 1 });
  }
  private bodyOp = 0;

  /** à appeler chaque frame ; renvoie true quand la fenêtre a disparu. */
  render(): boolean {
    const t = this.morph.v;
    const { x, y, w, h: hh } = this.from;
    const sx = lerp(w / tokens.screen.w, 1, t);
    const sy = lerp(hh / tokens.screen.h, 1, t);
    const tx = lerp(x, 0, t);
    const ty = lerp(y, 0, t) + this.oy.v;
    this.el.style.transform = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
    // rayon visuel compensé par l'échelle (maquette : Framer corrige le radius)
    this.el.style.borderRadius = `${(lerp(R_ICON, R_SCREEN, t) / sx).toFixed(1)}px`;
    // contenu : fondu entrant retardé (maquette : delay .05, durée .25, blur 10 -> 0)
    if (!this.closing) {
      const c = Math.max(0, Math.min(1, (t - 0.15) / 0.45));
      this.bodyOp = c;
      this.body.style.opacity = c.toFixed(3);
      this.body.style.filter = `blur(${((1 - c) * 10).toFixed(1)}px)`;
      this.body.style.transform = `scale(${lerp(0.98, 1, c).toFixed(4)})`;
    } else {
      this.body.style.filter = "none";
    }
    if (this.closing && t <= 0.01 && this.morph.settled()) {
      this.el.remove();
      this.onClosed?.();
      return true;
    }
    return false;
  }
}
