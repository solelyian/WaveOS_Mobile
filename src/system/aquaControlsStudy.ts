import { aquaSurface, type AquaSurfaceOptions } from "./aquaSurface";

const copy = {
  fr: {
    title: "Aqua Glass · témoin des commandes",
    subtitle: "Cinq surfaces sur un décor coloré, comparées à la référence avant toute intégration à WaveOS.",
    reference: "Référence fournie",
    live: "Rendu calculé en direct · C++ / TypeScript",
    optics: "Réfraction et liseré",
    background: "Décor",
    photo: "Décor reconstruit",
    bands: "Bandes colorées",
    wallpaper: "Fond d’écran WaveOS",
    bezel: "Largeur du bord",
    thickness: "Épaisseur",
    blur: "Flou du corps",
    rim: "Liseré",
    reset: "Revenir aux réglages de référence",
    focus: "Repos",
    detail: "À gauche : l’image fournie. À droite : un décor redessiné et un verre calculé ; aucun pixel de l’image de gauche n’est utilisé dans le rendu.",
    scope: "Témoin de calibration uniquement. Les surfaces WaveOS ne sont pas encore migrées."
  },
  en: {
    title: "Aqua Glass · controls witness",
    subtitle: "Five surfaces over a colourful scene, compared with the reference before integration into WaveOS.",
    reference: "Supplied reference",
    live: "Live computed rendering · C++ / TypeScript",
    optics: "Refraction and rim",
    background: "Scene",
    photo: "Reconstructed scene",
    bands: "Coloured bands",
    wallpaper: "WaveOS wallpaper",
    bezel: "Edge width",
    thickness: "Thickness",
    blur: "Body blur",
    rim: "Rim",
    reset: "Return to reference settings",
    focus: "Focus",
    detail: "Left: the supplied image. Right: a redrawn scene and a computed glass; no pixels from the left image are used in the rendering.",
    scope: "Calibration witness only. WaveOS surfaces have not been migrated."
  }
};

const defaults = { bezel: 20, thickness: 40, blur: 6, rim: .55 };

const scenery = `<svg viewBox="0 0 778 942" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <filter id="aqua-scene-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="5"/></filter>
    <linearGradient id="aqua-scene-pole" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f0e8"/><stop offset=".55" stop-color="#e9e5df"/><stop offset=".8" stop-color="#8d8f96"/><stop offset="1" stop-color="#6c6f77"/></linearGradient>
  </defs>
  <rect width="778" height="942" fill="#2e8bfd"/>
  <g filter="url(#aqua-scene-soft)" fill="none" stroke-linecap="round">
    <path d="M130 -20H600L575 52Q350 78 150 48Z" fill="#4a0d14"/>
    <path d="M700 20C640 150 600 260 560 400" stroke="#6e2a3c" stroke-width="22"/>
    <path d="M800 110C650 190 520 300 380 380S120 450-20 470" stroke="#8a3c50" stroke-width="36"/>
    <path d="M800 260C700 300 600 380 470 470S300 600 250 640" stroke="#b9627a" stroke-width="28"/>
    <path d="M720 140H772L752 620 705 600Z" fill="#b3202c"/>
    <ellipse cx="255" cy="405" rx="95" ry="52" fill="#e06a7c"/>
    <ellipse cx="565" cy="405" rx="85" ry="46" fill="#d9667c"/>
    <path d="M425 50H492L345 900H200Z" fill="url(#aqua-scene-pole)"/>
    <path d="M-10 470 110 440 122 600-10 640Z" fill="#efeae4"/>
    <path d="M-20 610H70L150 720 200 942H-20Z" fill="#d8141a"/>
    <path d="M-10 800H180L172 950H-10Z" fill="#8a0509"/>
    <path d="M30 430C90 445 130 452 170 440" stroke="#5a1626" stroke-width="18"/>
  </g>
</svg>`;

const glyphs = {
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 3v4h-4" /><rect x="8.5" y="11" width="7" height="5.5" rx="1" fill="currentColor"/><path d="M10 11V9.5a2 2 0 0 1 4 0"/></svg>`,
  windows: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="13" height="10" rx="2" opacity=".45"/><rect x="8" y="9" width="13" height="10" rx="2"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a6 6 0 0 0-6 6v4.5L4.5 16v1h15v-1L18 13.5V9a6 6 0 0 0-6-6Z"/><path d="M9.800 18.5a2.2 2.2 0 0 0 4.4 0Z"/></svg>`,
  layout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="8" height="5.5" rx="1.5"/><rect x="3" y="13.5" width="8" height="5.5" rx="1.5"/><rect x="14" y="5" width="7" height="14" rx="1.5"/></svg>`,
  chevrons: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m7 9 5-5 5 5"/><path d="m7 15 5 5 5-5"/></svg>`
};

