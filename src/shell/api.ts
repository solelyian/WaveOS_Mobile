// api.ts — points d'entrée que les apps utilisent (évite les imports circulaires).
import { set, sys } from "../system/state";

let closer: (() => void) | null = null;
export function registerAppCloser(fn: () => void) { closer = fn; }

export const shell = {
  closeApp: () => closer?.(),
  setPlaying: (v: boolean) => set("playing", v),
  isPlaying: () => sys.playing,
};
