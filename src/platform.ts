// platform.ts — détection du mode natif (Capacitor) + réglages d'écran réel.
// En natif, le viewport EST l'écran : pas de bezel, coins carrés, la
// Dynamic Island se cale sous le trou de caméra via les safe-area insets.
export const NATIVE = Boolean(
  (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.())
  || new URLSearchParams(location.search).has("native");

let satCache = -1;

/** Hauteur CSS de la zone d'encoche/caméra (0 sans cutout ou en navigateur). */
export function nativeTopInset(): number {
  if (satCache >= 0) return satCache;
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;left:-100px;top:0;padding-top:env(safe-area-inset-top);visibility:hidden";
  document.body.appendChild(probe);
  satCache = parseFloat(getComputedStyle(probe).paddingTop) || 0;
  probe.remove();
  return satCache;
}

/** Top de la Dynamic Island en coordonnées téléphone (400×850) : le centre
 *  vertical de la capsule épouse le centre du trou de caméra (~milieu de
 *  l'inset), borné pour rester sous la barre de statut. */
export function nativeDiTop(): number {
  if (!NATIVE) return 12;
  const sat = nativeTopInset();
  if (!sat) return 12;
  const sy = innerHeight / 850;
  const t = sat / (2 * sy) - 18;
  return Math.min(20, Math.max(2, Math.round(t)));
}
