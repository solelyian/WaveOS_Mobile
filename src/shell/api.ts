// api.ts — points d'entrée que les apps utilisent (évite les imports circulaires).
import { set, sys } from "../system/state";
import type { AppId } from "../system/state";

let closer: (() => void) | null = null;
export function registerAppCloser(fn: () => void) { closer = fn; }
let opener: ((id: AppId) => void) | null = null;
export function registerAppOpener(fn: (id: AppId) => void) { opener = fn; }

export const shell = {
  closeApp: () => closer?.(),
  openApp: (id: AppId) => opener?.(id),
  setPlaying: (v: boolean) => set("playing", v),
  isPlaying: () => sys.playing,
};
