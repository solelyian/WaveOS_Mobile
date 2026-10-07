// registry.ts — catalogue des apps du prototype : identité visuelle + contenu.
// Chaque app rend du vrai contenu structuré (contents.ts) — plus de
// placeholders. Réglages reste l'app système complète.
import { el } from "../core/el";
import { appIcon, type GlyphName } from "../core/icons";
import { settingsContent } from "./settings";
import {
  bourseContent, calcContent, cameraContent, clockContent, fichiersContent,
  mailContent, meteoContent, messagesContent, musicContent, navContent,
  notesContent, phoneContent, photosContent, plansContent, rappelsContent,
  santeContent, storeContent,
} from "./contents";

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

export const APPS: AppDef[] = [
  { id: "reglages",   name: "Réglages",   glyph: "settings",  c0: "#7A8090", c1: "#3A3F4D", content: settingsContent },
  { id: "messages",   name: "Messages",   glyph: "messages",  c0: "#67D99E", c1: "#1FA870", content: messagesContent },
  { id: "photos",     name: "Photos",     glyph: "photos",    c0: "#F4F6FB", c1: "#C9D2EA", ink: "#B04A78", content: photosContent },
  { id: "horloge",    name: "Horloge",    glyph: "clock",     c0: "#2A2E40", c1: "#0E1020", content: clockContent },
  { id: "meteo",      name: "Météo",      glyph: "weather",   c0: "#5FA8E8", c1: "#2B66C9", content: meteoContent },
  { id: "plans",      name: "Plans",      glyph: "maps",      c0: "#7BDC9A", c1: "#2E8B57", content: plansContent },
  { id: "notes",      name: "Notes",      glyph: "notes",     c0: "#F8F4E8", c1: "#E5DCBE", ink: "#8A7B4A", content: notesContent },
  { id: "rappels",    name: "Rappels",    glyph: "reminders", c0: "#FFB35C", c1: "#E87E1E", content: rappelsContent },
  { id: "store",      name: "Wave Store", glyph: "store",     c0: "#8FB0FF", c1: "#5570D6", content: storeContent },
  { id: "musique",    name: "Musique",    glyph: "music",     c0: "#FF9FB4", c1: "#E8446B", content: musicContent },
  { id: "calculette", name: "Calculette", glyph: "calc",      c0: "#4A4F60", c1: "#14161F", content: calcContent },
  { id: "camera",     name: "Caméra",     glyph: "camera",    c0: "#4A4F60", c1: "#191C28", content: cameraContent },
  { id: "mail",       name: "Mail",       glyph: "mail",      c0: "#6BA8E8", c1: "#2B5CC9", content: mailContent },
  { id: "fichiers",   name: "Fichiers",   glyph: "files",     c0: "#9FB9F5", c1: "#4A6CC9", content: fichiersContent },
  { id: "sante",      name: "Santé",      glyph: "health",    c0: "#FF9E9E", c1: "#E84A5F", content: santeContent },
  { id: "bourse",     name: "Bourse",     glyph: "stocks",    c0: "#3A3F4D", c1: "#10121C", content: bourseContent },
];

export const DOCK: AppDef[] = [
  { id: "telephone",  name: "Téléphone",  glyph: "phone",    c0: "#67D99E", c1: "#1FA870", content: phoneContent },
  { id: "navigateur", name: "Navigateur", glyph: "compass",  c0: "#8FB0FF", c1: "#5570D6", content: navContent },
  { id: "messages",   name: "Messages",   glyph: "messages", c0: "#67D99E", c1: "#1FA870", content: messagesContent },
  { id: "musique",    name: "Musique",    glyph: "music",    c0: "#FF9FB4", c1: "#E8446B", content: musicContent },
];

export function iconFor(app: AppDef, size = 60): HTMLElement {
  return appIcon(app.id, app.glyph, app.c0, app.c1, size, app.ink ?? "rgba(255,255,255,0.94)");
}
