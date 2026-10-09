// gestures.ts — routeur de pointeur : zones de bord + drag suivant le doigt.
// Les drags commencent après 8px ; en-dessous, le clic remonte au DOM.
import { tokens } from "../tokens.gen";

export interface Drag {
  move(dx: number, dy: number): void;
  end(dx: number, dy: number, vx: number, vy: number): void;
  cancel?(): void;
}

export type ZoneResolver = (x: number, y: number, el: HTMLElement) => Drag | null;

const TH = tokens.motion.gestureThresholdPx;
let resolver: ZoneResolver = () => null;
export function setZoneResolver(r: ZoneResolver) { resolver = r; }

const interactiveSel = "button, a, input, .cc-slider, .nc-card, .di-capsule, .g-btn";

export function attachGestures(phone: HTMLElement) {
  let startX = 0, startY = 0, lastX = 0, lastY = 0, lastT = 0;
  let vx = 0, vy = 0, active = false, drag: Drag | null = null, pid = -1;
  let samples: { t: number; x: number; y: number }[] = [];

  phone.addEventListener("pointerdown", (e) => {
    if (pid !== -1 && !e.isPrimary) return; // pointeur déjà suivi (multitouch ignoré)
    if (!e.isPrimary) return;
    const rect = phone.getBoundingClientRect();
    // coordonnées dans l'espace 400×850 du téléphone
    startX = lastX = (e.clientX - rect.left) * (rect.width ? phone.clientWidth / rect.width : 1);
    startY = lastY = (e.clientY - rect.top) * (rect.height ? phone.clientHeight / rect.height : 1);
    lastT = performance.now();
    active = false; drag = null; pid = e.pointerId;
    samples = [{ t: lastT, x: startX, y: startY }];
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    drag = resolver(startX, startY, el?.closest(interactiveSel) as HTMLElement);
  });

  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== pid) return;
    const rect = phone.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (phone.clientWidth / rect.width || 1);
    const y = (e.clientY - rect.top) * (phone.clientHeight / rect.height || 1);
    const dx = x - startX, dy = y - startY;
    if (!active && drag) {
      if (Math.hypot(dx, dy) >= TH) {
        active = true;
        phone.setPointerCapture(pid);
      }
    }
    if (active && drag) {
      drag.move(dx, dy);
      e.preventDefault();
    }
    const now = performance.now();
    samples.push({ t: now, x, y });
    if (samples.length > 6) samples.shift();
    lastX = x; lastY = y; lastT = now;
  };

  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== pid) return;
    // vitesse : fenêtre ~80ms
    const now = performance.now();
    const recent = samples.filter((s) => now - s.t < 90);
    if (recent.length >= 2) {
      const a = recent[0], b = recent[recent.length - 1];
      const dt = Math.max(1, b.t - a.t) / 1000;
      vx = (b.x - a.x) / dt; vy = (b.y - a.y) / dt;
    } else { vx = 0; vy = 0; }
    if (active && drag) drag.end(lastX - startX, lastY - startY, vx, vy);
    active = false; drag = null;
    if (pid !== -1 && phone.hasPointerCapture(pid)) phone.releasePointerCapture(pid);
    pid = -1;
  };

  phone.addEventListener("pointermove", onMove);
  phone.addEventListener("pointerup", onUp);
  phone.addEventListener("pointercancel", onUp);
}
