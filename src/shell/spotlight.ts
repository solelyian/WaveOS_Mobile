// spotlight.ts — feuille de recherche style iOS : la capsule de l'accueil se
// MORPHE en barre de recherche (FLIP : la barre part de la géométrie de la
// capsule et grandit vers sa place, contenu en fondu, referme en inverse).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { Spring } from "../core/motion";
import { lerp } from "../wasm/bridge";
import { APPS, appMeta } from "../apps/registry";
import type { AppId } from "../system/state";

export class Spotlight {
  el = h("div", { attrs: { id: "spot" } });
  private ms = new Spring(0, "morph");
  private input = h("input", {
    attrs: { type: "text", placeholder: "Search", autocomplete: "off" },
    style: { flex: "1", background: "none", border: "none", outline: "none", color: "#fff", fontSize: "18px", fontWeight: "500" },
  }) as HTMLInputElement;
  private list = h("div", { class: "spot-list" });
  private bar: HTMLElement;
  private scrim: HTMLElement;
  private openApp: (id: AppId, rect: DOMRect) => void;
  private capsule: HTMLElement | null = null;
  // géométrie FLIP capsule -> barre (espace téléphone)
  private g = { dx: 0, dy: 0, sx: 1, sy: 1 };
  private closing = false;

  constructor(onOpen: (id: AppId, rect: DOMRect) => void) {
    this.openApp = onOpen;
    this.bar = h("div", { class: "spot-bar g-dark" },
      svgIcon(I.search, "", 20), this.input,
      h("button", { class: "spot-x g-btn", onClick: () => this.close() }, svgIcon(I.x, "", 16)));
    this.input.addEventListener("input", () => this.filter());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { const first = this.list.querySelector(".spot-row .tile") as HTMLElement | null; first?.click(); }
      if (e.key === "Escape") this.close();
    });
    this.scrim = h("div", { class: "spot-scrim", onClick: () => this.close() });
    this.el.append(this.scrim, h("div", { class: "spot-in" }, this.bar, this.list));
    this.filter();
  }

  private filter() {
    const q = this.input.value.trim().toLowerCase();
    const matches = APPS.filter((a) => a.name.toLowerCase().includes(q));
    this.list.replaceChildren(...matches.map((a) => {
      const m = appMeta(a.id);
      const tile = h("div", { class: "tile", style: { background: m.color, width: "52px", height: "52px", borderRadius: "16px", flex: "none" } }, svgIcon(I[m.icon]));
      (tile.querySelector("svg") as SVGElement).style.width = "26px";
      (tile.querySelector("svg") as SVGElement).style.height = "26px";
      return h("div", { class: "spot-row", onClick: () => { const r = tile.getBoundingClientRect(); this.close(); this.openApp(a.id, r); } },
        tile,
        h("span", { style: { color: "#fff", fontWeight: "600", fontSize: "16px" } }, m.name),
        h("span", { style: { marginLeft: "auto", color: "rgba(255,255,255,.4)", display: "flex" } }, svgIcon(I.chevronLeft, "", 16)));
    }));
  }

  /** La capsule de l'accueil fournit la géométrie de départ du morph. */
  open(capsule: HTMLElement) {
    this.closing = false;
    this.capsule = capsule;
    capsule.style.opacity = "0";
    // FLIP : la barre est posée à sa place finale ; on calcule le transform
    // qui la ramène exactement sur la capsule (espace 400×850 du téléphone).
    const phone = this.el.parentElement!.getBoundingClientRect();
    const kx = this.el.parentElement!.clientWidth / phone.width;
    const ky = this.el.parentElement!.clientHeight / phone.height;
    const c = capsule.getBoundingClientRect();
    const b = this.bar.getBoundingClientRect();
    this.g = {
      dx: (c.left - b.left) * kx,
      dy: (c.top - b.top) * ky,
      sx: (c.width / b.width) * kx * (phone.width / this.el.parentElement!.clientWidth),
      sy: (c.height / b.height) * ky * (phone.height / this.el.parentElement!.clientHeight),
    };
    this.ms.to(1);
    setTimeout(() => { if (!this.closing) this.input.focus(); }, 350);
  }

  close() {
    if (this.closing) return;
    this.closing = true;
    this.ms.to(0);
    this.input.blur();
  }

  /** rendu ; true = morph refermé (à retirer du DOM). */
  render(): boolean {
    const t = this.ms.v, iv = 1 - t;
    this.scrim.style.opacity = t.toFixed(3);
    this.el.style.pointerEvents = t > 0.05 ? "auto" : "none";
    // barre : morph capsule -> place finale (ou inverse à la fermeture)
    const dx = this.g.dx * iv, dy = this.g.dy * iv;
    const sx = lerp(this.g.sx, 1, t), sy = lerp(this.g.sy, 1, t);
    this.bar.style.transformOrigin = "0 0";
    this.bar.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
    // coins : capsule pilule (demi-hauteur) -> arrondi barre 28, compensé par axe
    const r = lerp(17, 28, t);
    this.bar.style.borderRadius = `${(r / sx).toFixed(1)}px / ${(r / sy).toFixed(1)}px`;
    // contenu de la barre : fondu en fin de morph ; liste : fondu + petit monté
    for (const kid of Array.from(this.bar.children)) (kid as HTMLElement).style.opacity = Math.min(1, Math.max(0, (t - 0.55) / 0.45)).toFixed(3);
    this.list.style.opacity = Math.min(1, Math.max(0, (t - 0.35) / 0.5)).toFixed(3);
    this.list.style.transform = `translateY(${(iv * 14).toFixed(1)}px)`;
    // la capsule revient en fondu dans la 2e moitié du morph de fermeture
    if (this.capsule) this.capsule.style.opacity = this.closing ? Math.min(1, Math.max(0, (0.5 - t) / 0.5)).toFixed(3) : "0";
    if (t <= 0.01 && this.ms.settled()) {
      this.el.remove();
      return true;
    }
    return false;
  }
}
