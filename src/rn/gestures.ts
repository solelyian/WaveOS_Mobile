// gestures.ts — routeur de gestes pointer events (identique au moteur de main).
// Zones : top-gauche → NC, top-droite → CC, bas → switcher/close-app, lock → unlock.
// Seuil 8px, vélocité échantillonnée, zones interactives exclues via .g-interactive.
export interface GestureHandlers {
  unlock(): void;
  openSheet(s: "nc" | "cc" | "spot" | "sd"): void;
  closeSheet(): void;
  openSwitcher(): void;
  closeApp(): void;
  isLocked(): boolean;
  hasSheet(): boolean;
  hasApp(): boolean;
}

const interactiveSel = "button, a, input, .di-capsule, .cc-slider, .nc-card, .tabbar, .ghdr, .app-scroll, #spot";

interface Drag {
  sx: number; sy: number; lx: number; ly: number; lt: number;
  vy: number; target: "top-nc" | "top-cc" | "bottom" | "mid" | null;
  moved: boolean;
}

export function attachGestures(root: HTMLElement, h: GestureHandlers) {
  let d: Drag | null = null;

  function zone(x: number, y: number): Drag["target"] {
    if (y < 60) return x < 240 ? "top-nc" : "top-cc";
    if (y > 780) return "bottom";
    return "mid";
  }

  const down = (e: PointerEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest(interactiveSel)) return;
    const r = root.getBoundingClientRect();
    const k = 400 / r.width; // coords téléphone (stage scaled)
    d = {
      sx: (e.clientX - r.left) * k, sy: (e.clientY - r.top) * k,
      lx: e.clientX, ly: e.clientY, lt: performance.now(), vy: 0,
      target: null, moved: false,
    };
    d.target = zone(d.sx, d.sy);
    root.setPointerCapture?.(e.pointerId);
  };

  const move = (e: PointerEvent) => {
    if (!d) return;
    const r = root.getBoundingClientRect();
    const k = 400 / r.width;
    const y = (e.clientY - r.top) * k;
    const dy = y - d.sy;
    if (!d.moved && Math.abs(dy) > 8) d.moved = true;
    if (!d.moved) return;
    const now = performance.now(), dt = now - d.lt;
    if (dt > 0) d.vy = 0.7 * d.vy + 0.3 * ((e.clientY - d.ly) / dt * 1000 * k);
    d.lt = now; d.ly = e.clientY;

    if (h.isLocked() && dy < 0 && d.target !== "bottom") {
      // geste lock — on délègue la translation au shell via callback léger
      if (dy < -60 || d.vy < -400) { h.unlock(); d = null; }
      return;
    }
    if (d.target === "top-nc" && dy > 40) { h.openSheet("nc"); d = null; }
    else if (d.target === "top-cc" && dy > 40) { h.openSheet("cc"); d = null; }
    else if (d.target === "bottom" && dy < -60) {
      if (h.hasApp()) h.closeApp(); else h.openSwitcher();
      d = null;
    } else if (h.hasSheet() && dy < -50) { h.closeSheet(); d = null; }
  };

  const up = () => { d = null; };

  root.addEventListener("pointerdown", down);
  root.addEventListener("pointermove", move);
  root.addEventListener("pointerup", up);
  root.addEventListener("pointercancel", up);
  return () => {
    root.removeEventListener("pointerdown", down);
    root.removeEventListener("pointermove", move);
    root.removeEventListener("pointerup", up);
    root.removeEventListener("pointercancel", up);
  };
}
