// host.ts — pont entre les apps RN et la coquille (ouverte/fermée, recents, toasts).
import type { AppId } from "../system/state";
import { sys, set } from "../system/state";
import { INSTALLED } from "../apps/registry";

export function installApp(id: AppId) {
  INSTALLED.add(id);
  set("recents", [...sys.recents]); // re-render le springboard
}

export interface AppRect { x: number; y: number; w: number; h: number }

export const host = {
  openApp: (_id: AppId) => {},
  closeApp: () => {},
  installApp: (_id: AppId) => installApp(_id),
};

export function pushRecent(id: AppId) {
  const r = sys.recents.filter((x) => x !== id);
  r.unshift(id);
  if (r.length > 6) r.length = 6;
  set("recents", [...r]);
}
export function killRecent(id: AppId) {
  set("recents", sys.recents.filter((x) => x !== id));
  if (!sys.recents.length) set("switcherOpen", false);
}

// Toasts éphémères affichés par-dessus l'app active (couche dans AppWindow).
type ToastListener = () => void;
const toastSubs = new Set<ToastListener>();
export const toasts: { id: number; text: string }[] = [];
let toastSeq = 0;
export function toast(text: string) {
  const id = ++toastSeq;
  toasts.push({ id, text });
  toastSubs.forEach((f) => f());
  setTimeout(() => {
    const i = toasts.findIndex((t) => t.id === id);
    if (i >= 0) toasts.splice(i, 1);
    toastSubs.forEach((f) => f());
  }, 1900);
}
export function onToasts(fn: ToastListener) { toastSubs.add(fn); return () => { toastSubs.delete(fn); }; }
