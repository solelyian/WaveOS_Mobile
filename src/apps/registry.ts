// registry.ts — les 11 apps de la maquette : couleurs/icônes/ordre exacts.
import type { AppId } from "../system/state";
import type { IconName } from "../core/lucide";

export interface AppMeta {
  id: AppId;
  name: string;
  icon: IconName;
  /** fond de la tuile ET de la phase morph (maquette : la fenêtre naît colorée). */
  color: string;
  theme: "light" | "dark";
}

export const APPS: AppMeta[] = [
  { id: "weather",    name: "Weather",    icon: "sun",           color: "linear-gradient(135deg,#60a5fa,#2563eb)", theme: "dark" },
  { id: "calendar",   name: "Calendar",   icon: "calendar",      color: "linear-gradient(135deg,#f87171,#dc2626)", theme: "light" },
  { id: "photos",     name: "Photos",     icon: "image",         color: "linear-gradient(135deg,#c084fc,#ec4899)", theme: "light" },
  { id: "calculator", name: "Calculator", icon: "calculator",    color: "#1f2937",                                 theme: "dark" },
  { id: "settings",   name: "Settings",   icon: "settings",      color: "#4b5563",                                 theme: "light" },
  { id: "maps",       name: "Maps",       icon: "map",           color: "linear-gradient(135deg,#4ade80,#16a34a)", theme: "light" },
  { id: "phone",      name: "Phone",      icon: "phone",         color: "#22c55e",                                 theme: "light" },
  { id: "mail",       name: "Mail",       icon: "mail",          color: "#3b82f6",                                 theme: "light" },
  { id: "messages",   name: "Messages",   icon: "messageCircle", color: "#4ade80",                                 theme: "light" },
  { id: "music",      name: "Music",      icon: "music",         color: "#ef4444",                                 theme: "dark" },
  { id: "safari",     name: "Surf",     icon: "compass",       color: "#3b82f6",                                 theme: "light" },
  { id: "store",      name: "Nyne Store",  icon: "store",         color: "linear-gradient(135deg,#38bdf8,#2563eb)", theme: "light" },
];

/** Apps installables via l'App Store — pas sur le springboard tant
 *  qu'elles ne sont pas dans INSTALLED. */
export const EXTRA_APPS: AppMeta[] = [
  { id: "notes",   name: "Notes",   icon: "list",     color: "linear-gradient(135deg,#fde047,#eab308)", theme: "light" },
  { id: "files",   name: "Files",   icon: "book",     color: "linear-gradient(135deg,#93c5fd,#3b82f6)", theme: "light" },
  { id: "clock",   name: "Clock",   icon: "clock",    color: "#111827",                                 theme: "dark" },
  { id: "arcade",  name: "Arcade",  icon: "gamepad2", color: "linear-gradient(135deg,#818cf8,#7c3aed)", theme: "dark" },
];

/** Apps tierces installées cette session (App Store → springboard + Spotlight). */
export const INSTALLED = new Set<AppId>();

export const appMeta = (id: AppId) =>
  APPS.find((a) => a.id === id) ?? EXTRA_APPS.find((a) => a.id === id)!;
export const DOCK: AppId[] = ["phone", "safari", "messages", "music"];
