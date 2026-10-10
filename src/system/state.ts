// state.ts — état OS central (pub-sub), équivalent du OSContext React.
export type AppId =
  | "weather" | "calendar" | "photos" | "calculator" | "settings"
  | "maps" | "phone" | "mail" | "messages" | "music" | "safari";

export type Sheet = "cc" | "nc" | null;

export interface SysState {
  locked: boolean;
  activeApp: AppId | null;
  sheet: Sheet;
  brightness: number; // 0..100
  volume: number;     // 0..100
  playing: boolean;
  wifi: boolean;
  bluetooth: boolean;
  airplane: boolean;
  cellular: boolean;
}

export const sys: SysState = {
  locked: true,
  activeApp: null,
  sheet: null,
  brightness: 80,
  volume: 50,
  playing: false,
  wifi: true,
  bluetooth: true,
  airplane: false,
  cellular: true,
};

type Listener = (key: keyof SysState) => void;
const subs = new Set<Listener>();
export function onChange(fn: Listener) { subs.add(fn); return () => subs.delete(fn); }
export function set<K extends keyof SysState>(key: K, v: SysState[K]) {
  if (sys[key] === v) return;
  sys[key] = v;
  subs.forEach((f) => f(key));
}

export const fmtTime = (d = new Date()) =>
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false });
export const fmtDate = (d = new Date()) =>
  d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
