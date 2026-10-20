// glass.native.ts — surfaces Aqua natives : teinte translucide + filet haut
// (backdrop-filter n'existe pas hors WebView ; le raster C++ arrive via NDK).
import { NativeEl, type El } from "./fx";

export interface LGOpts {
  radius?: number; amp?: number; depth?: number; scale?: number;
  blur?: number; saturate?: number; spec?: number;
}

export async function liquidGlass(el: El | NativeEl, _o: LGOpts = {}): Promise<void> {
  if (!el) return;
  el.style.backgroundColor = "rgba(255,255,255,.10)";
  el.dataset.lgDone = "1";
}

export async function liquidGlassAll(_root: unknown): Promise<void> { }

export interface GlassOpts { radius: number; tint?: [number, number, number]; alpha?: number; backdropFilter?: string }
export interface GlassSurface { canvas: unknown; refresh: () => Promise<void> }
export async function glass(el: El | NativeEl, o: GlassOpts): Promise<GlassSurface> {
  await liquidGlass(el, { radius: o.radius });
  return { canvas: null, refresh: () => liquidGlass(el, { radius: o.radius }) };
}
