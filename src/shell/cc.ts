// cc.ts — Control Center : grille connectivité 2×2, carte média, sliders verticaux,
// Focus + rotate/airplay, utilitaires, pilule Home (layout maquette 1:1).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { sys, set, onChange } from "../system/state";
import { Spring } from "../core/motion";
import { liquidGlass } from "./glass";

export class ControlCenter {
  el = h("div", { class: "sheet", attrs: { id: "cc" } });
  /** y : -H fermé → 0 ouvert (ressort shade). */
  sy = new Spring(-tokens_H, "shade");
  private brightFill = h("div", { class: "fill" });
  private volFill = h("div", { class: "fill" });
  private mediaSlot = h("div", { class: "cc-media g-dark" });
  private tgs: Record<string, HTMLElement> = {};


  constructor() {
    // --- rangée du haut : compose (g) + réglages (d) ---
    const top = h("div", { class: "cc-top" },
      h("button", { class: "cc-corner g-dark" }, svgIcon(I.squarePen, "", 16)),
      h("button", { class: "cc-corner g-dark" }, svgIcon(I.settings, "", 16)));

    // --- ligne 1 : carte média | tuiles WiFi + Bluetooth empilées ---
    const conn = (key: "wifi" | "bluetooth", ic: string, name: string, sub: string, cls: string) => {
      const b = h("button", { class: `cc-pill g-dark`, onClick: () => set(key, !sys[key]) },
        h("div", { class: `pi ${cls}` }, svgIcon(ic, "", 18)),
        h("div", { class: "tx" }, h("span", { class: "nm" }, name), h("span", { class: "sub" }, sub)));
      this.tgs[key] = b; (b as any)._ic = ic; (b as any)._pill = true;
      return b;
    };
    const r1 = h("div", { class: "cc-r1" },
      this.mediaSlot,
      h("div", { class: "cc-conn" },
        conn("wifi", I.wifi, "WiFi", "WAVE-5G", "blue"),
        conn("bluetooth", I.bluetooth, "Bluetooth", "Nyne Watch", "blue")));

    // --- ligne 2 : pilule Nyne Link | slider luminosité ---
    const r2 = h("div", { class: "cc-r2" },
      h("button", { class: "cc-pill g-dark", onClick: () => { this.close(); set("sheet", "sd"); } },
        h("div", { class: "pi link" }, svgIcon(I.link, "", 18)),
        h("div", { class: "tx" }, h("span", { class: "nm" }, "Nyne Link"), h("span", { class: "sub" }, "5 devices nearby"))),
      this.slider(this.brightFill, I.sun, "brightness", "green"));

    // --- ligne 3 : pilule Ne pas déranger | slider volume ---
    const r3 = h("div", { class: "cc-r2" },
      h("button", { class: "cc-pill g-dark", onClick: () => set("focus", !sys.focus) },
        h("div", { class: "pi indigo" }, svgIcon(I.moon, "", 16)),
        h("div", { class: "tx" }, h("span", { class: "nm" }, "Zen Mode"))),
      this.slider(this.volFill, I.volume2, "volume", "orange"));

    // --- grille 4×N de toggles ronds + labels ---
    const TGS: [string, string, string][] = [
      ["cellular", I.signal, "Mobile data"], ["orientationLock", I.rotateCcw, "Orientation lock"],
      ["recorder", I.video, "Screen recorder"], ["flashlight", I.flashlight, "Flashlight"],
      ["nfc", I.nfc, "NFC"], ["share", I.share, "Nyne Share"],
      ["hotspot", I.globe, "Personal hotspot"], ["nearlink", I.zap, "NearLink"],
      ["screencast", I.screenShare, "ScreenCast"], ["sound", I.bell, "Sound"],
      ["location", I.mapPin, "Location"], ["darkMode", I.moonStar, "Dark mode"],
      ["airplane", I.plane, "Airplane mode"], ["screenshot", I.scissors, "Screenshot"],
      ["scan", I.scanLine, "Scan"], ["remote", I.tv, "Smart Remote"],
    ];
    const TINT: Record<string, string> = { cellular: "blue", flashlight: "green", share: "blue", hotspot: "blue", cast: "green", sound: "blue", location: "blue", dark: "blue", airplane: "blue", nearlink: "red" };
    const grid = h("div", { class: "cc-grid" },
      ...TGS.map(([key, ic, label]) => {
        const b = h("button", { class: "cc-cell", onClick: () => set(key as never, !sys[key as never] as never) },
          h("div", { class: `cc-dot ${TINT[key] ?? "dim"}` }, svgIcon(ic, "", 20)),
          h("span", { class: "lb" }, label));
        this.tgs[key] = b; (b as any)._ic = ic;
        return b;
      }));

    const handle = h("div", { class: "handle" }, h("i"));
    this.el.append(top, r1, r2, r3, grid, handle);
    // chaque surface verre → moteur (réfraction + filet + caustique)
    requestAnimationFrame(() => {
      for (const t of this.el.querySelectorAll<HTMLElement>(".g-dark")) {
        liquidGlass(t);
      }
    });
    onChange(() => this.sync());
    this.sync();
  }

