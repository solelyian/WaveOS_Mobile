// cc.ts — Control Center : commandes en verre, curseurs neutres et grille 4×4.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { sys, set, onChange, type SysState } from "../system/state";
import { Spring } from "../core/motion";
import { cur, next, prev } from "../system/media";

export class ControlCenter {
  el = h("div", { class: "sheet", attrs: { id: "cc" } });
  /** y : -H fermé → 0 ouvert (ressort shade). */
  sy = new Spring(-tokens_H, "shade");
  private brightFill = h("div", { class: "fill" });
  private volFill = h("div", { class: "fill" });
  private sliders: Partial<Record<"brightness" | "volume", HTMLElement>> = {};
  private mediaSlot = h("div", { class: "cc-media g-dark" });
  private tgs: Record<string, HTMLElement> = {};


  constructor() {
    // --- rangée du haut : compose (g) + réglages (d) ---
    const top = h("div", { class: "cc-top" },
      h("button", { class: "cc-corner g-dark", attrs: { "aria-label": "Edit controls" } }, svgIcon(I.squarePen, "", 24)),
      h("button", { class: "cc-corner g-dark", attrs: { "aria-label": "Settings" } }, svgIcon(I.settings, "", 24)));

    // --- ligne 1 : carte média | tuiles WiFi + Bluetooth empilées ---
    const conn = (key: "wifi" | "bluetooth", ic: string, name: string, cls: string) => {
      const b = h("button", { class: "cc-pill", attrs: { "aria-label": `${key === "wifi" ? "Wi-Fi" : "Bluetooth"}: ${name}` }, onClick: () => set(key, !sys[key]) },
        h("div", { class: `pi ${cls}` }, svgIcon(ic, "", 18)),
        h("div", { class: "tx" }, h("span", { class: "nm" }, name)));
      this.tgs[key] = b; (b as any)._ic = ic; (b as any)._pill = true;
      return b;
    };
    const r1 = h("div", { class: "cc-r1" },
      this.mediaSlot,
      h("div", { class: "cc-conn" },
        conn("wifi", I.wifi, "WAVE-5G", "blue"),
        conn("bluetooth", I.bluetooth, "Nyne Watch", "blue")));

    // --- ligne 2 : pilule Nyne Link | slider luminosité ---
    const r2 = h("div", { class: "cc-r2" },
      h("button", { class: "cc-pill", onClick: () => { this.close(); set("sheet", "sd"); } },
        h("div", { class: "pi link" }, svgIcon(I.link, "", 26)),
        h("div", { class: "tx" }, h("span", { class: "nm" }, "Nyne Link"))),
      this.slider(this.brightFill, I.sun, "brightness"));

    // --- ligne 3 : pilule Ne pas déranger | slider volume ---
    const r3 = h("div", { class: "cc-r2" },
      this.tgs.focus = h("button", { class: "cc-pill", attrs: { "aria-label": "Zen Mode" }, onClick: () => set("focus", !sys.focus) },
        h("div", { class: "pi focus" }, svgIcon(I.moon, "", 18)),
        h("div", { class: "tx" }, h("span", { class: "nm" }, "Zen Mode"))),
      this.slider(this.volFill, I.volume2, "volume"));
    Object.assign(this.tgs.focus, { _ic: I.moon, _pill: true });

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
    const grid = h("div", { class: "cc-grid" },
      ...TGS.map(([key, ic, label]) => {
        const b = h("button", { class: "cc-cell", onClick: () => set(key as never, !sys[key as never] as never) },
          h("div", { class: "cc-dot blue" }, svgIcon(ic, "", 26)),
          h("span", { class: "lb" }, label));
        this.tgs[key] = b; (b as any)._ic = ic;
        return b;
      }));

    this.el.append(top, r1, r2, r3, grid);
    onChange((key) => this.sync(key));
    this.sync();
  }