type Surface = { className: string; glyph: string; tint?: string; shade?: number; rimColor?: string; capsule?: boolean };
const surfaces: Surface[] = [
  { className: "a", glyph: glyphs.lock, tint: "rgba(10,166,255,.8)", shade: 0, rimColor: "#86f2ff" },
  { className: "b", glyph: glyphs.windows },
  { className: "capsule", glyph: glyphs.moon, capsule: true },
  { className: "c", glyph: glyphs.bell, tint: "rgba(104,100,100,.5)", rimColor: "#fff1e6" },
  { className: "d", glyph: glyphs.layout, tint: "rgba(10,166,255,.8)", shade: 0, rimColor: "#86f2ff" }
];

export function mountAquaControlsStudy() {
  document.body.classList.add("aqua-study");
  const style = document.createElement("style");
  style.textContent = `
    body.aqua-study{margin:0;min-height:100vh;display:block;overflow:auto;background:#fafafa;color:#242424;font:15px/1.5 -apple-system,BlinkMacSystemFont,Arial,sans-serif}
    .aqua-study main{max-width:900px;margin:auto;padding:40px 24px}
    .aqua-study header{display:flex;gap:24px;justify-content:space-between;align-items:start;margin-bottom:28px}
    .aqua-study h1{font-size:24px;font-weight:600;letter-spacing:-.6px;margin:0 0 8px}
    .aqua-study p{color:#626262;margin:0;max-width:760px}
    .aqua-study .panels{display:flex;flex-wrap:wrap;gap:32px}
    .aqua-study figure{margin:0}
    .aqua-study figcaption{font-size:12px;color:#525252;margin-bottom:10px}
    .aqua-study figure>img,.aqua-study .scene{display:block;width:389px;height:471px;border-radius:47px}
    .aqua-study .scene{position:relative;overflow:hidden;isolation:isolate;background:#2d8cff;color:#fff}
    .aqua-study .scene>svg,.aqua-study .scene>.decor{position:absolute;inset:0;width:100%;height:100%}
    .aqua-study .scene.bands>svg,.aqua-study .scene.wallpaper>svg{display:none}
    .aqua-study .scene.bands{background:repeating-linear-gradient(90deg,#2577b9 0 14px,#ec8b56 14px 28px,#f3d177 28px 42px,#2b9b8c 42px 56px)}
    .aqua-study .scene.wallpaper{background:url(/img/wallpaper.jpg) center/cover}
    .aqua-study .glass{position:absolute;width:110px;height:110px;border-radius:999px;display:grid;place-items:center;box-shadow:0 6px 18px rgba(0,0,0,.1)}
    .aqua-study .glass svg{width:50px;height:50px;position:relative}
    .aqua-study .glass.a{left:74.5px;top:52px}.aqua-study .glass.b{left:202px;top:52px}
    .aqua-study .glass.c{left:74.5px;top:306px}.aqua-study .glass.d{left:202px;top:306px}
    .aqua-study .glass.capsule{left:75.5px;top:180px;width:236.5px;height:108.5px;display:flex;align-items:center;gap:14px;padding-left:22px;box-sizing:border-box;font-size:21px;font-weight:600;letter-spacing:-.3px}
    .aqua-study .glass.capsule .knob{position:relative;width:65px;height:65px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.3);flex:none}
    .aqua-study .glass.capsule .knob svg{width:38px;height:38px}
    .aqua-study .glass.capsule .label{position:relative;display:flex;align-items:center;gap:5px}
    .aqua-study .glass.capsule .label svg{width:18px;height:18px;opacity:.75}
    .aqua-study .controls{display:flex;flex-wrap:wrap;gap:16px 24px;align-items:center;margin-top:24px}
    .aqua-study label{display:flex;gap:8px;align-items:center;font-size:13px}
    .aqua-study output{font-variant-numeric:tabular-nums;min-width:28px;color:#525252}
    .aqua-study input[type=checkbox]{accent-color:#303030;width:16px;height:16px}
    .aqua-study input[type=range]{accent-color:#303030;width:120px}
    .aqua-study select,.aqua-study button{font:inherit;font-size:13px;color:inherit;background:#fff;border:1px solid #ccc;border-radius:8px;padding:8px 12px}
    .aqua-study button{cursor:pointer}
    .aqua-study :is(button,select,input):focus-visible{outline:2px solid #1763a1;outline-offset:3px}
    .aqua-study .notes{margin-top:28px;display:grid;gap:10px;font-size:13px}
    @media(max-width:480px){.aqua-study main{padding:24px 0}.aqua-study header,.aqua-study .controls,.aqua-study .notes{padding:0 16px}.aqua-study .panels{justify-content:center}.aqua-study h1{font-size:21px}}
  `;
  document.head.append(style);
  const range = (name: keyof typeof defaults, min: number, max: number, step: number) =>
    `<label><span data-copy="${name}"></span><input type="range" data-option="${name}" min="${min}" max="${max}" step="${step}" value="${defaults[name]}"><output></output></label>`;
  const main = document.createElement("main");
  main.innerHTML = `<header><div><h1 data-copy="title"></h1><p data-copy="subtitle"></p></div><select aria-label="Langue / Language"><option value="fr">Français</option><option value="en">English</option></select></header>
    <div class="panels"><figure><figcaption data-copy="reference"></figcaption><img src="/aqua-study-controls-reference.jpg" alt=""></figure>
    <figure><figcaption data-copy="live"></figcaption><div class="scene" data-testid="aqua-controls-scene">${scenery}${surfaces.map(surface =>
      `<div class="glass ${surface.className}" data-testid="aqua-surface">${surface.capsule
        ? `<span class="knob">${surface.glyph}</span><span class="label"><span data-copy="focus"></span>${glyphs.chevrons}</span>`
        : surface.glyph}</div>`).join("")}</div></figure></div>
    <div class="controls"><label><input type="checkbox" data-control="optics" checked><span data-copy="optics"></span></label>
    <label><span data-copy="background"></span><select data-control="background"><option value="photo" data-copy="photo"></option><option value="bands" data-copy="bands"></option><option value="wallpaper" data-copy="wallpaper"></option></select></label>
    ${range("bezel", 4, 40, 1)}${range("thickness", 0, 60, 1)}${range("blur", 0, 12, .5)}${range("rim", 0, 1, .05)}
    <button type="button" data-copy="reset"></button></div>
    <div class="notes"><p data-copy="detail"></p><p data-copy="scope"></p></div>`;
  document.body.replaceChildren(main);
  const scene = main.querySelector<HTMLElement>(".scene")!;
  const optics = main.querySelector<HTMLInputElement>('[data-control="optics"]')!;
  const background = main.querySelector<HTMLSelectElement>('[data-control="background"]')!;
  const ranges = [...main.querySelectorAll<HTMLInputElement>("[data-option]")];
  const read = (): AquaSurfaceOptions => {
    const value = (name: string) => Number(ranges.find(input => input.dataset.option === name)!.value);
    return { bezel: value("bezel"), thickness: value("thickness"), blur: value("blur"), rimOpacity: value("rim") };
  };
  const materials = surfaces.map(surface =>
    aquaSurface(main.querySelector<HTMLElement>(`.glass.${surface.className}`)!, { ...read(), tint: surface.tint, shade: surface.shade, rimColor: surface.rimColor }));
  const apply = () => {
    ranges.forEach(input => { input.nextElementSibling!.textContent = input.value; });
    materials.forEach(material => material.update(read()));
  };
  ranges.forEach(input => input.addEventListener("input", apply));
  apply();
  optics.addEventListener("change", () => materials.forEach(material => material.setEnabled(optics.checked)));
  const showBackground = () => {
    scene.classList.toggle("bands", background.value === "bands");
    scene.classList.toggle("wallpaper", background.value === "wallpaper");
  };
  background.addEventListener("change", showBackground);
  main.querySelector<HTMLButtonElement>("button")!.addEventListener("click", () => {
    ranges.forEach(input => { input.value = String(defaults[input.dataset.option as keyof typeof defaults]); });
    optics.checked = true; background.value = "photo";
    showBackground(); apply(); materials.forEach(material => material.setEnabled(true));
  });
  const language = main.querySelector<HTMLSelectElement>("header select")!;
  const translate = () => {
    const lang = language.value as keyof typeof copy;
    document.documentElement.lang = lang;
    document.title = copy[lang].title;
    main.querySelectorAll<HTMLElement>("[data-copy]").forEach(node => {
      node.textContent = copy[lang][node.dataset.copy as keyof typeof copy.fr];
    });
    main.querySelector<HTMLImageElement>("figure>img")!.alt = copy[lang].reference;
  };
  language.addEventListener("change", translate);
  translate();
  addEventListener("pagehide", () => materials.forEach(material => material.destroy()), { once: true });
}
