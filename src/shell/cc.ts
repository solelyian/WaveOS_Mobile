// cc.ts — Control Center : grille connectivité 2×2, carte média, sliders verticaux,
// Focus + rotate/airplay, utilitaires, pilule Home (layout maquette 1:1).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { sys, set, onChange } from "../system/state";
import { Spring } from "../core/motion";

function toggle(icon: HTMLElement, on: boolean, cls: string, el: HTMLElement) {
  el.className = `cc-tg ${cls} ${on ? "on" : "off"}`;
  el.replaceChildren(icon);
}

export class ControlCenter {
  el = h("div", { class: "sheet", attrs: { id: "cc" } });
  /** y : -H fermé → 0 ouvert (ressort shade). */
  sy = new Spring(-tokens_H, "shade");
  private brightFill = h("div", { class: "fill" });
  private volFill = h("div", { class: "fill" });
  private mediaSlot = h("div", { class: "cc-media g-dark" });
  private tgs: Record<string, HTMLElement> = {};

  constructor() {
    const cluster = h("div", { class: "cc-cluster g-dark" });
    const mk = (key: "wifi" | "cellular" | "bluetooth" | "airplane", onIcon: string, cls: string) => {
      const b = h("button", { class: `cc-tg ${cls}`, onClick: () => set(key, !sys[key]) });
      this.tgs[key] = b; (b as any)._ic = onIcon;
      cluster.append(b);
      return b;
    };
    mk("wifi", I.wifi, "blue");
    mk("cellular", I.signal, "green");
    mk("bluetooth", I.bluetooth, "blue");
    mk("airplane", I.plane, "orange");

    const r1 = h("div", { class: "cc-r1" }, cluster, this.mediaSlot);

    const r2 = h("div", { class: "cc-r2" },
      this.slider(this.brightFill, I.sun, "brightness"),
      this.slider(this.volFill, I.volume2, "volume"),
      h("div", { class: "cc-mini" },
        h("div", { class: "cc-focus g-dark" },
          h("div", { class: "mic-ic" }, svgIcon(I.moon)),
          h("span", {}, "Zen Mode")),
        h("button", { class: "cc-sq g-dark" }, svgIcon(I.rotateCcw)),
        h("button", { class: "cc-sq g-dark" }, svgIcon(I.screenShare))));

    const r3 = h("div", { class: "cc-r3" },
      ...[I.flashlight, I.clock, I.calculator, I.camera].map((ic) =>
        h("button", { class: "cc-util g-dark" }, svgIcon(ic))));

    const sdBtn = h("button", { class: "cc-sd g-dark", onClick: () => { this.close(); set("sheet", "sd"); } },
      h("div", { class: "ic" }, svgIcon(I.link)),
      h("div", { class: "tx" },
        h("span", { class: "nm" }, "Nyne Link"),
        h("span", { class: "sub" }, "5 devices nearby")),
      svgIcon(I.chevronLeft, "chev", 16));

    const home = h("div", { class: "cc-home g-dark" },
      h("div", { class: "l" },
        h("div", { class: "ic" }, svgIcon(I.home)),
        h("span", { class: "nm" }, "Home")),
      h("div", { class: "sub" }, "3 Scenes Active"));

    const handle = h("div", { class: "handle" }, h("i"));
    this.el.append(r1, r2, r3, sdBtn, home, handle);
    onChange(() => this.sync());
    this.sync();
  }

  private slider(fill: HTMLElement, icon: string, key: "brightness" | "volume") {
    const el = h("div", { class: "cc-slider g-dark" });
    el.append(fill, h("div", { class: "ic" }, svgIcon(icon)));
    const setFromY = (clientY: number) => {
      const r = el.getBoundingClientRect();
      const v = Math.round(100 - ((clientY - r.top) / r.height) * 100);
      set(key, Math.max(0, Math.min(100, v)));
    };
    el.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      setFromY(e.clientY);
      const mv = (ev: PointerEvent) => setFromY(ev.clientY);
      const up = () => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", up); };
      el.addEventListener("pointermove", mv);
      el.addEventListener("pointerup", up);
    });
    return el;
  }

  private sync() {
    this.brightFill.style.height = `${sys.brightness}%`;
    this.volFill.style.height = `${sys.volume}%`;
    for (const [key, el] of Object.entries(this.tgs)) {
      const on = sys[key as "wifi"];
      const ic = key === "wifi" && !on ? I.wifiOff : key === "bluetooth" && !on ? I.bluetoothOff : (el as any)._ic;
      toggle(svgIcon(ic), on, (key === "cellular" ? "green" : key === "airplane" ? "orange" : "blue"), el);
    }
    // carte média
    this.mediaSlot.replaceChildren();
    if (sys.playing) {
      this.mediaSlot.append(
        h("img", { class: "bg", attrs: { src: "/img/album.jpg", alt: "" } }),
        h("div", { class: "grad" },
          h("div", { class: "tt" }, "Midnight City"),
          h("div", { class: "ar" }, "M83"),
          h("div", { class: "ctrl" },
            svgIcon(I.skipBack),
            h("button", { class: "pp", onClick: () => set("playing", false) }, svgIcon(I.pause)),
            svgIcon(I.skipForward))));
    } else {
      this.mediaSlot.append(h("div", { class: "none" }, svgIcon(I.music), h("span", {}, "Not Playing")));
    }
  }

  open() { this.sy.to(0); }
  close() { this.sy.to(-tokens_H); }
  /** retourne true quand le panneau est complètement sorti (à retirer du DOM). */
  render(): boolean {
    this.el.style.transform = `translateY(${this.sy.v.toFixed(1)}px)`;
    return this.sy.v <= -tokens_H + 1 && this.sy.settled();
  }
}

const tokens_H = 850;
