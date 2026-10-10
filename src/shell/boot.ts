// boot.ts — séquence de démarrage façon HarmonyOS : NYNE -> nébuleuse -> WaveOS.
// Détails calés sur la ref vidéo :
//   · NYNE fin + ligne de flare horizontale, puis blanc net
//   · ~400 particules en bande verticale plein écran, convergence en donut flou
//   · l'anneau se resserre et se transforme en « O » de WaveOS (morph)
//   · sparkle en bas à droite, fondu vers le lockscreen
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";

const T = {
  nyneIn: 900, flare: 1500, nyneLit: 2600, nyneOut: 3400,
  dustIn: 3600, ringT0: 4700, ringT1: 5700,
  lettersIn: 5800, morph0: 6500, morph1: 7300, sparkIn: 7000,
  fadeOut: 7500, end: 8300,
};

const N = 400;
const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

interface P {
  hx: number; hy: number; vx: number; vy: number;          // dérive libre
  ang: number; rj: number;                                 // cible sur l'anneau
  r: number; tw: number; sp: number; glow: boolean;
}

export function runBoot(phone: HTMLElement): Promise<void> {
  return new Promise((done) => {
    const W = phone.clientWidth || 400;
    const H = phone.clientHeight || 850;
    const cx = W / 2, cy = H * 0.46;

    const el = h("div", { class: "boot" });
    const cv = h("canvas", { class: "boot-cv", attrs: { width: `${W}`, height: `${H}` } });
    const ctx = cv.getContext("2d")!;
    const nyne = h("div", { class: "boot-nyne" },
      h("span", { class: "dim" }, "NYNE"),
      h("span", { class: "lit" }, "NYNE"),
      h("div", { class: "flare" }));
    // « O » séparé : l'anneau de particules se pose dessus puis cède la place
    const oEl = h("span", { class: "o" }, "O");
    const logo = h("div", { class: "boot-logo" },
      h("span", { class: "w" }, "Wave"), oEl, h("span", { class: "os" }, "S"));
    const spark = h("div", { class: "boot-spark" }, svgIcon(I.sparkle));
    el.append(cv, nyne, logo, spark);
    phone.append(el);
    oEl.style.opacity = "0";                                // porté par les particules d'abord

    // centre du « O » en coords canvas, pour y poser l'anneau
    requestAnimationFrame(() => {
      const b = cv.getBoundingClientRect(), o = oEl.getBoundingClientRect();
      oCx = o.left + o.width / 2 - b.left; oCy = o.top + o.height / 2 - b.top;
    });
    let oCx = cx, oCy = cy;
    const R_RING = 62;

    // particules : bande verticale plein écran + cible anneau jitterée (donut épais)
    const ps: P[] = Array.from({ length: N }, (_, i) => {
      const x = cx + gauss() * W * 0.38;
      const y = cy + gauss() * H * 0.52;
      return {
        hx: Math.max(8, Math.min(W - 8, x)),
        hy: Math.max(8, Math.min(H - 8, y)),
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        ang: (i / N) * Math.PI * 2 + Math.random() * 0.1,
        rj: gauss() * 14,                                    // épaisseur floue de l'anneau
        r: 0.5 + Math.random() * 1.7,
        tw: Math.random() * Math.PI * 2,
        sp: 0.6 + Math.random() * 1.4,
        glow: Math.random() < 0.14,
      };
    });

    const t0 = performance.now();
    let skipped = false;
    el.addEventListener("pointerdown", () => { skipped = true; }, { once: true });

    const frame = (now: number) => {
      const t = Math.min(now - t0, T.end);
      const fin = skipped ? clamp01((now - t0) / 600) : 0;

      // --- opacités par phase ---
      const aNyne = clamp01((t - T.nyneIn) / 500) * (1 - clamp01((t - T.nyneOut) / 350));
      const aFlare = clamp01((t - T.flare) / 250) * (1 - clamp01((t - T.nyneLit) / 400));
      const aLetters = clamp01((t - T.lettersIn) / 700);
      const morph = ease(clamp01((t - T.morph0) / (T.morph1 - T.morph0)));
      const aSpark = clamp01((t - T.sparkIn) / 400);
      const aDust = clamp01((t - T.dustIn) / 800);
      const conv = ease(clamp01((t - T.ringT0) / (T.ringT1 - T.ringT0)));
      const ringA = aDust * (1 - morph);

      nyne.style.opacity = aNyne.toFixed(3);
      nyne.style.setProperty("--flare", aFlare.toFixed(3));
      logo.style.opacity = aLetters.toFixed(3);
      logo.style.transform = `scale(${(0.96 + 0.04 * aLetters).toFixed(3)})`;
      oEl.style.opacity = morph.toFixed(3);
      spark.style.opacity = aSpark.toFixed(3);

      // --- particules ---
      ctx.clearRect(0, 0, W, H);
      if (ringA > 0.001) {
        const rad = R_RING - (R_RING - (oEl.getBoundingClientRect().width / 2 || 26)) * morph;
        const rot = now / 14000;
        for (const p of ps) {
          if (conv < 1) { p.hx += p.vx; p.hy += p.vy; }
          const rr = rad + p.rj * (1 - morph * 0.85);
          const tx = oCx + Math.cos(p.ang + rot) * rr;
          const ty = oCy + Math.sin(p.ang + rot) * rr;
          const x = p.hx + (tx - p.hx) * conv;
          const y = p.hy + (ty - p.hy) * conv;
          const tw = 0.5 + 0.5 * Math.abs(Math.sin(now / 640 * p.sp + p.tw));
          const a = ringA * tw * (conv > 0.5 ? 1 : 0.85);
          if (a <= 0.01) continue;
          if (p.glow) {
            ctx.globalAlpha = a * 0.14;
            ctx.fillStyle = "#cfe8ff";
            ctx.beginPath(); ctx.arc(x, y, p.r * 5, 0, 6.29); ctx.fill();
          }
          ctx.globalAlpha = a;
          ctx.fillStyle = conv > 0.4 ? "#dcefff" : "#ffffff";
          ctx.beginPath(); ctx.arc(x, y, p.r * (1 + conv * 0.4), 0, 6.29); ctx.fill();
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
