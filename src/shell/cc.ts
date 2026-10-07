// cc.ts — Centre de contrôle, gabarit HarmonyOS NEXT : carte média à gauche
// (hauteur de deux pilules), pilules de connectivité à droite, pilules larges
// « Appareils » / « Focus » face aux sliders horizontaux, puis grille dense
// d'icônes circulaires à libellé — chaque état actif est lumineux.
import { el } from "../core/el";
import { glyph } from "../core/icons";
import { hasLucide, lucide } from "../core/lucide";
import { motion } from "../core/motion";
import { spotlight } from "../core/spotlight";
import { on, set, sys, toggle } from "../system/state";
import type { GlyphName } from "../core/icons";

type Key = "wifi" | "bt" | "airplane" | "focus" | "rotation" | "torch";

export class ControlCenter {
  node: HTMLElement;
  private playBtn: HTMLElement;
  private playing = false;

  constructor(private onLock: () => void) {
    // Rangée de tête : Éditer à gauche, Réglages + Verrouiller à droite.
    const edit = el("button", { class: "cc-topbtn g g-thin", "aria-label": "Éditer le centre de contrôle" }, lucide("pencil"));
    const gear = el("button", { class: "cc-topbtn g g-thin", "aria-label": "Réglages" }, glyph("settings"));
    const lock = el("button", { class: "cc-topbtn g g-thin", "aria-label": "Verrouiller" }, glyph("lockOri"));
    lock.addEventListener("click", (e) => { e.stopPropagation(); this.onLock(); });
    const top = el("div", { class: "cc-top" }, edit, el("span", { class: "flex1" }), gear, lock);

    // Carte média — occupe la hauteur de deux pilules dans la colonne gauche.
    this.playBtn = el("span", { role: "button", "aria-label": "Lecture", class: "cc-pb" }, glyph("play"));
    this.playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.playing = !this.playing;
      this.playBtn.replaceChildren(glyph(this.playing ? "pause" : "play"));
    });
    const media = el("div", { id: "cc-media", class: "g g-regular" },
      el("div", { class: "art" }),
      el("div", { class: "mt" },
        el("b", {}, "Sillage"),
        el("span", {}, "Lumen — Single"),
        el("div", { class: "mctl" }, glyph("prev"), this.playBtn, glyph("next"))));
    spotlight(media);

    // Pilules larges — connectivité à droite, super-device / focus à gauche.
    const wifi = this.pill("wifi", "wifi", "Wi-Fi", () => sys.wifi ? "Nyx-5G" : "Inactif");
    const bt = this.pill("bt", "bluetooth", "Bluetooth", () => sys.bt ? "Actif" : "Inactif");
    const devices = this.pillBtn("monitor-smartphone", "Appareils", "Wave TV, AirBuds…");
    const focus = this.pill("focus", "moon", "Focus", () => sys.focus ? "Activé" : "Inactif");

    // Sliders horizontaux (colonne droite) — morph pilule géante au toucher.
    const sBright = this.hSlider("sun", "brightness", 0.25, 1, "Luminosité");
    const sVol = this.hSlider("volume", "volume", 0, 1, "Volume");

    // Placement gabarit : média à gauche sur 2 rangées, connectivité à
    // droite, puis pilule large + slider en vis-à-vis sur chaque rangée.
    media.style.gridArea = "media"; wifi.style.gridArea = "wifi"; bt.style.gridArea = "bt";
    devices.style.gridArea = "dev"; sBright.style.gridArea = "bright";
    focus.style.gridArea = "focus"; sVol.style.gridArea = "vol";
    const main = el("div", { class: "cc-main" }, media, wifi, bt, devices, sBright, focus, sVol);

    // Grille dense d'icônes circulaires — 4 colonnes, libellé dessous.
    const iconGrid = el("div", { class: "cc-iconGrid" },
      this.icell("torch", "flashlight", "Torche", () => sys.torch, () => toggle("torch")),
      this.icell("sonnerie", "bell", "Sonnerie", () => sys.volume > 0, () => set("volume", sys.volume > 0 ? 0 : 0.55)),
      this.icell("rotation", "rotation", "Rotation", () => sys.rotation, () => toggle("rotation")),
      this.icellBtn("scan-line", "Scanner"),
      this.icellBtn("share-2", "Partager"),
      this.icell("airplane", "airplane", "Avion", () => sys.airplane, () => toggle("airplane")),
      this.icellBtn("signal-high", "Données"),
      this.icellBtn("globe", "Hotspot"),
      this.icellBtn("camera", "Capture"),
      this.icellBtn("video", "Enregistrer"),
      this.icellBtn("cast", "Diffusion"),
      this.icellBtn("music", "Musique"),
      this.icellBtn("map-pin", "Localisation"),
      this.icellBtn("nfc", "NFC"),
      this.icellBtn("key-round", "VPN"),
      this.icell("sombre", "moon", "Sombre", () => sys.theme === "dark", () => set("theme", sys.theme === "dark" ? "light" : "dark")));

    this.node = el("div", { id: "layer-cc", class: "layer sheet", role: "dialog", "aria-label": "Centre de contrôle" },
      el("div", { class: "sheet-bg g g-thick" }),
      el("div", { class: "cc-inner" }, top, main, iconGrid));
    this.node.addEventListener("click", (e) => { if (e.target === this.node || (e.target as HTMLElement).classList.contains("sheet-bg")) this.onClose?.(); });
  }

  onClose?: () => void;

  /** Pilule large (état réel) — icône à gauche, titre + sous-titre. */
  private pill(key: Key, ic: GlyphName, label: string, sub: () => string): HTMLElement {
    const subEl = el("span", { class: "ps" }, sub());
    const t = el("div", { class: "cc-pill", role: "switch", tabindex: "0", "aria-label": label },
      el("span", { class: "pic" }, glyph(ic)),
      el("span", { class: "ptx" }, el("b", {}, label), subEl));
    spotlight(t);
    const sync = () => { t.classList.toggle("on", sys[key]); subEl.textContent = sub(); };
    on(key, sync); sync();
    t.addEventListener("click", (e) => { e.stopPropagation(); toggle(key); });
    t.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(key); } });
    return t;
  }

  /** Pilule large d'entrée (sans état) — comme « Appareils » : point d'entrée. */
  private pillBtn(ic: string, label: string, sub: string): HTMLElement {
    const t = el("div", { class: "cc-pill entry", role: "button", tabindex: "0", "aria-label": label },
      el("span", { class: "pic" }, hasLucide(ic) ? lucide(ic) : glyph(ic as GlyphName)),
      el("span", { class: "ptx" }, el("b", {}, label), el("span", { class: "ps" }, sub)));
    spotlight(t);
    t.addEventListener("click", (e) => { e.stopPropagation(); t.classList.remove("ping"); void (t as HTMLElement).offsetWidth; t.classList.add("ping"); });
    return t;
  }

  /** Cellule de la grille d'icônes — état réel. */
  private icell(_id: string, ic: GlyphName, label: string, isOn: () => boolean, act: () => void): HTMLElement {
    const t = el("div", { class: "ccg", role: "switch", tabindex: "0", "aria-label": label },
      el("span", { class: "cb" }, glyph(ic)),
      el("span", { class: "cl" }, label));
    const sync = () => t.classList.toggle("on", isOn());
    const keys = ["wifi", "bt", "airplane", "focus", "rotation", "torch", "theme", "volume"] as const;
    keys.forEach((k) => on(k, sync)); sync();
    t.addEventListener("click", (e) => { e.stopPropagation(); act(); });
    t.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); act(); } });
    return t;
  }

  /** Cellule factice — même rendu, pas d'état. */
  private icellBtn(ic: string, label: string): HTMLElement {
    const t = el("div", { class: "ccg", role: "button", tabindex: "0", "aria-label": label },
      el("span", { class: "cb" }, hasLucide(ic) ? lucide(ic) : glyph(ic as GlyphName)),
      el("span", { class: "cl" }, label));
    spotlight(t.querySelector(".cb") as HTMLElement);
    t.addEventListener("click", (e) => { e.stopPropagation(); });
    return t;
  }

  private hSlider(ic: GlyphName, key: "brightness" | "volume", min: number, max: number, aria: string): HTMLElement {
    const fill = el("div", { class: "fill" });
    const s = el("div", { class: "cc-hslider g g-regular", role: "slider", tabindex: "0", "aria-label": aria },
      fill, el("span", { class: "sic" }, glyph(ic)));
    spotlight(s);
    const frac = () => (sys[key] - min) / (max - min);
    const sync = () => { fill.style.width = `${frac() * 100}%`; };
    on(key, sync); sync();
    // Morph « capsule → pilule géante » tant que le doigt tient : la capsule
    // grandit et se soulève (signature HarmonyOS), puis « edge stretch » en
    // butée — elle s'étire contre le bord et reprend sa forme avec un rebond.
    let held = false;
    let overK = 0;
    const apply = () => {
      s.style.transition = held ? "transform .3s cubic-bezier(.2,1.2,.36,1)" : "";
      s.style.transformOrigin = "center";
      s.style.transform = held
        ? `translateY(-5px) scale(${1.045 + overK}, ${1.13 - overK * 0.7})`
        : "";
    };
    const settle = () => {
      held = false; overK = 0;
      s.style.transition = "transform .5s cubic-bezier(.2,1.6,.32,1)";
      s.style.transform = "";
      window.setTimeout(() => { s.style.transition = ""; }, 520);
    };
    const setFromX = (clientX: number) => {
      const r = s.getBoundingClientRect();
      const raw = (clientX - r.left) / r.width;
      const f = Math.min(1, Math.max(0, raw));
      set(key, min + f * (max - min));
      const over = raw < 0 ? -raw * r.width : raw > 1 ? (raw - 1) * r.width : 0;
      const nk = Math.min(over / 90, 1) * 0.08;
      if (nk !== overK) { overK = nk; apply(); }
    };
    s.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      held = true; apply();
      setFromX(e.clientX);
      s.setPointerCapture(e.pointerId);
      const mv = (ev: PointerEvent) => setFromX(ev.clientX);
      const up = () => { s.removeEventListener("pointermove", mv); settle(); };
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
