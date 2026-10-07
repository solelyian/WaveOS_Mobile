// lock.ts — écran de verrouillage : grande heure 200, date, hint « glisser »,
// deux boutons capsule verre (torche / caméra — réels : torche agit).
import { el } from "../core/el";
import { glyph } from "../core/icons";
import { motion } from "../core/motion";
import { on, toggle } from "../system/state";

export class LockScreen {
  node: HTMLElement;
  private clockEl: HTMLElement;
  private dateEl: HTMLElement;
  private torchBtn: HTMLElement;

  constructor(onUnlockHint: () => void) {
    const d = new Date();
    const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    this.dateEl = el("div", { id: "lock-date" },
      `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`);
    this.clockEl = el("div", { id: "lock-clock", class: "t-clock" }, "09:41");

    this.torchBtn = el("button", { id: "lock-torch", class: "lock-btn g g-regular", "aria-label": "Lampe torche" },
      glyph("flashlight"));
    this.torchBtn.addEventListener("click", () => { toggle("torch"); onUnlockHint(); });
    on("torch", (v) => { this.torchBtn.style.background = v ? "rgba(255,255,255,.85)" : ""; this.torchBtn.style.color = v ? "#14161F" : "#fff"; });

    const camBtn = el("button", { id: "lock-cam", class: "lock-btn g g-regular", "aria-label": "Caméra" }, glyph("camera"));

    this.node = el("div", { id: "layer-lock", class: "layer", role: "dialog", "aria-label": "Écran verrouillé" },
      el("div", { id: "lock-clock-wrap" }, this.dateEl, this.clockEl),
      el("div", { id: "lock-hint" },
        el("div", { class: "caps" }, "Glisser vers le haut"),
        el("div", { class: "bar" })),
      this.torchBtn, camBtn);
  }

  tick(): void {
    const d = new Date();
    const t = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    if (this.clockEl.textContent !== t) this.clockEl.textContent = t;
  }

  /** p = progression du déverrouillage 0→1 : l'écran s'élève et s'efface. */
  render(p: number): void {
    const e = motion.easeOut(motion.clamp(p, 0, 1));
    this.node.style.transform = `translateY(${-170 * e}px)`;
    this.node.style.opacity = String(1 - motion.clamp(p * 1.5, 0, 1));
    this.node.style.visibility = p >= 0.99 ? "hidden" : "visible"; // sinon il avale les taps de l'accueil
  }
}
