// statusbar.ts — « 9:41 » fixe + glyphes signal/wifi/batterie (maquette : h-12, text-sm,
// masquée quand verrouillé).
import { h } from "../core/el";

// Indicateurs façon iOS : 4 barres cellulaires, 3 arcs wifi, batterie + niveau.
const CELL = `<svg viewBox="0 0 20 14" fill="currentColor"><rect x="0" y="9" width="3.6" height="5" rx="1"/><rect x="5.4" y="6.5" width="3.6" height="7.5" rx="1"/><rect x="10.8" y="4" width="3.6" height="10" rx="1"/><rect x="16.2" y="1.5" width="3.6" height="12.5" rx="1"/></svg>`;
const WIFI = `<svg viewBox="0 0 20 14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M2 5.2a11.5 11.5 0 0 1 16 0"/><path d="M4.9 8.2a7.4 7.4 0 0 1 10.2 0"/><path d="M7.8 11a3.4 3.4 0 0 1 4.4 0"/><circle cx="10" cy="13" r="1.15" fill="currentColor" stroke="none"/></svg>`;
const BAT = (lvl: number) => `<svg viewBox="0 0 27 14" fill="none"><rect x="1" y="1.5" width="21" height="11" rx="3.2" stroke="currentColor" stroke-opacity=".45" stroke-width="1.3"/><rect x="3" y="3.5" width="${(17 * Math.max(0, Math.min(1, lvl))).toFixed(1)}" height="7" rx="1.6" fill="currentColor"/><path d="M24 5v4a2.2 2.2 0 0 0 0-4z" fill="currentColor" fill-opacity=".45"/></svg>`;

export class StatusBar {
  el = h("div", { attrs: { id: "sb" } });
  constructor() {
    const left = h("div", { class: "sbi" }, h("span", {}, "9:41"));
    const right = h("div", { class: "sbi" },
      h("span", { class: "icon", html: CELL }),
      h("span", { class: "icon", html: WIFI }),
      h("span", { class: "icon bat", html: BAT(0.82) }));
    this.el.append(left, right);
  }
  set hidden(v: boolean) { this.el.classList.toggle("gone", v); }
}
