// icons.ts — tuiles glossy PNG + glyphes Lucide.
// Les icônes d'apps sont des PNG générés (voir tools/extract-icons.py) masqués
// squircle côté CSS ; les glyphes système viennent de Lucide (ISC).
import { lucide } from "./lucide";

// ---- correspondance glyphe → nom Lucide ----
const LU = {
  settings: "settings", messages: "message-square", photos: "image", clock: "clock",
  weather: "cloud-sun", maps: "map-pin", notes: "notebook-text", reminders: "check-circle",
  store: "shopping-bag", music: "music", calc: "calculator", camera: "camera",
  mail: "mail", files: "folder", health: "heart-pulse", phone: "phone",
  compass: "compass", wallet: "wallet", stocks: "chart-line",
  wifi: "wifi", bluetooth: "bluetooth", airplane: "plane", moon: "moon",
  flashlight: "flashlight", rotation: "rotate-cw", sun: "sun", volume: "volume-2",
  play: "play", pause: "pause", next: "skip-forward", prev: "skip-back",
  chevronR: "chevron-right", chevronL: "chevron-left", x: "x", plus: "plus",
  minus: "minus", search: "search", bell: "bell", lockOri: "lock", timer: "timer",
  battery: "battery-full", cellular: "signal-high", earpiece: "speaker",
} as const;

export type GlyphName = keyof typeof LU;

/** Glyphe Lucide autonome (stroke currentColor, viewBox 24). */
export function glyph(name: GlyphName, cls = ""): SVGElement {
  return lucide(LU[name], cls);
}

// ---- tuiles glossy : nom de glyphe → PNG du pack (public/icons) ----
// Les tuiles PNG ont leurs coins squircle cuits dedans ; un border-radius
// ~22.5% en CSS rogne les coins sombres résiduels du recadrage.
const ICON_PNG: Partial<Record<GlyphName, string>> = {
  settings: "reglages", messages: "messages", photos: "photos", clock: "horloge",
  weather: "meteo", maps: "plans", notes: "notes", reminders: "rappels",
  store: "store", music: "musique", calc: "calculette", camera: "camera",
  mail: "mail", files: "fichiers", health: "sante", phone: "telephone",
  compass: "navigateur", stocks: "bourse",
};

/** Tuile d'icône : PNG glossy du pack, masqué squircle par CSS. */
export function appIcon(id: string, glyphName: GlyphName, _c0: string, _c1: string, size = 60, _ink = "rgba(255,255,255,0.94)"): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "icon";
  const img = document.createElement("img");
  img.src = `/icons/${ICON_PNG[glyphName] ?? id}.png`;
  img.alt = "";
  img.width = size;
  img.height = size;
  img.draggable = false;
  img.setAttribute("aria-hidden", "true");
  wrap.append(img);
  return wrap;
}

// Alias de compatibilité : G[names] donnait des paths, il donne le nom Lucide.
export const G = LU;
