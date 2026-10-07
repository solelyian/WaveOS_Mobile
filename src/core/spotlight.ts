// spotlight.ts — « lumière immersive » (signature HarmonyOS 7 : la lumière
// suit le doigt). Deux utilitaires DOM-only, zéro allocation par frame :
//   spotlight(el) — halo radial qui suit le pointeur sur les surfaces verre
//   tilt(el)      — inclinaison 3D légère (parallaxe) sur cartes/widgets
// Les deux se couplent aux ressorts existants : ils écrivent des CSS vars /
// transforms que les transitions rattrapent au relâchement.

/** Halo de lumière suivant le pointeur : --lx/--ly = position, --lg = gain. */
export function spotlight(el: HTMLElement): void {
  el.classList.add("spot");
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--lx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--ly", `${((e.clientY - r.top) / r.height) * 100}%`);
    el.style.setProperty("--lg", "1");
  });
  const off = () => el.style.setProperty("--lg", "0");
  el.addEventListener("pointerleave", off);
  el.addEventListener("pointercancel", off);
}

/** Parallaxe 3D discrète : l'élément pivote vers le pointeur (±max°). */
export function tilt(el: HTMLElement, max = 5): void {
  el.classList.add("tilt");
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${x * max}deg) rotateX(${-y * max}deg)`;
  });
  const reset = () => {
    el.style.transition = "transform .45s cubic-bezier(.22,1.2,.36,1)";
    el.style.transform = "";
    window.setTimeout(() => { el.style.transition = ""; }, 480);
  };
  el.addEventListener("pointerleave", reset);
  el.addEventListener("pointercancel", reset);
}
