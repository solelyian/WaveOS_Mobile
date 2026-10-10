// api.ts — points d'entrée que les apps utilisent (évite les imports circulaires).
import { set, sys } from "../system/state";
import type { AppId } from "../system/state";

let closer: (() => void) | null = null;
export function registerAppCloser(fn: () => void) { closer = fn; }

let launcher: ((id: AppId) => void) | null = null;
export function registerAppLauncher(fn: (id: AppId) => void) { launcher = fn; }

let installer: ((id: AppId) => void) | null = null;
export function registerAppInstaller(fn: (id: AppId) => void) { installer = fn; }

export const shell = {
  closeApp: () => closer?.(),
  /** « Open » depuis une app (App Store, …) : referme l'app courante puis morph. */
  launchApp: (id: AppId) => launcher?.(id),
  /** « GET » depuis l'App Store : marque installé + ajoute l'icône au springboard. */
  installApp: (id: AppId) => installer?.(id),
  setPlaying: (v: boolean) => set("playing", v),
  isPlaying: () => sys.playing,
};
