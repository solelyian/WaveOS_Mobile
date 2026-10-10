// media.ts — bibliothèque musicale partagée (Musique, Dynamic Island, CC) +
// ticker de lecture : avance sys.position pendant la lecture, enchaîne les
// pistes. position est mutée sans événement (les barres de progression la
// lisent dans leur boucle de rendu).
import { sys, set, onChange } from "./state";

export interface Track { title: string; artist: string; art: string; dur: number }

export const TRACKS: Track[] = [
  { title: "Midnight City", artist: "M83", art: "/img/album.jpg", dur: 243 },
  { title: "Golden Hour", artist: "JVKE", art: "/img/mix-1.jpg", dur: 209 },
  { title: "Solar Drift", artist: "Tycho", art: "/img/mix-2.jpg", dur: 232 },
  { title: "Neon Rain", artist: "Perturbator", art: "/img/mix-3.jpg", dur: 198 },
  { title: "Slow Bloom", artist: "Khruangbin", art: "/img/mix-4.jpg", dur: 225 },
];

export const liked = new Set<number>();
export const cur = () => TRACKS[((sys.track % TRACKS.length) + TRACKS.length) % TRACKS.length];
export const next = () => set("track", (sys.track + 1) % TRACKS.length);
export const prev = () => set("track", (sys.track - 1 + TRACKS.length) % TRACKS.length);
export const fmtPos = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

let raf = 0, last = 0;
const step = (t: number) => {
  raf = 0;
  if (!sys.playing) return;
  sys.position += (t - last) / 1000;
  last = t;
  if (sys.position >= cur().dur) next();
  raf = requestAnimationFrame(step);
};

onChange((k) => {
  if (k === "track") sys.position = 0;
  if (k === "playing" && sys.playing && !raf) {
    last = performance.now();
    raf = requestAnimationFrame(step);
  }
});