  private slider(fill: HTMLElement, icon: string, key: "brightness" | "volume", tint: string) {
    const el = h("div", { class: `cc-hslider g-dark ${tint}` });
    el.append(fill, h("div", { class: "ic" }, svgIcon(icon, "", 18)));
    const setFromX = (clientX: number) => {
      const r = el.getBoundingClientRect();
      set(key, Math.max(0, Math.min(100, Math.round(((clientX - r.left) / r.width) * 100))));
    };
    el.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      setFromX(e.clientX);
      const mv = (ev: PointerEvent) => setFromX(ev.clientX);
      const up = () => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", up); };
      el.addEventListener("pointermove", mv);
      el.addEventListener("pointerup", up);
    });
    return el;
  }

  private sync() {
    this.brightFill.style.width = `${sys.brightness}%`;
    this.volFill.style.width = `${sys.volume}%`;
    for (const [key, el] of Object.entries(this.tgs)) {
      const on = (sys as unknown as Record<string, boolean>)[key];
      const ic = key === "wifi" && !on ? I.wifiOff : key === "bluetooth" && !on ? I.bluetoothOff : (el as any)._ic;
      if ((el as any)._pill) {
        const pi = el.querySelector(".pi");
        if (pi) { pi.replaceChildren(svgIcon(ic, "", 18)); pi.classList.toggle("off", !on); }
      } else {
        const dot = el.querySelector(".cc-dot");
        if (dot) { dot.replaceChildren(svgIcon(ic, "", 20)); dot.classList.toggle("on", !!on); }
      }
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
      this.mediaSlot.append(h("div", { class: "none" },
        h("div", { class: "mrow" },
          h("div", { style: "width:56px;height:56px;border-radius:14px;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;flex:none" }, svgIcon(I.music, "", 22)),
          h("span", {}, "Not playing")),
        h("div", { class: "tr" }, svgIcon(I.skipBack), svgIcon(I.play), svgIcon(I.skipForward))));
    }
  }

  open() {
    this.sy.to(0);
    requestAnimationFrame(() => {
      for (const t of this.el.querySelectorAll<HTMLElement>(".g-dark")) {
        liquidGlass(t, { radius: 30, blur: 5, scale: 14 });
      }
    });
  }
  close() { this.sy.to(-tokens_H); }
  /** retourne true quand le panneau est complètement sorti (à retirer du DOM). */
  render(): boolean {
    this.el.style.transform = `translateY(${this.sy.v.toFixed(1)}px)`;
    return this.sy.v <= -tokens_H + 1 && this.sy.settled();
  }
}

const tokens_H = 850;
