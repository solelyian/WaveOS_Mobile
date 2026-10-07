// gestures.ts — routage des gestes sur #phone.
// Règle d'or : un toucher reste un tap tant qu'il n'a pas dépassé le seuil de
// drag — le pointeur n'est capturé qu'à partir du moment où on vole le geste,
// sinon les clicks DOM des icônes/boutons mourraient. Après un drag, on avale
// le click fantôme une fois.

export interface GestureSample { x: number; y: number; t: number }

export interface GestureInfo {
  startX: number; startY: number;
  x: number; y: number;
  dx: number; dy: number;
  vx: number; vy: number;          // px/s — vélocité lissée (~80 ms)
  edge: EdgeZone;
  target: EventTarget | null;      // élément sous le toucher initial
}

export type EdgeZone =
  | "top-left" | "top-mid" | "top-right"
  | "bottom" | "left" | "right" | "none";

export interface GestureHandlers {
  /** Appelé quand le toucher devient un drag. Retourner false = le router abandonne. */
  onDragStart?(g: GestureInfo): boolean | void;
  onDrag?(g: GestureInfo): void;
  onDragEnd?(g: GestureInfo): void;
  onLongPress?(g: GestureInfo): void;
}

const EDGE_TOP = 62;
const EDGE_BOTTOM = 36;
const EDGE_SIDE = 26;
const DRAG_THRESHOLD = 8;
const LONGPRESS_MS = 450;
const LONGPRESS_MAX_DIST = 8;

export function zoneOf(x: number, y: number, w: number, h: number): EdgeZone {
  if (y < EDGE_TOP) {
    if (x < w * 0.42) return "top-left";
    if (x > w * 0.58) return "top-right";
    return "top-mid";
  }
  if (y > h - EDGE_BOTTOM) return "bottom";
  if (x < EDGE_SIDE) return "left";
  if (x > w - EDGE_SIDE) return "right";
  return "none";
}

export class GestureRouter {
  private pending = false;
  private dragging = false;
  private start: GestureSample = { x: 0, y: 0, t: 0 };
  private startTarget: EventTarget | null = null;
  private trail: GestureSample[] = [];
  private longTimer = 0;
  private longFired = false;

  constructor(private host: HTMLElement, private handlers: GestureHandlers) {
    host.addEventListener("pointerdown", this.down);
  }

  private rect() { return this.host.getBoundingClientRect(); }
  private rel(e: PointerEvent) {
    const r = this.rect();
    const s = Math.min(r.width / 393, r.height / 852); // coords logiques 393×852
    return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s };
  }

  private info(e: PointerEvent): GestureInfo {
    const p = this.rel(e);
    const now = performance.now();
    this.trail.push({ ...p, t: now });
    while (this.trail.length > 8) this.trail.shift();
    let vx = 0, vy = 0;
    const older = this.trail.find((s) => now - s.t > 55) ?? this.trail[0];
    const dtms = now - older.t;
    if (dtms > 0) { vx = ((p.x - older.x) / dtms) * 1000; vy = ((p.y - older.y) / dtms) * 1000; }
    return {
      startX: this.start.x, startY: this.start.y, x: p.x, y: p.y,
      dx: p.x - this.start.x, dy: p.y - this.start.y, vx, vy,
      edge: zoneOf(this.start.x, this.start.y, 393, 852),
      target: this.startTarget,
    };
  }

  private down = (e: PointerEvent): void => {
    this.startTarget = e.target;
    const p = this.rel(e);
    this.pending = true; this.dragging = false; this.longFired = false;
    this.start = { ...p, t: performance.now() };
    this.trail = [this.start];
    document.addEventListener("pointermove", this.move);
    document.addEventListener("pointerup", this.up, { once: true });
    document.addEventListener("pointercancel", this.up, { once: true });
    const g = this.info(e);
    this.longTimer = window.setTimeout(() => {
      if (this.pending && !this.dragging) { this.longFired = true; this.handlers.onLongPress?.(g); }
    }, LONGPRESS_MS);
  };

  private move = (e: PointerEvent): void => {
    if (!this.pending) return;
    const g = this.info(e);
    const dist = Math.hypot(g.dx, g.dy);
    if (!this.dragging) {
      if (dist > LONGPRESS_MAX_DIST) window.clearTimeout(this.longTimer);
      if (dist < DRAG_THRESHOLD) return;
      this.dragging = true;
      if (this.handlers.onDragStart?.(g) === false) {
        this.dragging = false; this.pending = false; this.cleanup();
        return;
      }
      this.host.setPointerCapture?.(e.pointerId);
    }
    if (!this.longFired) this.handlers.onDrag?.(g);
  };

  private up = (e: PointerEvent): void => {
    const wasDrag = this.dragging;
    this.cleanup();
    if (wasDrag && !this.longFired) {
      this.handlers.onDragEnd?.(this.info(e));
      // le drag a consommé le geste : le click qui suit serait un fantôme
      const kill = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); };
      this.host.addEventListener("click", kill, { capture: true, once: true });
      window.setTimeout(() => this.host.removeEventListener("click", kill, { capture: true }), 400);
    }
  };

  private cleanup(): void {
    this.pending = false; this.dragging = false;
    window.clearTimeout(this.longTimer);
    document.removeEventListener("pointermove", this.move);
  }
}
