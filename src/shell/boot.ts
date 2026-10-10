// boot.ts — boot façon iOS : logo NYNE blanc statique centré sur noir,
// puis fondu vers le lockscreen. Tap = skip.
import { h } from "../core/el";

const T = { in_: 350, hold: 3200, out: 600, end: 3800 };
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function runBoot(phone: HTMLElement): Promise<void> {
  return new Promise((done) => {
    const el = h("div", { class: "boot" });
    el.append(h("div", { class: "boot-nyne" }, "NYNE"));
    phone.append(el);

    const t0 = performance.now();
    let skipped = false;
    el.addEventListener("pointerdown", () => { skipped = true; }, { once: true });

    const frame = (now: number) => {
      const t = Math.min(now - t0, T.end);
      const nyne = el.querySelector<HTMLElement>(".boot-nyne")!;
      nyne.style.opacity = clamp01(t / T.in_).toFixed(3);
      const fade = skipped ? clamp01((now - t0) / 500) : clamp01((t - T.hold) / T.out);
      if (fade > 0) el.style.opacity = (1 - fade).toFixed(3);
      if ((t < T.end && !skipped) || (skipped && fade < 1)) requestAnimationFrame(frame);
      else { el.remove(); done(); }
    };
    requestAnimationFrame(frame);
  });
}
