// cc.ts — Centre de contrôle, inspiration HarmonyOS : vue complète immédiate,
// éléments équidistants, chaque interrupteur est sa propre tuile (pas de
// panneau englobant), sliders horizontaux pleine largeur — plus gros, plus
// ronds, plus lisibles. L'entrée est une cascade : chaque panneau tombe avec
// un léger décalage piloté par le même ressort du geste.
import { el } from "../core/el";
import { glyph } from "../core/icons";
import { lucide } from "../core/lucide";
import { motion } from "../core/motion";
import { on, set, sys, toggle } from "../system/state";
import type { GlyphName } from "../core/icons";

type Key = "wifi" | "bt" | "airplane" | "focus" | "rotation" | "torch";

export class ControlCenter {
  node: HTMLElement;
  private tiles = new Map<Key, HTMLElement>();
  private playBtn: HTMLElement;
  private progress: HTMLElement;
  private playing = false;

  constructor(private onLock: () => void) {
    // Rangée de tête : Éditer à gauche, Réglages + Verrouiller à droite.
    const edit = el("button", { class: "cc-topbtn g g-thin", "aria-label": "Éditer le centre de contrôle" }, glyph("plus"));
    const gear = el("button", { class: "cc-topbtn g g-thin", "aria-label": "Réglages" }, glyph("settings"));
    const lock = el("button", { class: "cc-topbtn g g-thin", "aria-label": "Verrouiller" }, glyph("lockOri"));
    lock.addEventListener("click", (e) => { e.stopPropagation(); this.onLock(); });
    const top = el("div", { class: "cc-top" }, edit, el("span", { class: "flex1" }), gear, lock);

    // Carte média pleine largeur — art, méta, transport + progression.
    this.playBtn = el("span", { role: "button", "aria-label": "Lecture", class: "cc-pb" }, glyph("play"));
    this.playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.playing = !this.playing;
      this.playBtn.replaceChildren(glyph(this.playing ? "pause" : "play"));
    });
    this.progress = el("div", { class: "prog" });
    const media = el("div", { id: "cc-media", class: "g g-regular" },
      el("div", { class: "art" }),
      el("div", { class: "mt" },
        el("b", {}, "Sillage"),
        el("span", {}, "Lumen — Single"),
        el("div", { class: "track" }, this.progress)),
      el("div", { class: "mctl" }, glyph("prev"), this.playBtn, glyph("next")));

    // Interrupteurs : 8 tuiles indépendantes (4×2), icône libre sur tuile.
    const toggles = el("div", { class: "cc-toggles" },
      this.tile("wifi", "wifi", "Wi-Fi", () => sys.wifi ? "Nyx-5G" : "Inactif"),
      this.tile("bt", "bluetooth", "Bluetooth", () => sys.bt ? "Actif" : "Inactif"),
      this.tile("airplane", "airplane", "Avion", () => sys.airplane ? "Activé" : "Inactif"),
      this.tile("focus", "moon", "Focus", () => sys.focus ? "Activé" : "Inactif"),
      this.tile("rotation", "rotation", "Rotation", () => sys.rotation ? "Verrouillée" : "Libre"),
      this.tile("torch", "flashlight", "Torche", () => sys.torch ? "Allumée" : "Éteinte"),
      this.dummyTile("cast", "cast", "Diffusion"),
      this.dummyTile("key-round", "key-round", "VPN"));

    // Sliders horizontaux pleine largeur — signature HarmonyOS : massifs.
    const sliders = el("div", { class: "cc-hsliders" },
      this.hSlider("sun", "brightness", 0.25, 1, "Luminosité"),
      this.hSlider("volume", "volume", 0, 1, "Volume"));

    // Carte « Appareils » — super-device : ce que WaveOS voit autour.
    const devices = el("div", { id: "cc-devices", class: "g g-regular" },
      el("div", { class: "dev-head" }, el("span", {}, "Appareils"), glyph("chevronR")),
      el("div", { class: "dev-row" },
        this.device("Wave TV", "Écran partagé", "monitor-smartphone"),
        this.device("AirBuds Pro", "Connectés", "headphones"),
        this.device("Wave Watch", "À proximité", "smartphone")));

    this.node = el("div", { id: "layer-cc", class: "layer sheet", role: "dialog", "aria-label": "Centre de contrôle" },
      el("div", { class: "sheet-bg g g-thick" }),
      el("div", { class: "cc-inner" }, top, media, toggles, sliders, devices));
    this.node.addEventListener("click", (e) => { if (e.target === this.node || (e.target as HTMLElement).classList.contains("sheet-bg")) this.onClose?.(); });
  }

  onClose?: () => void;

  private tile(key: Key, ic: GlyphName, label: string, sub: () => string): HTMLElement {
    const bub = el("span", { class: "bub" }, glyph(ic));
    const subEl = el("span", { class: "st" }, sub());
    const t = el("div", { class: "cc2-tile", role: "switch", tabindex: "0" }, bub,
      el("span", { class: "tx" }, el("div", { class: "tt" }, label), subEl));
    const sync = () => { t.classList.toggle("on", sys[key]); subEl.textContent = sub(); };
    on(key, sync); sync();
    t.addEventListener("click", (e) => { e.stopPropagation(); toggle(key); });
    t.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(key); } });
    this.tiles.set(key, t);
    return t;
  }

  private dummyTile(name: string, ic: string, label: string): HTMLElement {
    const t = el("div", { class: "cc2-tile", role: "button", tabindex: "0", "aria-label": label },
      el("span", { class: "bub" }, lucide(ic)),
      el("span", { class: "tx" }, el("div", { class: "tt" }, label), el("span", { class: "st" }, "")));
    return t;
  }

  private device(name: string, st: string, ic: string): HTMLElement {
    return el("div", { class: "dev" },
      el("span", { class: "dic" }, lucide(ic)),
      el("span", { class: "dtx" }, el("b", {}, name), el("span", {}, st)));
  }

  private hSlider(ic: GlyphName, key: "brightness" | "volume", min: number, max: number, aria: string): HTMLElement {
    const fill = el("div", { class: "fill" });
    const s = el("div", { class: "cc-hslider g g-regular", role: "slider", tabindex: "0", "aria-label": aria },
      fill, el("span", { class: "sic" }, glyph(ic)));
    const frac = () => (sys[key] - min) / (max - min);
    const sync = () => { fill.style.width = `${frac() * 100}%`; };
    on(key, sync); sync();
    const setFromX = (clientX: number) => {
      const r = s.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      set(key, min + f * (max - min));
    };
    s.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      setFromX(e.clientX);
      s.setPointerCapture(e.pointerId);
      const mv = (ev: PointerEvent) => setFromX(ev.clientX);
      const up = () => s.removeEventListener("pointermove", mv);
      s.addEventListener("pointermove", mv);
      s.addEventListener("pointerup", up, { once: true });
    });
    return s;
  }

  /** p : 0 = rangé en haut, 1 = posé. Cascade interne : chaque bloc descend
   *  avec un décalage, comme les panneaux HarmonyOS qui « s'assemblent ». */
  render(p: number): void {
    const e = motion.easeOut(motion.clamp(p, 0, 1));
    this.node.style.transform = `translateY(${-(1 - e) * 852}px)`;
    this.node.style.visibility = p <= 0.001 ? "hidden" : "visible";
    const inner = this.node.querySelector(".cc-inner") as HTMLElement | null;
    if (!inner) return;
    for (let i = 0; i < inner.children.length; i++) {
      const k = inner.children[i] as HTMLElement;
      const pi = motion.clamp(p * 1.45 - i * 0.07, 0, 1);
      k.style.transform = `translateY(${(1 - motion.easeOut(pi)) * 34}px)`;
      k.style.opacity = String(Math.min(1, pi * 1.6));
    }
  }
}

