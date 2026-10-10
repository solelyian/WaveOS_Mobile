// boot.ts — séquence de démarrage : logo NYNE statique puis la vraie footage
// (nébuleuse de particules -> anneau) avec « WaveOS » incrusté : le « O » se
// pose exactement sur l'anneau de particules de la vidéo, puis le O cyan
// prend le relais. Tap = skip.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";

const T = {
  nyneIn: 500, nyneOut: 2400,
  vidIn: 2300,                  // la footage démarre (fond noir -> particules)
  wIn: 5200, osIn: 5550,        // « Wave » blanc puis « S » cyan autour du O réel
  sparkIn: 6400,
  fadeOut: 6900, end: 7700,
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function runBoot(phone: HTMLElement): Promise<void> {
  return new Promise((done) => {
    const el = h("div", { class: "boot" });
    const vid = h("video", {
      class: "boot-vid",
      attrs: { src: "/boot-footage.mp4", muted: "", playsinline: "" },
    }) as HTMLVideoElement;
    vid.muted = true;
    const nyne = h("div", { class: "boot-nyne" }, "NYNE");
    // positions calées sur la footage (576x1276 -> cover 400x850)
    const wEl = h("span", { class: "w" }, "Wave");
    const sEl = h("span", { class: "os" }, "S");
    const logo = h("div", { class: "boot-logo" }, wEl, sEl);
    const spark = h("div", { class: "boot-spark" }, svgIcon(I.sparkle));
    el.append(vid, nyne, logo, spark);
    phone.append(el);
    vid.style.opacity = "0";
    setTimeout(() => vid.play().catch(() => {}), T.vidIn);  // synchro mur/video

    const t0 = performance.now();
    let skipped = false;
    el.addEventListener("pointerdown", () => { skipped = true; }, { once: true });

    const frame = (now: number) => {
      const t = Math.min(now - t0, T.end);
      const fin = skipped ? clamp01((now - t0) / 600) : 0;

      const aNyne = clamp01((t - T.nyneIn) / 500) * (1 - clamp01((t - T.nyneOut) / 400));
      const aVid = clamp01((t - T.vidIn) / 450);
      const aW = clamp01((t - T.wIn) / 800);
      const aOS = clamp01((t - T.osIn) / 800);
      const aSpark = clamp01((t - T.sparkIn) / 400);

      nyne.style.opacity = aNyne.toFixed(3);
      vid.style.opacity = aVid.toFixed(3);
      wEl.style.opacity = aW.toFixed(3);
      sEl.style.opacity = aOS.toFixed(3);
      spark.style.opacity = aSpark.toFixed(3);

      const fade = skipped ? fin : clamp01((t - T.fadeOut) / (T.end - T.fadeOut));
      if (fade > 0) el.style.opacity = (1 - fade).toFixed(3);

      if ((t < T.end && !skipped) || (skipped && fin < 1)) requestAnimationFrame(frame);
      else { vid.pause(); el.remove(); done(); }
    };
    requestAnimationFrame(frame);
  });
}
