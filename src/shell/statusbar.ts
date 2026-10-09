// statusbar.ts — « 9:41 » fixe + glyphes signal/wifi/batterie (maquette : h-12, text-sm,
// masquée quand verrouillé).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";

export class StatusBar {
  el = h("div", { attrs: { id: "sb" } });
  constructor() {
    const left = h("div", { class: "sbi" }, h("span", {}, "9:41"));
    const right = h("div", { class: "sbi" },
      svgIcon(I.signal), svgIcon(I.wifi), svgIcon(I.battery, "bat"));
    this.el.append(left, right);
  }
  set hidden(v: boolean) { this.el.classList.toggle("gone", v); }
}
