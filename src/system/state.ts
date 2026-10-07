// state.ts — état système du prototype + pub/sub minimal.
// Tout ce qui est « vrai » passe par ici : thème, wallpaper, radios, focus,
// accessibilité. Les écrans s'abonnent aux clés qui les concernent.

export interface SysState {
  theme: "dark" | "light";
  wallpaper: 0 | 1;          // 0 = Rubans (sombre) · 1 = Aube (clair)
  wifi: boolean;
  bt: boolean;
  airplane: boolean;
  focus: boolean;            // mode Focus (Ne pas déranger)
  reduced: boolean;          // réduire les animations
  textScale: number;         // 0.85 – 1.60
  brightness: number;        // 0.25 – 1.0
  volume: number;            // 0 – 1
  rotation: boolean;         // verrou orientation
  torch: boolean;
}

export const sys: SysState = {
  theme: "dark",
  wallpaper: 0,
  wifi: true,
  bt: true,
  airplane: false,
  focus: false,
  reduced: false,
  textScale: 1,
  brightness: 0.85,
  volume: 0.55,
  rotation: false,
  torch: false,
};

type Listener = (v: unknown) => void;
const listeners = new Map<keyof SysState, Set<Listener>>();

export function on<K extends keyof SysState>(key: K, fn: (v: SysState[K]) => void): void {
  let set = listeners.get(key);
  if (!set) listeners.set(key, (set = new Set()));
  set.add(fn as Listener);
}

export function set<K extends keyof SysState>(key: K, v: SysState[K]): void {
  if (sys[key] === v) return;
  sys[key] = v;
  listeners.get(key)?.forEach((fn) => (fn as (x: SysState[K]) => void)(v));
}

export function toggle(key: "wifi" | "bt" | "airplane" | "focus" | "reduced" | "rotation" | "torch"): void {
  set(key, !sys[key]);
}
