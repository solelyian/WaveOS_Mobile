// platform.native.ts — vrai natif (pas de Capacitor) : le composant est monté
// par React Native lui-même. L'inset haut vient de StatusBar.currentHeight
// (≈ hauteur du cutout sous Android edge-to-edge).
import { Platform, StatusBar } from "react-native";

export const NATIVE = true;

export function nativeTopInset(): number {
  if (Platform.OS === "android") return StatusBar.currentHeight ?? 24;
  return 0;
}

export function nativeDiTop(): number {
  const sat = nativeTopInset();
  if (!sat) return 12;
  const sy = (global.innerHeight ?? 850) / 850;
  const t = sat / (2 * sy) - 18;
  return Math.min(20, Math.max(2, Math.round(t)));
}
