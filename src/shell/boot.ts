// boot.ts — séquence de démarrage façon HarmonyOS : NYNE -> nébuleuse -> WaveOS.
//   · NYNE : logo statique (fondu in/out, aucune animation)
//   · ~600 particules fines rendues en sprites glow, bande verticale plein écran
//   · convergence en anneau dense et flou, qui se resserre en « O » de WaveOS
//   · sparkle en bas à droite, fondu vers le lockscreen
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";

const T = {
  nyneIn: 500, nyneOut: 2600,
  dustIn: 2900, ringT0: 4600, ringT1: 5700,
  lettersIn: 6100, morph0: 6800, morph1: 7500, sparkIn: 7100,
  fadeOut: 7700, end: 8500,
};

const N = 620;
const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

interface P {
  hx: number; hy: number; vx: number; vy: number;
  ang: number; rj: number;
  s: number; tw: number; sp: number;
}

// sprite glow pré-rendu (point lumineux doux) — la clé du rendu « nébuleuse »
function makeSprite(): HTMLCanvasElement {
  const s = document.createElement("canvas");
  s.width = s.height = 32;
  const c = s.getContext("2d")!;
  const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(230,242,255,.85)");
  g.addColorStop(0.55, "rgba(190,220,255,.28)");
  g.addColorStop(1, "rgba(160,200,255,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, 32, 32);
  return s;
}

export function runBoot(phone: HTMLElement): Promise<void> {
  return new Promise((done) => {
    const W = phone.clientWidth || 400;
    const H = phone.clientHeight || 850;
    const cx = W / 2, cy = H * 0.46;
    const dpr = Math.min(devicePixelRatio || 1, 2);

    const el = h("div", { class: "boot" });
    const cv = h("canvas", { class: "boot-cv", attrs: { width: `${W * dpr}`, height: `${H * dpr}` } });
    const ctx = cv.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const sprite = makeSprite();
    const nyne = h("div", { class: "boot-nyne" }, "NYNE");
    const oEl = h("span", { class: "o" }, "O");
    const logo = h("div", { class: "boot-logo" },
      h("span", { class: "w" }, "Wave"), oEl, h("span", { class: "os" }, "S"));
    const spark = h("div", { class: "boot-spark" }, svgIcon(I.sparkle));
    el.append(cv, nyne, logo, spark);
    phone.append(el);
    oEl.style.opacity = "0";

    requestAnimationFrame(() => {
      const b = cv.getBoundingClientRect(), o = oEl.getBoundingClientRect();
      oCx = o.left + o.width / 2 - b.left; oCy = o.top + o.height / 2 - b.top;
      oR = o.width / 2;
    });
    let oCx = cx, oCy = cy, oR = 26;
    const R_RING = 82;

    const ps: P[] = Array.from({ length: N }, (_, i) => ({
      hx: Math.max(6, Math.min(W - 6, cx + gauss() * W * 0.5)),
      hy: Math.max(6, Math.min(H - 6, cy + gauss() * H * 0.55)),
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1 - 0.04,
      ang: Math.random() * Math.PI * 2,
      rj: gauss() * 13,
      s: 2 + Math.random() * 8 + (Math.random() < 0.12 ? 10 : 0),   // sprite px
      tw: Math.random() * Math.PI * 2,
      sp: 0.5 + Math.random() * 1.3,
    }));

    const t0 = performance.now();
    let skipped = false;
    el.addEventListener("pointerdown", () => { skipped = true; }, { once: true });

    const frame = (now: number) => {
      const t = Math.min(now - t0, T.end);
      const fin = skipped ? clamp01((now - t0) / 600) : 0;

      const aNyne = clamp01((t - T.nyneIn) / 550) * (1 - clamp01((t - T.nyneOut) / 350));
      const aLetters = clamp01((t - T.lettersIn) / 1000);
      const morph = ease(clamp01((t - T.morph0) / (T.morph1 - T.morph0)));
      const aSpark = clamp01((t - T.sparkIn) / 400);
      const aDust = clamp01((t - T.dustIn) / 900);
      const conv = ease(clamp01((t - T.ringT0) / (T.ringT1 - T.ringT0)));
      const ringA = aDust * (1 - morph);

      nyne.style.opacity = aNyne.toFixed(3);
      logo.style.opacity = aLetters.toFixed(3);
      logo.style.transform = `scale(${(0.97 + 0.03 * aLetters).toFixed(3)})`;
      oEl.style.opacity = morph.toFixed(3);
      spark.style.opacity = aSpark.toFixed(3);

      ctx.clearRect(0, 0, W, H);
      if (ringA > 0.001) {
        const rad = R_RING + (oR - R_RING) * morph;
        const thick = 1 - morph * 0.8;
        const rot = now / 16000;
        for (const p of ps) {
          if (conv < 1) { p.hx += p.vx; p.hy += p.vy; }
          const rr = rad + p.rj * thick;
          const tx = oCx + Math.cos(p.ang + rot) * rr;
          const ty = oCy + Math.sin(p.ang + rot) * rr;
          const x = p.hx + (tx - p.hx) * conv;
          const y = p.hy + (ty - p.hy) * conv;
          const tw = 0.55 + 0.45 * Math.sin(now / 600 * p.sp + p.tw);
          ctx.globalAlpha = ringA * tw;
          const sz = p.s * (0.9 + conv * 0.4);           // bande plus pleine une fois l'anneau formé
          ctx.drawImage(sprite, x - sz / 2, y - sz / 2, sz, sz);
        }
        ctx.globalAlpha = 1;
      }

      const fade = skipped ? fin : clamp01((t - T.fadeOut) / (T.end - T.fadeOut));
      if (fade > 0) el.style.opacity = (1 - fade).toFixed(3);

      if ((t < T.end && !skipped) || (skipped && fin < 1)) requestAnimationFrame(frame);
      else { el.remove(); done(); }
    };
    requestAnimationFrame(frame);
  });
}
