// spotlight.ts — feuille de recherche style iOS : capsule verre, champ,
// liste filtrée des apps ; un résultat ouvre l'app (morph depuis sa tuile).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { Spring } from "../core/motion";
import { APPS, appMeta } from "../apps/registry";
import type { AppId } from "../system/state";

export class Spotlight {
  el = h("div", { attrs: { id: "spot" } });
  private op = new Spring(0, "shade");
  private input = h("input", {
    attrs: { type: "text", placeholder: "Search", autocomplete: "off" },
    style: { flex: "1", background: "none", border: "none", outline: "none", color: "#fff", fontSize: "18px", fontWeight: "500" },
  }) as HTMLInputElement;
  private list = h("div", { class: "spot-list" });
  private openApp: (id: AppId, rect: DOMRect) => void;

  constructor(onOpen: (id: AppId, rect: DOMRect) => void) {
    this.openApp = onOpen;
    const bar = h("div", { class: "spot-bar g-dark" },
      svgIcon(I.search, "", 20), this.input,
      h("button", { class: "spot-x g-btn", onClick: () => this.close() }, svgIcon(I.x, "", 16)));
    this.input.addEventListener("input", () => this.filter());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { const first = this.list.querySelector(".spot-row .tile") as HTMLElement | null; first?.click(); }
      if (e.key === "Escape") this.close();
    });
    const scrim = h("div", { class: "spot-scrim", onClick: () => this.close() });
    this.el.append(scrim, h("div", { class: "spot-in" }, bar, this.list));
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

  open() {
    this.op.to(1);
    setTimeout(() => this.input.focus(), 80);
  }
  close() { this.op.to(0); }

  /** rendu ; true = invisible (à retirer). */
  render(): boolean {
    const v = this.op.v;
    this.el.style.opacity = v.toFixed(3);
    this.el.style.pointerEvents = v > 0.05 ? "auto" : "none";
    const inEl = this.el.querySelector(".spot-in") as HTMLElement;
    inEl.style.transform = `translateY(${((1 - v) * 24).toFixed(1)}px) scale(${(0.96 + 0.04 * v).toFixed(3)})`;
    return v < 0.01 && this.op.settled();
  }
}
