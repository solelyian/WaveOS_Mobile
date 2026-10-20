// gestures.native.ts — routeur de gestes natif via PanResponder.
// Mêmes zones que le calque web : coords dans le repère racine (locationX/Y).
import * as React from "react";
import { PanResponder, type GestureResponderEvent, type PanResponderGestureState } from "react-native";

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
const interactiveSel = "button, a, input, #di-capsule, #cc-slider, #nc-card, .tabbar, #tabbar, .ghdr, #ghdr, #app-scroll, #spot";

export function useGestures(h: GestureHandlers) {
  const d = React.useRef<{
    sy: number; kind: "lock" | "sheet" | "sheet-open" | "switcher" | "app" | "home-bottom" | null;
    sheet?: "nc" | "cc"; vy: number; ly: number; lt: number;
  } | null>(null);

  const targetInteractive = (e: GestureResponderEvent) => {
    const t = e.target as unknown as { _nativeTag?: number; viewConfig?: unknown };
    void t;
    return false; // en natif les zones interactives arrêtent le pan via capture
  };

  const pan = React.useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (e, g) => {
      const t = (e.nativeEvent as { target?: number }).target;
      void t;
      const x = e.nativeEvent.locationX, y = e.nativeEvent.locationY;
      const interactive = targetInteractive(e);
      d.current = { sy: y, kind: null, vy: 0, ly: e.nativeEvent.pageY, lt: Date.now() };
      const dc = d.current;
      if (h.isLocked()) { if (y > H - 100 && !interactive) dc.kind = "lock"; }
      else if (h.hasSheet()) { if (!interactive) dc.kind = "sheet-open"; }
      else if (h.hasSwitcher()) { if (!interactive) dc.kind = "switcher"; }
      else if (h.hasApp()) { if (y > H - 48 && !interactive) dc.kind = "app"; }
      else if (!interactive && y > H - 48 && h.hasRecents()) dc.kind = "home-bottom";
      else if (!interactive && y <= 44) { dc.kind = "sheet"; dc.sheet = x < 200 ? "nc" : "cc"; }
      void x;
      return dc.kind != null && Math.abs(g.dy) > 6;
    },
    onPanResponderMove: (e, g) => {
      const dc = d.current; if (!dc) return;
      const dy = g.dy;
      const now = Date.now(), dt = now - dc.lt;
      if (dt > 0) dc.vy = 0.7 * dc.vy + 0.3 * ((e.nativeEvent.pageY - dc.ly) / dt * 1000);
      dc.lt = now; dc.ly = e.nativeEvent.pageY;
      switch (dc.kind) {
        case "lock": h.lockDrag(dy); break;
        case "sheet": h.sheetPreview(dc.sheet!, dy); break;
        case "sheet-open": h.sheetDrag(dy); break;
        case "app": h.appDrag(dy); break;
        default: break;
      }
    },
    onPanResponderRelease: (e, g) => {
      const dc = d.current; d.current = null; if (!dc) return;
      const dy = g.dy, vy = dc.vy;
      switch (dc.kind) {
        case "lock": (dy < -100 || vy < -400) ? h.unlock() : h.lockReset(); break;
        case "sheet":
          if (dy > 60 || vy > 300) { h.openSheet(dc.sheet!); h.sheetPreviewEnd(true); }
          else h.sheetPreviewEnd(false);
          break;
        case "sheet-open": (dy < -100 || vy < -500) ? h.closeSheet() : h.sheetDrag(NaN); break;
        case "switcher": if (dy > 60) h.closeSwitcher(); break;
        case "app": (dy < -80 && vy > -320) ? h.openSwitcher() : h.appRelease(dy, vy); break;
        case "home-bottom": if (dy < -40 || vy < -250) h.openSwitcher(); break;
        default: break;
      }
    },
    onPanResponderTerminate: () => { d.current = null; },
  })).current;
  return pan.panHandlers;
}

// Compat signature web (non utilisée en natif — voir useGestures)
export function attachGestures(_root: unknown, _h: GestureHandlers) { return () => { }; }
