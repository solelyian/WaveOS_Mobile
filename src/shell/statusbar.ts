// statusbar.ts — heure réelle + radios en icônes Lucide.
// Règle : géométrie professionnelle, pas de paths maison — lucide() vendored.
// L'avion remplace le bloc signal/wifi ; la lune signale Focus ; la batterie
// suit l'état réel (batterie simulée dans SysState).
import { el } from "../core/el";
import { lucide } from "../core/lucide";
import { on, sys } from "../system/state";
import { motion } from "../core/motion";

export class StatusBar {
  node: HTMLElement;
  private timeEl: HTMLElement;
  private cellEl: SVGElement;
  private wifiEl: SVGElement;
  private btEl: SVGElement;
  private battWrap: HTMLElement;
  private planeEl: SVGElement;
  private moonEl: SVGElement;
  private lastMin = -1;

  constructor() {
    this.timeEl = el("span", { class: "time" }, "09:41");
    this.planeEl = lucide("plane", "sb-plane");
    this.planeEl.style.display = "none";
    this.cellEl = lucide("signal-high");
    this.wifiEl = lucide("wifi");
    this.btEl = lucide("bluetooth", "sb-bt");
    this.moonEl = lucide("moon", "sb-focus");
    this.moonEl.style.display = "none";
    this.battWrap = el("span", { class: "batt" },
      el("span", { class: "batt-pct" }, "87"),
      lucide("battery-full"));
    this.node = el("div", { id: "statusbar" },
      this.timeEl,
      el("div", { class: "sicons" },
        this.moonEl, this.planeEl, this.cellEl, this.wifiEl, this.btEl, this.battWrap));

    on("wifi", () => this.syncRadios());
    on("bt", () => this.syncRadios());
    on("airplane", () => this.syncRadios());
    on("focus", (v) => {
      this.moonEl.style.display = v ? "" : "none";
      this.node.classList.toggle("focus", v);
    });
    this.syncRadios();
    this.sync();
    motion.every(() => this.sync());
  }

  /** Masquée quand le centre de notifications couvre l'écran — sur la réf
   *  HarmonyOS le NC n'a pas de status bar, la grande horloge la remplace. */
  setGone(v: boolean): void { this.node.classList.toggle("gone", v); }

  private syncRadios(): void {
    const air = sys.airplane;
    this.planeEl.style.display = air ? "" : "none";
    this.cellEl.style.display = air ? "none" : "";
    this.wifiEl.style.display = air ? "none" : "";
    this.wifiEl.style.opacity = sys.wifi ? "1" : ".25";
    this.btEl.style.opacity = sys.bt ? "1" : ".25";
  }

  private sync(): void {
    const d = new Date();
    const m = d.getMinutes();
    if (m === this.lastMin) return;
    this.lastMin = m;
    this.timeEl.textContent = `${String(d.getHours()).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
}
