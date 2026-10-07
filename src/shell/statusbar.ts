// statusbar.ts — heure réelle, radios, batterie, point Focus.
// Minimaliste par exigence : icônes stroke 1.7, pas de bonbonnes.
import { el } from "../core/el";
import { glyph } from "../core/icons";
import { on, sys } from "../system/state";
import { motion } from "../core/motion";

export class StatusBar {
  node: HTMLElement;
  private timeEl: HTMLElement;
  private wifiEl: SVGSVGElement;
  private cellEl: SVGSVGElement;
  private lastMin = -1;

  constructor() {
    this.timeEl = el("span", { class: "time" }, "09:41");
    this.cellEl = glyph("cellular");
    this.wifiEl = glyph("wifi");
    const batt = glyph("battery");
    const focusDot = el("span", { class: "focus-dot", title: "Focus" });
    this.node = el("div", { id: "statusbar" },
      this.timeEl,
      el("div", { class: "sicons" }, focusDot, this.cellEl, this.wifiEl, batt));

    on("wifi", (v) => { this.wifiEl.style.opacity = v ? "1" : ".25"; });
    on("airplane", (v) => {
      this.cellEl.style.opacity = v ? ".25" : "1";
      this.wifiEl.style.opacity = v ? ".25" : sys.wifi ? "1" : ".25";
    });
    on("focus", (v) => this.node.classList.toggle("focus", v));
    this.sync();
    motion.every(() => this.sync());
  }

  private sync(): void {
    const d = new Date();
    const m = d.getMinutes();
    if (m === this.lastMin) return;
    this.lastMin = m;
    this.timeEl.textContent = `${String(d.getHours()).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
}