  private slider(fill: HTMLElement, icon: string, key: "brightness" | "volume") {
    const el = h("div", { class: "cc-hslider cc-slider", attrs: {
      role: "slider", tabindex: "0", "aria-label": key === "brightness" ? "Brightness" : "Volume",
      "aria-valuemin": "0", "aria-valuemax": "100",
    } });
    this.sliders[key] = el;
    el.append(h("div", { class: "track" }, fill), h("div", { class: "ic" }, svgIcon(icon, "", 24)));
    const setFromX = (clientX: number) => {
      const r = el.getBoundingClientRect();
      set(key, Math.max(0, Math.min(100, Math.round(((clientX - r.left) / r.width) * 100))));
    };
    let pointer: number | null = null;
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || pointer !== null) return;
      e.stopPropagation();
      pointer = e.pointerId;
      el.focus();
      el.setPointerCapture(e.pointerId);
      setFromX(e.clientX);
    });
    el.addEventListener("pointermove", (e) => { if (e.pointerId === pointer) setFromX(e.clientX); });
    const release = (e: PointerEvent) => { if (e.pointerId === pointer) pointer = null; };
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    el.addEventListener("lostpointercapture", release);
    el.addEventListener("keydown", (e) => {
      const delta = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key];
      if (delta === undefined && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      set(key, e.key === "Home" ? 0 : e.key === "End" ? 100 : Math.max(0, Math.min(100, sys[key] + delta!)));
    });
    return el;
  }

  private sync(changed?: keyof SysState) {
    this.brightFill.style.width = `${sys.brightness}%`;
    this.volFill.style.width = `${sys.volume}%`;
    for (const key of ["brightness", "volume"] as const) {
      this.sliders[key]?.setAttribute("aria-valuenow", String(sys[key]));
      this.sliders[key]?.setAttribute("aria-valuetext", `${sys[key]}%`);
    }
    for (const [key, el] of Object.entries(this.tgs)) {
      const on = (sys as unknown as Record<string, boolean>)[key];
      el.setAttribute("aria-pressed", String(!!on));
      const ic = key === "wifi" && !on ? I.wifiOff : key === "bluetooth" && !on ? I.bluetoothOff : (el as any)._ic;
      if ((el as any)._pill) {
        const pi = el.querySelector(".pi");
        if (pi) { pi.replaceChildren(svgIcon(ic, "", 26)); pi.classList.toggle("off", !on); }
      } else {
        const dot = el.querySelector(".cc-dot");
        if (dot) {
          const edge = dot.querySelector(":scope > .lg-edge");
          dot.replaceChildren(...(edge ? [edge] : []), svgIcon(ic, "", 30));
          dot.classList.toggle("on", !!on);
        }
      }
    }
    // carte média
    if (changed && changed !== "playing" && changed !== "track") return;
    const focusLabel = this.mediaSlot.contains(document.activeElement)
      ? document.activeElement?.getAttribute("aria-label") : null;
    const track = cur();
    const edge = this.mediaSlot.querySelector(":scope > .lg-edge");
    this.mediaSlot.replaceChildren(...(edge ? [edge] : []),
      h("button", { class: "cast", attrs: { "aria-label": "Audio devices" }, onClick: () => { this.close(); set("sheet", "sd"); } }, svgIcon(I.airplay, "", 18)),
      h("div", { class: "art" }, sys.playing
        ? h("img", { attrs: { src: track.art, alt: "" } })
        : svgIcon(I.music, "", 22)),
      h("div", { class: "media-title" }, sys.playing ? track.title : "Not playing"),
      h("div", { class: "tr" },
        h("button", { class: "tb", attrs: { "aria-label": "Previous track" }, onClick: prev }, svgIcon(I.skipBack, "", 22)),
        h("button", { class: "tb play", attrs: { "aria-label": "Play / Pause", "aria-pressed": String(sys.playing) }, onClick: () => set("playing", !sys.playing) }, svgIcon(sys.playing ? I.pause : I.play, "", 26)),
        h("button", { class: "tb", attrs: { "aria-label": "Next track" }, onClick: next }, svgIcon(I.skipForward, "", 22))));
    if (focusLabel) this.mediaSlot.querySelector<HTMLElement>(`[aria-label="${focusLabel}"]`)?.focus();
  }

  open() {
    this.sy.to(0);
  }
  close() { this.sy.to(-tokens_H); }
  /** retourne true quand le panneau est complètement sorti (à retirer du DOM). */
  render(): boolean {
    this.el.style.transform = `translateY(${this.sy.v.toFixed(1)}px)`;
    return this.sy.v <= -tokens_H + 1 && this.sy.settled();
  }
}

const tokens_H = 850;
