// lock.ts — écran verrouillé : cadenas, date, horloge dégradée 8xl, utilitaires, barre « swipe up ».
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { fmtDate, fmtTime } from "../system/state";

export class Lock {
  el = h("div", { attrs: { id: "lock" } });
  private clockEl = h("div", { class: "lk-clock" });
  private dateEl = h("div", { class: "lk-date" });
  bar = h("div", { attrs: { id: "lockbar" } });

  constructor(onUtil: (which: "torch" | "camera") => void) {
    const top = h("div", { class: "lk-top" },
      h("div", { class: "lk-lock" }, svgIcon(I.lock)),
      this.dateEl,
      this.clockEl,
    );
    const bottom = h("div", { class: "lk-bottom" },
      h("button", { class: "lk-util g-btn pressable", onClick: () => onUtil("torch") }, svgIcon(I.flashlight)),
      h("div", { class: "lk-mid" },
        h("span", { class: "lk-swipe" }, "SWIPE UP"),
        this.bar,
      ),
      h("button", { class: "lk-util g-btn pressable", onClick: () => onUtil("camera") }, svgIcon(I.camera)),
    );
    this.el.append(top, bottom);
    this.render();
  }

  render() {
    const t = fmtTime();
    this.clockEl.textContent = t;
    this.clockEl.dataset.t = t;
    this.dateEl.textContent = fmtDate();
  }

  set visible(v: boolean) {
    this.el.style.display = v ? "flex" : "none";
    if (v) { this.el.style.opacity = "1"; this.el.style.filter = "none"; }
  }
}
