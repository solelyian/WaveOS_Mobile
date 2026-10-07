// cc.ts — Centre de contrôle : cluster 2×2 radios, carte média, sliders
// verticaux (luminosité réelle + volume), pilule Focus, mini-rangée.
// États colorés : activé = bulle blanche sur teinte d'accent, sinon verre.
import { el } from "../core/el";
import { glyph } from "../core/icons";
import { motion } from "../core/motion";
import { on, set, sys, toggle } from "../system/state";
import type { GlyphName } from "../core/icons";

type Key = "wifi" | "bt" | "airplane" | "focus" | "rotation" | "torch";

export class ControlCenter {
  node: HTMLElement;
  private tiles = new Map<Key, HTMLElement>();
  private playBtn: HTMLElement;
  private playing = false;

  constructor(private onLock: () => void) {
    const cluster = el("div", { class: "cc-cluster g g-regular" },
      this.tile("wifi", "wifi", "Wi-Fi", () => sys.wifi ? "Nyx-5G" : "Inactif", "#3B6FD4"),
      this.tile("bt", "bluetooth", "Bluetooth", () => sys.bt ? "Actif" : "Inactif", "#5570D6"),
      this.tile("airplane", "airplane", "Avion", () => sys.airplane ? "Activé" : "Inactif", "#E8903A"),
      this.tile("focus", "moon", "Focus", () => sys.focus ? "Activé" : "Inactif", "#F0A02E"));

    this.playBtn = el("span", { role: "button", "aria-label": "Lecture" }, glyph("play"));
    this.playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.playing = !this.playing;
      this.playBtn.replaceChildren(glyph(this.playing ? "pause" : "play"));
    });
    const media = el("div", { id: "cc-media", class: "g g-regular" },
      el("div", { class: "art" }),
      el("div", { class: "mt" }, el("b", {}, "Sillage"), el("span", {}, "Lumen — Single")),
      el("div", { class: "mctl" }, glyph("prev"), this.playBtn, glyph("next")));

    const sliders = el("div", { class: "cc-sliders" },
      this.vSlider("sun", "brightness", 0.25, 1),
      this.vSlider("volume", "volume", 0, 1));

    const focus = el("div", { id: "cc-focus", class: "g g-regular", role: "button", tabindex: "0" },
      el("span", { class: "bub" }, glyph("moon")),
      el("span", {}, el("b", {}, "Focus"), el("span", {}, "Silence jusqu'à 19:00")));
    const syncFocus = () => focus.classList.toggle("on", sys.focus);
    on("focus", syncFocus); syncFocus();
    focus.addEventListener("click", (e) => { e.stopPropagation(); toggle("focus"); });

    const row2 = el("div", { class: "cc-row2" },
      this.mini("rotation", "rotation"),
      this.mini("torch", "flashlight"),
      el("button", { class: "cc-mini g g-regular", "aria-label": "Verrouiller" }, glyph("lockOri")));

    (row2.lastChild as HTMLElement).addEventListener("click", (e) => { e.stopPropagation(); this.onLock(); });

    this.node = el("div", { id: "layer-cc", class: "layer sheet", role: "dialog", "aria-label": "Centre de contrôle" },
      el("div", { class: "sheet-bg g g-thick" }),
      el("div", { class: "cc-inner" }, cluster, media, sliders, focus, row2));
    this.node.addEventListener("click", (e) => { if (e.target === this.node || (e.target as HTMLElement).classList.contains("sheet-bg")) this.closeSelf(); });
  }

  private closeSelf(): void { this.onClose?.(); }
  onClose?: () => void;

  private tile(key: Key, ic: GlyphName, label: string, sub: () => string, accent: string): HTMLElement {
    const bub = el("span", { class: "bub" }, glyph(ic));
    const subEl = el("span", { class: "st" }, sub());
    const t = el("div", { class: "cc-tile", role: "switch", tabindex: "0", style: `--accent:${accent}` },
      bub, el("span", {}, el("div", { class: "tt" }, label), subEl));
    const sync = () => { t.classList.toggle("on", sys[key]); subEl.textContent = sub(); };
    on(key, sync); sync();
    t.addEventListener("click", (e) => { e.stopPropagation(); toggle(key); });
    this.tiles.set(key, t);
    return t;
  }

  private mini(key: Key, ic: GlyphName): HTMLElement {
    const m = el("button", { class: "cc-mini g g-regular", "aria-label": key }, glyph(ic));
    const sync = () => { m.style.background = sys[key] ? "rgba(255,255,255,.8)" : ""; m.style.color = sys[key] ? "#14161F" : "#fff"; };
    on(key, sync); sync();
    m.addEventListener("click", (e) => { e.stopPropagation(); toggle(key); });
    return m;
  }

  private vSlider(ic: GlyphName, key: "brightness" | "volume", min: number, max: number): HTMLElement {
    const fill = el("div", { class: "fill" });
    const s = el("div", { class: "cc-slider g g-regular", role: "slider", tabindex: "0", "aria-label": key },
      fill, el("span", { class: "sic" }, glyph(ic)));
    const frac = () => (sys[key] - min) / (max - min);
    const sync = () => { fill.style.height = `${frac() * 100}%`; };
    on(key, sync); sync();
    const setFromY = (clientY: number) => {
      const r = s.getBoundingClientRect();
      const f = 1 - Math.min(1, Math.max(0, (clientY - r.top) / r.height));
      set(key, min + f * (max - min));
    };
    s.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      setFromY(e.clientY);
      s.setPointerCapture(e.pointerId);
      const mv = (ev: PointerEvent) => setFromY(ev.clientY);
      const up = () => s.removeEventListener("pointermove", mv);
      s.addEventListener("pointermove", mv);
      s.addEventListener("pointerup", up, { once: true });
    });
    return s;
  }

  /** p : 0 = rangé en haut, 1 = posé. */
  render(p: number): void {
    const e = motion.easeOut(motion.clamp(p, 0, 1));
    this.node.style.transform = `translateY(${-(1 - e) * 852}px)`;
    this.node.style.visibility = p <= 0.001 ? "hidden" : "visible";
  }
}
