import { aquaLens } from "./aquaLens";

const copy = {
  fr: {
    title: "Aqua Glass · étude de volume",
    subtitle: "Une scène contrôlée, avant toute intégration à WaveOS.",
    reference: "Référence fournie · vidéo, 12,15 s",
    live: "Rendu calculé en direct · C++ / TypeScript",
    lens: "Déplacer la lentille",
    raised: "État relevé",
    optics: "Réfraction et réflexion",
    reset: "Revenir au plan de référence",
    background: "Décor",
    track: "Ligne de référence",
    bands: "Bandes colorées",
    detail: "À gauche : extrait de la vidéo. À droite : scène reconstruite et lentille calculée ; aucun pixel du verre Apple n’est utilisé dans le rendu.",
    scope: "Témoin de calibration uniquement. L’horloge et les surfaces WaveOS ne sont pas encore migrées."
  },
  en: {
    title: "Aqua Glass · volume study",
    subtitle: "A controlled scene, before integration into WaveOS.",
    reference: "Supplied reference · video, 12.15 s",
    live: "Live computed rendering · C++ / TypeScript",
    lens: "Move the lens",
    raised: "Raised state",
    optics: "Refraction and reflection",
    reset: "Return to reference pose",
    background: "Scene",
    track: "Reference track",
    bands: "Colored bands",
    detail: "Left: an extract from the supplied video. Right: a reconstructed scene and a computed lens; no pixels from Apple's glass are used in the rendering.",
    scope: "Calibration witness only. The clock and WaveOS surfaces have not been migrated."
  }
};

