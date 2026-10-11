// theme.ts — moteur « Monet » : extraction de la teinte dominante du wallpaper
// puis palette tonale appliquée aux accents du système via les variables CSS
// --accent / --accent-soft posées sur #phone (re-teinte live, sans re-render).
export interface Theme {
  dynamic: boolean;           // couleurs dynamiques actives
  accent: string;             // teinte principale appliquée
  accentSoft: string;         // variante pâle (fonds teintés, pills)
  palette: string[];          // teintes candidates extraites du wallpaper
}

const KEY = "waveos.theme";
const listeners = new Set<() => void>();

export const theme: Theme = {
  dynamic: false,
  accent: "#2563eb",
  accentSoft: "rgba(37,99,235,.14)",
  palette: ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0d9488"],
};

const PRESETS = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0d9488"];

function notify() {
  applyVars();
  for (const l of listeners) l();
}

function applyVars() {
  const phone = document.getElementById("phone");
  if (!phone) return;
  phone.style.setProperty("--accent", theme.accent);
  phone.style.setProperty("--accent-soft", theme.accentSoft);
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ dynamic: theme.dynamic, accent: theme.accent }));
  } catch { /* stockage indisponible */ }
}

function restore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const t = JSON.parse(raw) as { dynamic?: boolean; accent?: string };
    if (typeof t.dynamic === "boolean") theme.dynamic = t.dynamic;
    if (typeof t.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(t.accent)) theme.accent = t.accent;
    theme.accentSoft = softOf(theme.accent);
  } catch { /* JSON corrompu */ }
}

/* ---------- palette tonale ---------- */
export function softOf(hex: string): string {
  const { r, g, b } = rgbOf(hex);
  return `rgba(${r},${g},${b},.14)`;
}
function rgbOf(hex: string) {
  return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
}
function hslOf(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return { h: 0, s: 0, l };
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = 0;
  if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (mx === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}
export function hexOf(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/* ---------- extraction Monet : teinte dominante pondérée ---------- */
export function extractPalette(imgUrl: string): Promise<string[]> {
  return new Promise((resolve) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => {
      try {
        const cv = document.createElement("canvas");
        cv.width = cv.height = 48;
        const ctx = cv.getContext("2d")!;
        ctx.drawImage(im, 0, 0, 48, 48);
        const d = ctx.getImageData(0, 0, 48, 48).data;
        // histogramme de teintes pondéré par saturation × proximité de luminance .55
        const bins = new Float64Array(36);
        for (let i = 0; i < d.length; i += 4) {
          const { h, s, l } = hslOf(d[i], d[i + 1], d[i + 2]);
          if (s < 0.18 || l < 0.12 || l > 0.92) continue;
          const w = s * (1 - Math.abs(l - 0.55) * 1.1);
          bins[Math.floor(h / 10) % 36] += Math.max(0, w);
        }
        const order = [...bins.keys()].sort((a, b) => bins[b] - bins[a]);
        const hues: number[] = [];
        for (const k of order) {
          if (bins[k] <= 0 || hues.length >= 3) break;
          const h = k * 10 + 5;
          if (hues.every((p) => Math.min(Math.abs(p - h), 360 - Math.abs(p - h)) > 30)) hues.push(h);
        }
        if (!hues.length) { resolve([]); return; }
        const pal = hues.map((h, i) => hexOf(h, Math.max(0.55, 0.72 - i * 0.1), 0.5));
        // variantes manuelles harmonieuses autour de la dominante
        for (const dh of [30, -40, 170]) if (pal.length < 6) pal.push(hexOf(hues[0] + dh, 0.6, 0.5));
        resolve(pal.concat(PRESETS).slice(0, 6));
      } catch { resolve([]); }
    };
    im.onerror = () => resolve([]);
    im.src = imgUrl;
  });
}

/* ---------- API ---------- */
export function setAccent(hex: string) {
  theme.accent = hex; theme.accentSoft = softOf(hex); persist(); notify();
}
export function setDynamic(on: boolean) {
  theme.dynamic = on;
  if (on && theme.palette.length) { theme.accent = theme.palette[0]; theme.accentSoft = softOf(theme.accent); }
  else { theme.accent = "#2563eb"; theme.accentSoft = softOf(theme.accent); }
  persist(); notify();
}
export function applyExtracted(pal: string[]) {
  if (pal.length) theme.palette = pal;
  if (theme.dynamic && pal.length) { theme.accent = pal[0]; theme.accentSoft = softOf(pal[0]); }
  persist(); notify();
}
export function onTheme(fn: () => void): () => void {
  listeners.add(fn); return () => { listeners.delete(fn); };
}

/* ---------- boot ---------- */
export function initTheme(wallUrl = "/img/wallpaper.jpg") {
  restore();
  applyVars();
  void extractPalette(wallUrl).then(applyExtracted);
}
export function reextract(wallUrl: string) {
  void extractPalette(wallUrl).then(applyExtracted);
}
