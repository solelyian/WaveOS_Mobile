// registry.ts — catalogue des apps du prototype : identité visuelle + contenu.
// Réglages est une vraie app ; Horloge et Photos ont du contenu réel léger ;
// les autres rendent une fenêtre placeholder propre (même coque, même morph).
import { el } from "../core/el";
import { appIcon, G, type GlyphName } from "../core/icons";
import { settingsContent } from "./settings";

export interface AppDef {
  id: string;
  name: string;
  glyph: GlyphName;
  c0: string; c1: string;        // dégradé de tuile
  ink?: string;                  // glyphe foncé sur tuile claire
  content?: () => HTMLElement;
}

export function phHero(title: string, sub: string): HTMLElement {
  return el("div", { class: "ph-hero g g-regular" },
    el("div", { class: "t-card", style: "color:#fff" }, title),
    el("div", { class: "t-cap", style: "margin-top:6px;color:rgba(255,255,255,.7)" }, sub),
    el("div", { class: "ph-line", style: "width:82%" }),
    el("div", { class: "ph-line", style: "width:64%" }),
  );
}

function clockContent(): HTMLElement {
  const face = el("div", { class: "ph-hero", style: "text-align:center;padding:40px 0;background:transparent" });
  const t = el("div", { class: "t-clock", style: "color:#fff;font-size:calc(88px*var(--ts))" }, "09:41");
  const tick = () => {
    const d = new Date();
    t.textContent = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  tick();
  face.append(t, el("div", { class: "t-cap", style: "color:rgba(255,255,255,.6);margin-top:6px" }, "Heure locale — Paris"));
  return face;
}

function photosContent(): HTMLElement {
  const grid = el("div", { style: "display:grid;grid-template-columns:repeat(3,1fr);gap:4px;border-radius:18px;overflow:hidden" });
  const hues = [210, 260, 320, 20, 40, 160, 190, 280, 340, 10, 60, 140];
  for (let i = 0; i < 12; i++) {
    const h = hues[i % hues.length];
    grid.append(el("div", {
      style: `aspect-ratio:1;background:linear-gradient(${140 + i * 23}deg,hsl(${h} 70% 62%),hsl(${(h + 40) % 360} 60% 38%))`,
    }));
  }
  return grid;
}

export const APPS: AppDef[] = [
  { id: "reglages",  name: "Réglages",   glyph: "settings",  c0: "#7A8090", c1: "#3A3F4D", content: settingsContent },
  { id: "messages",  name: "Messages",   glyph: "messages",  c0: "#67D99E", c1: "#1FA870" },
  { id: "photos",    name: "Photos",     glyph: "photos",    c0: "#F4F6FB", c1: "#C9D2EA", ink: "#B04A78", content: photosContent },
  { id: "horloge",   name: "Horloge",    glyph: "clock",     c0: "#2A2E40", c1: "#0E1020", content: clockContent },
  { id: "meteo",     name: "Météo",      glyph: "weather",   c0: "#5FA8E8", c1: "#2B66C9" },
  { id: "plans",     name: "Plans",      glyph: "maps",      c0: "#7BDC9A", c1: "#2E8B57" },
  { id: "notes",     name: "Notes",      glyph: "notes",     c0: "#F8F4E8", c1: "#E5DCBE", ink: "#8A7B4A" },
  { id: "rappels",   name: "Rappels",    glyph: "reminders", c0: "#FFB35C", c1: "#E87E1E" },
  { id: "store",     name: "Wave Store", glyph: "store",     c0: "#8FB0FF", c1: "#5570D6" },
  { id: "musique",   name: "Musique",    glyph: "music",     c0: "#FF9FB4", c1: "#E8446B" },
  { id: "calculette",name: "Calculette", glyph: "calc",      c0: "#4A4F60", c1: "#14161F" },
  { id: "camera",    name: "Caméra",     glyph: "camera",    c0: "#4A4F60", c1: "#191C28" },
  { id: "mail",      name: "Mail",       glyph: "mail",      c0: "#6BA8E8", c1: "#2B5CC9" },
  { id: "fichiers",  name: "Fichiers",   glyph: "files",     c0: "#9FB9F5", c1: "#4A6CC9" },
  { id: "sante",     name: "Santé",      glyph: "health",    c0: "#FF9E9E", c1: "#E84A5F" },
  { id: "bourse",    name: "Bourse",     glyph: "stocks",    c0: "#3A3F4D", c1: "#10121C" },
];

export const DOCK: AppDef[] = [
  { id: "telephone", name: "Téléphone",  glyph: "phone",     c0: "#67D99E", c1: "#1FA870" },
  { id: "navigateur",name: "Navigateur", glyph: "compass",   c0: "#8FB0FF", c1: "#5570D6" },
  { id: "messages",  name: "Messages",   glyph: "messages",  c0: "#67D99E", c1: "#1FA870" },
  { id: "musique",   name: "Musique",    glyph: "music",     c0: "#FF9FB4", c1: "#E8446B" },
];

export function iconFor(app: AppDef, size = 60): HTMLElement {
  return appIcon(app.id, G[app.glyph] as unknown as string[], app.c0, app.c1, size, app.ink ?? "rgba(255,255,255,0.94)");
}