export function mountAquaStudy() {
  document.body.classList.add("aqua-study");
  const style = document.createElement("style");
  style.textContent = `
    body.aqua-study{margin:0;min-height:100vh;display:block;overflow:auto;background:#fafafa;color:#242424;font:15px/1.5 -apple-system,BlinkMacSystemFont,Arial,sans-serif}
    .aqua-study main{max-width:1180px;margin:auto;padding:48px 24px}
    .aqua-study header{display:flex;gap:24px;justify-content:space-between;align-items:start;margin-bottom:32px}
    .aqua-study h1{font-size:24px;font-weight:600;letter-spacing:-.6px;margin:0 0 8px}
    .aqua-study p{color:#626262;margin:0;max-width:800px}
    .aqua-study .panels{display:grid;grid-template-columns:1fr 1fr;gap:24px}
    .aqua-study figure{margin:0}
    .aqua-study figcaption{font-size:12px;color:#525252;margin-bottom:10px}
    .aqua-study img,.aqua-study .scene{display:block;width:100%;aspect-ratio:16/9;border-radius:12px}
    .aqua-study .scene{position:relative;background:#eee;isolation:isolate;--position:26.5}
    .aqua-study .scene.bands{background:repeating-linear-gradient(90deg,#2577b9 0 14px,#ec8b56 14px 28px,#f3d177 28px 42px,#2b9b8c 42px 56px)}
    .aqua-study .track{position:absolute;left:6.1%;right:6.8%;height:4%;top:49%;border-radius:999px;background:#d9d9d9}
    .aqua-study .fill{position:absolute;inset:0 auto 0 0;width:24.3%;border-radius:inherit;background:#349bf5}
    .aqua-study .lens{position:absolute;isolation:isolate;width:17.6%;height:17%;left:calc(6.1% + var(--position)*.871%);top:50.85%;transform:translate(-50%,-50%);border-radius:999px;box-shadow:0 9px 20px #289cdc25;pointer-events:none}
    .aqua-study .scene.resting .lens{width:12%;height:12%;background:#ffffffd9;box-shadow:0 4px 14px #00000015}
    .aqua-study .position{position:absolute;left:6.1%;width:87.1%;height:28%;top:37%;opacity:0;cursor:ew-resize;z-index:2}
    .aqua-study .scene:has(input:focus-visible){outline:2px solid #1763a1;outline-offset:4px}
    .aqua-study .controls{display:flex;flex-wrap:wrap;gap:16px 24px;align-items:center;margin-top:24px}
    .aqua-study label{display:flex;gap:8px;align-items:center}
    .aqua-study input[type=checkbox]{accent-color:#303030;width:16px;height:16px}
    .aqua-study select,.aqua-study button{font:inherit;font-size:13px;color:inherit;background:#fff;border:1px solid #ccc;border-radius:8px;padding:8px 12px}
    .aqua-study button{cursor:pointer}
    .aqua-study button:focus-visible,.aqua-study select:focus-visible{outline:2px solid #1763a1;outline-offset:3px}
    .aqua-study .notes{margin-top:28px;display:grid;gap:10px;font-size:13px}
    @media(max-width:760px){.aqua-study main{padding:24px 16px}.aqua-study .panels{grid-template-columns:1fr}.aqua-study header{gap:16px}.aqua-study h1{font-size:21px}}
    @media(prefers-reduced-motion:reduce){.aqua-study *{scroll-behavior:auto}}
  `;
  document.head.append(style);
  const main = document.createElement("main");
  main.innerHTML = `<header><div><h1 data-copy="title"></h1><p data-copy="subtitle"></p></div><select aria-label="Langue / Language"><option value="fr">Français</option><option value="en">English</option></select></header>
    <div class="panels"><figure><figcaption data-copy="reference"></figcaption><img src="/aqua-study-slider-reference.png" alt=""></figure>
    <figure><figcaption data-copy="live"></figcaption><div class="scene" data-testid="aqua-scene"><div class="track"><div class="fill"></div></div><div class="lens" data-testid="aqua-lens"></div><input class="position" type="range" min="0" max="100" step=".1" value="26.5"></div></figure></div>
    <div class="controls"><label><input type="checkbox" data-control="raised" checked><span data-copy="raised"></span></label><label><input type="checkbox" data-control="optics" checked><span data-copy="optics"></span></label>
    <label><span data-copy="background"></span><select data-control="background"><option value="track" data-copy="track"></option><option value="bands" data-copy="bands"></option></select></label>
    <button type="button" data-copy="reset"></button></div>
    <div class="notes"><p data-copy="detail"></p><p data-copy="scope"></p></div>`;
  document.body.replaceChildren(main);
  const scene = main.querySelector<HTMLElement>(".scene")!;
  const el = main.querySelector<HTMLElement>(".lens")!;
  const position = main.querySelector<HTMLInputElement>(".position")!;
  const raised = main.querySelector<HTMLInputElement>('[data-control="raised"]')!;
  const optics = main.querySelector<HTMLInputElement>('[data-control="optics"]')!;
  const background = main.querySelector<HTMLSelectElement>('[data-control="background"]')!;
  const material = aquaLens(el, { zoom: 1 });
  const move = () => {
    scene.style.setProperty("--position", position.value);
    const fill = main.querySelector<HTMLElement>(".fill")!;
    const bounds = el.getBoundingClientRect();
    const center = bounds.left + bounds.width / 2;
    const end = fill.getBoundingClientRect().right;
    const near = Math.max(0, Math.min(1, 1 - Math.max(0, center - end) / (bounds.width * .7)));
    material.setAmbient(getComputedStyle(fill).backgroundColor, near);
  };
  move();
  position.addEventListener("input", move);
  const showState = () => {
    scene.classList.toggle("resting", !raised.checked);
    move();
  };
  raised.addEventListener("change", showState);
  optics.addEventListener("change", () => material.setEnabled(optics.checked));
  background.addEventListener("change", () => scene.classList.toggle("bands", background.value === "bands"));
  main.querySelector<HTMLButtonElement>("button")!.addEventListener("click", () => {
    position.value = "26.5"; raised.checked = true; optics.checked = true; background.value = "track";
    showState(); material.setEnabled(true); scene.classList.remove("bands");
  });
  const language = main.querySelector<HTMLSelectElement>("header select")!;
  const translate = () => {
    const lang = language.value as keyof typeof copy;
    document.documentElement.lang = lang;
    document.title = copy[lang].title;
    main.querySelectorAll<HTMLElement>("[data-copy]").forEach(node => {
      node.textContent = copy[lang][node.dataset.copy as keyof typeof copy.fr];
    });
    position.setAttribute("aria-label", copy[lang].lens);
    main.querySelector<HTMLImageElement>("img")!.alt = copy[lang].reference;
  };
  language.addEventListener("change", translate);
  translate();
  addEventListener("pagehide", () => material.destroy(), { once: true });
}
