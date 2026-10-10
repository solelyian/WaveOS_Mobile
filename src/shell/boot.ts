// boot.ts — séquence de démarrage façon HarmonyOS : NYNE → particules → WaveOS.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";

// phases (ms) calées sur la ref vidéo :
//   0-900 noir · 900-3300 NYNE (sweep lumineux ~1500) ·
//   3400-5400 particules -> anneau · 5400-6600 WaveOS se révèle, anneau s'ouvre ·
//   6600-7400 logo plein + sparkle · 7400-8100 fondu sortie
const T = {
  nyneIn: 900, nyneOut: 3300,
  dustIn: 3400, ringT0: 4200, ringT1: 5400,
  logoIn: 5400, ringOpen: 5800, ringGone: 6600,
  sparkIn: 6900, fadeOut: 7400, end: 8100,
};

const N = 110;
const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

interface P { hx: number; hy: number; vx: number; vy: number; ang: number; sp: number; tw: number; }

export function runBoot(phone: HTMLElement): Promise<void> {
  return new Promise((done) => {
    const W = phone.clientWidth || 400;
    const H = phone.clientHeight || 850;
    const cx = W / 2, cy = H * 0.46, R0 = 96;

    const el = h("div", { class: "boot" });
    const cv = h("canvas", { class: "boot-cv", attrs: { width: `${W}`, height: `${H}` } });
    const ctx = cv.getContext("2d")!;
    const nyne = h("div", { class: "boot-nyne" },
      h("span", { class: "dim" }, "NYNE"),
      h("span", { class: "lit" }, "NYNE"));
    const logo = h("div", { class: "boot-logo" },
      h("span", { class: "w" }, "Wave"), h("span", { class: "os" }, "OS"));
    const spark = h("div", { class: "boot-spark" }, svgIcon(I.sparkle));
    el.append(cv, nyne, logo, spark);
    phone.append(el);

    // particules : position de dérive + angle cible sur l'anneau
    const ps: P[] = Array.from({ length: N }, (_, i) => ({
      hx: cx + (Math.random() - 0.5) * W * 1.1,
      hy: cy + (Math.random() - 0.5) * H * 0.6,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      ang: (i / N) * Math.PI * 2 + Math.random() * 0.06,
      sp: 0.6 + Math.random() * 0.8,
      tw: Math.random() * Math.PI * 2,
    }));

    const t0 = performance.now();
    let skipped = false;
    const skip = () => { skipped = true; };
    el.addEventListener("pointerdown", skip, { once: true });

    const frame = (now: number) => {
      const t = Math.min(now - t0, T.end);
      const fin = skipped ? clamp01((now - t0) / 600) : 0;

      // --- opacités par phase ---
      const aNyne = clamp01((t - T.nyneIn) / 500) * (1 - clamp01((t - T.nyneOut) / 400));
      const aLogo = clamp01((t - T.logoIn) / 900);
      const aSpark = clamp01((t - T.sparkIn) / 400);
      const aDust = clamp01((t - T.dustIn) / 700);
      const conv = ease(clamp01((t - T.ringT0) / (T.ringT1 - T.ringT0)));       // convergence 0→1
      const open = ease(clamp01((t - T.ringOpen) / (T.ringGone - T.ringOpen))); // ouverture 0→1
      const ringA = aDust * (1 - open);

      nyne.style.opacity = aNyne.toFixed(3);
      logo.style.opacity = aLogo.toFixed(3);
      logo.style.transform = `scale(${(0.96 + 0.04 * aLogo).toFixed(3)})`;
      spark.style.opacity = aSpark.toFixed(3);

      // --- particules ---
      ctx.clearRect(0, 0, W, H);
      if (ringA > 0.001) {
        const rad = R0 + open * 190;
        for (const p of ps) {
          if (conv < 1) { p.hx += p.vx; p.hy += p.vy; }
          const tx = cx + Math.cos(p.ang + now / 9000) * rad;
          const ty = cy + Math.sin(p.ang + now / 9000) * rad;
          const x = p.hx + (tx - p.hx) * conv;
          const y = p.hy + (ty - p.hy) * conv;
          const tw = 0.55 + 0.45 * Math.abs(Math.sin(now / 700 * p.sp + p.tw));
          const a = ringA * tw;
          const r = (1.0 + p.sp * 1.1) * (1 + conv * 0.5);
          ctx.globalAlpha = a;
          ctx.fillStyle = conv > 0.4 ? "#bfe6ff" : "#ffffff";
          ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // --- sortie ---
      const fade = skipped ? fin : clamp01((t - T.fadeOut) / (T.end - T.fadeOut));
      if (fade > 0) el.style.opacity = (1 - fade).toFixed(3);

      if ((t < T.end && !skipped) || (skipped && fin < 1)) requestAnimationFrame(frame);
      else { el.remove(); done(); }
    };
    requestAnimationFrame(frame);
  });
}
