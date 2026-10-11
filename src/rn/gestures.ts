// gestures.ts — routeur de gestes du shell, calque de resolveZone() de main :
// lock → drag de la barre ; sheets → tracking live + release ; app → drag
// fenêtre ou switcher ; home → bord bas switcher, zones hautes NC/CC.
export interface GestureHandlers {
  unlock(): void;
  lockDrag(dy: number): void;
  lockReset(): void;
  openSheet(x: "nc" | "cc" | "sd"): void;
  closeSheet(): void;
  sheetDrag(dy: number): void;
  sheetPreview(which: "nc" | "cc", dy: number): void;
  sheetPreviewEnd(commit: boolean): void;
  openSwitcher(): void;
  closeSwitcher(): void;
  appDrag(dy: number): void;
  appRelease(dy: number, vy: number): void;
  isLocked(): boolean;
  hasSheet(): boolean;
  hasApp(): boolean;
  hasRecents(): boolean;
  hasSwitcher(): boolean;
}

const H = 850;
const interactiveSel = "button, a, input, #di-capsule, #cc-slider, #nc-card, .tabbar, .ghdr, #app-scroll, #spot";

interface Drag {
  sx: number; sy: number; lx: number; ly: number; lt: number;
  vy: number; moved: boolean;
  kind: "lock" | "sheet" | "sheet-open" | "switcher" | "app" | "home-bottom" | null;
  sheet?: "nc" | "cc";
}

export function attachGestures(root: HTMLElement, h: GestureHandlers) {
  let d: Drag | null = null;

  const down = (e: PointerEvent) => {
    const t = e.target as HTMLElement;
    const r = root.getBoundingClientRect();
    const k = 400 / r.width;
    const x = (e.clientX - r.left) * k, y = (e.clientY - r.top) * k;
    const interactive = t.closest(interactiveSel) as HTMLElement | null;
    d = { sx: x, sy: y, lx: e.clientX, ly: e.clientY, lt: performance.now(), vy: 0, moved: false, kind: null };

    // lock : drag de la barre « swipe up » (100px du bas)
    if (h.isLocked()) {
      if (y > H - 100 && !interactive) d.kind = "lock";
      return;
    }
    // sheet ouverte : drag vers le haut pour fermer
    if (h.hasSheet()) {
      if (!interactive) { d.kind = "sheet-open"; }
      return;
    }
    // switcher ouvert : drag vers le bas ferme
    if (h.hasSwitcher()) {
      if (!interactive) d.kind = "switcher";
      return;
    }
    // app ouverte : barre du bas -> drag fenêtre / switcher
    if (h.hasApp()) {
      if (y > H - 48 && !interactive) d.kind = "app";
      return;
    }
    // home : bord bas -> switcher si historique
    if (!interactive && y > H - 48 && h.hasRecents()) {
      d.kind = "home-bottom";
      return;
    }
    // home : zones hautes -> NC (gauche) / CC (droite)
    if (!interactive && y <= 44) {
      d.kind = "sheet";
      d.sheet = x < 200 ? "nc" : "cc";
      return;
    }
  };

  const move = (e: PointerEvent) => {
    if (!d) return;
    const r = root.getBoundingClientRect();
    const k = 400 / r.width;
    const dy = (e.clientY - r.top) * k - d.sy;
    if (!d.moved && Math.abs(dy) > 8) d.moved = true;
    if (!d.moved) return;
    const now = performance.now(), dt = now - d.lt;
    if (dt > 0) d.vy = 0.7 * d.vy + 0.3 * ((e.clientY - d.ly) / dt * 1000 * k);
    d.lt = now; d.ly = e.clientY;

    switch (d.kind) {
      case "lock": h.lockDrag(dy); break;
      case "sheet": h.sheetPreview(d.sheet!, dy); break;
      case "sheet-open": h.sheetDrag(dy); break;
      case "app": h.appDrag(dy); break;
      default: break;
    }
  };

  const up = (e: PointerEvent) => {
    if (!d) { return; }
    const r = root.getBoundingClientRect();
    const k = 400 / r.width;
    const dy = (d.ly - r.top) * k - d.sy;
    const vy = d.vy;
    const kind = d.kind, sheet = d.sheet;
    d = null;
    switch (kind) {
      case "lock":
        if (dy < -100 || vy < -400) h.unlock();
        else h.lockReset();
        break;
      case "sheet":
        if (dy > 60 || vy > 300) { h.openSheet(sheet!); h.sheetPreviewEnd(true); }
        else h.sheetPreviewEnd(false);
        break;
      case "sheet-open":
        if (dy < -100 || vy < -500) h.closeSheet();
        else h.sheetDrag(NaN); // rouvrir
        break;
      case "switcher":
        if (dy > 60) h.closeSwitcher();
        break;
      case "app":
        if (dy < -80 && vy > -320) h.openSwitcher();
        else h.appRelease(dy, vy);
        break;
      case "home-bottom":
        if (dy < -40 || vy < -250) h.openSwitcher();
        break;
      default: break;
    }
  };

  root.addEventListener("pointerdown", down);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
  return () => {
    root.removeEventListener("pointerdown", down);
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
  };
}
