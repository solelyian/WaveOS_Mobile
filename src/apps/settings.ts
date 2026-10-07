// settings.ts — Réglages : l'app système complète du prototype.
// Chaque contrôle agit vraiment sur le système (state.ts) — pas de décor :
// thème, fond d'écran, radios, focus, réduction de mouvement, taille du texte.
import { el } from "../core/el";
import { glyph } from "../core/icons";
import { on, set, sys, toggle } from "../system/state";
import type { GlyphName } from "../core/icons";

function row(icon: GlyphName, tint: string, label: string, ...right: HTMLElement[]): HTMLElement {
  const r = el("div", { class: "set-row", role: "button", tabindex: "0" },
    el("span", { class: "sic", style: `background:${tint}` }, glyph(icon)),
    el("span", { class: "lb" }, label),
    ...right,
  );
  return r;
}

function chev(): HTMLElement {
  const s = glyph("chevronR", "chev") as unknown as HTMLElement;
  return s;
}

function toggleEl<K extends "wifi" | "bt" | "airplane" | "focus" | "reduced" | "rotation" | "torch">(key: K): HTMLElement {
  const t = el("span", { class: `toggle${sys[key] ? " on" : ""}`, role: "switch", "aria-checked": String(sys[key]) });
  const sync = () => { t.classList.toggle("on", sys[key]); t.setAttribute("aria-checked", String(sys[key])); };
  on(key, sync);
  t.addEventListener("click", (e) => { e.stopPropagation(); toggle(key); });
  return t;
}

function rowToggle(icon: GlyphName, tint: string, label: string, key: "wifi" | "bt" | "airplane" | "focus" | "reduced" | "rotation" | "torch"): HTMLElement {
  const r = row(icon, tint, label, toggleEl(key));
  r.addEventListener("click", () => toggle(key));
  return r;
}

function segmented(label: string, options: [string, string][], get: () => string, apply: (v: string) => void): HTMLElement {
  const wrap = el("div", { style: "display:flex;gap:6px;flex:0 0 auto" });
  const refresh = () => {
    wrap.querySelectorAll("button").forEach((b) => {
      const sel = (b as HTMLElement).dataset.v === get();
      (b as HTMLElement).style.background = sel ? "#fff" : "transparent";
      (b as HTMLElement).style.color = sel ? "#14161F" : "rgba(255,255,255,.65)";
    });
  };
  for (const [v, txt] of options) {
    const b = el("button", { style: "height:28px;padding:0 12px;border-radius:14px;font-size:12.5px;font-weight:600;color:rgba(255,255,255,.65)" }, txt);
    b.dataset.v = v;
    b.addEventListener("click", (e) => { e.stopPropagation(); apply(v); refresh(); });
    wrap.append(b);
  }
  refresh();
  const r = row("sun", "#5570D6", label, wrap);
  return r;
}

function wallpaperRow(): HTMLElement {
  const r = row("photos", "#B04A78", "Fond d'écran");
  const sw = (variant: 0 | 1, css: string) => {
    const b = el("button", { "aria-label": variant === 0 ? "Rubans" : "Aube",
      style: `width:44px;height:44px;border-radius:14px;background:${css};margin-left:6px;box-shadow:0 0 0 1.5px ${sys.wallpaper === variant ? "var(--opale)" : "rgba(255,255,255,.15)"} inset` });
    const syncRing = () => { b.style.boxShadow = `0 0 0 ${sys.wallpaper === variant ? "2px var(--opale)" : "1.5px rgba(255,255,255,.15)"} inset`; };
    on("wallpaper", syncRing);
    b.addEventListener("click", (e) => { e.stopPropagation(); set("wallpaper", variant); });
    return b;
  };
  const wrap = el("span", { style: "display:flex;align-items:center" },
    sw(0, "radial-gradient(120% 120% at 30% 20%,#3a4aa8,#0B0F22 70%)"),
    sw(1, "linear-gradient(160deg,#EAF8F1,#9CD3D8)"));
  r.append(wrap);
  return r;
}

function sliderRow(icon: GlyphName, tint: string, label: string, key: "textScale" | "brightness", min: number, max: number): HTMLElement {
  const track = el("div", { class: "slider-h", role: "slider", "aria-label": label, tabindex: "0" });
  const fill = el("div", { class: "fill" });
  const thumb = el("div", { class: "thumb" });
  track.append(fill, thumb);
  const frac = () => (sys[key] - min) / (max - min);
  const sync = () => { const f = frac() * 100; fill.style.width = `${f}%`; thumb.style.left = `${f}%`; };
  on(key, sync); sync();
  const setFromX = (clientX: number) => {
    const r = track.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    set(key, min + f * (max - min) as never);
  };
  track.addEventListener("pointerdown", (e) => {
    setFromX(e.clientX);
    track.setPointerCapture(e.pointerId);
    const mv = (ev: PointerEvent) => setFromX(ev.clientX);
    const up = () => { track.removeEventListener("pointermove", mv); };
    track.addEventListener("pointermove", mv);
    track.addEventListener("pointerup", up, { once: true });
  });
  const r = row(icon, tint, label, track);
  r.querySelector(".slider-h")!.addEventListener("click", (e) => e.stopPropagation());
  return r;
}

export function settingsContent(): HTMLElement {
  const root = el("div", { style: "overflow-y:auto;max-height:660px;padding-bottom:20px" });
  root.append(
    el("div", { class: "set-search g g-thin" }, glyph("search"), "Rechercher"),
    // — Sans fil
    el("div", { class: "set-group" },
      rowToggle("wifi", "#3B6FD4", "Wi-Fi", "wifi"),
      rowToggle("bluetooth", "#5A7DE8", "Bluetooth", "bt"),
      rowToggle("airplane", "#E8903A", "Mode avion", "airplane")),
    // — Apparence
    el("div", { class: "set-group" },
      segmented("Apparence", [["dark", "Sombre"], ["light", "Clair"]],
        () => sys.theme, (v) => set("theme", v as "dark" | "light")),
      wallpaperRow()),
    // — Accessibilité
    el("div", { class: "set-group" },
      rowToggle("moon", "#8A7CFF", "Réduire les animations", "reduced"),
      sliderRow("search", "#5570D6", "Taille du texte", "textScale", 0.85, 1.6),
      sliderRow("sun", "#E8903A", "Luminosité", "brightness", 0.25, 1)),
    // — Concentration
    el("div", { class: "set-group" },
      rowToggle("bell", "#F0A02E", "Mode Focus", "focus")),
    // — Système
    el("div", { class: "set-group" },
      row("earpiece", "#2FCC92", "Nyne ID", chev()),
      row("timer", "#8A7CFF", "Temps d'écran", el("span", { class: "val" }, "3 h 12"), chev()),
      row("files", "#5A7DE8", "Stockage", el("span", { class: "val" }, "41 / 128 Go"), chev()),
      row("health", "#E84A5F", "Batterie", el("span", { class: "val" }, "87 %"), chev())),
    el("div", { class: "t-cap", style: "text-align:center;color:rgba(255,255,255,.35);margin-top:4px" }, "WaveOS 0.9 — prototype Sillage"),
  );
  return root;
}
