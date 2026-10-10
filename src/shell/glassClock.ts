// glassClock.ts — horloge « verre liquide » : les chiffres sont découpés par un
// masque canvas (PNG) au-dessus d'un backdrop-filter → le wallpaper réfracte
// dans les glyphes ; un second masque (stroke seul) ajoute le liseré spéculaire.

const mask = (t: string, w: number, h: number, fs: number, ls: number, stroke: boolean) => {
  const cv = document.createElement("canvas");
  const dpr = 2;
  cv.width = w * dpr; cv.height = h * dpr;
  const c = cv.getContext("2d")!;
  c.scale(dpr, dpr);
  c.font = `700 ${fs}px 'Avenir Next', 'Helvetica Neue', Arial, sans-serif`;
  (c as any).letterSpacing = `${ls.toFixed(1)}px`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  if (stroke) { c.lineWidth = 1.6; c.strokeStyle = "#fff"; c.strokeText(t, w / 2, h / 2); }
  else { c.fillStyle = "#fff"; c.fillText(t, w / 2, h / 2); }
  return `url("${cv.toDataURL()}")`;
};

export function glassClock(el: HTMLElement, t: string) {
  const pad = 12;
  const w = el.offsetWidth + pad * 2;
  const hh = el.offsetHeight + pad * 2;
  let g = el.querySelector<HTMLElement>(".clk-g");
  let e = el.querySelector<HTMLElement>(".clk-e");
  if (!g) {
    g = document.createElement("i"); g.className = "clk-g";
    e = document.createElement("i"); e!.className = "clk-e";
    el.append(g, e!);
  }
  const key = `${t}|${w}x${hh}`;
  if (el.dataset.gk === key || w < pad * 3) return;
  el.dataset.gk = key;
  const fs = parseFloat(getComputedStyle(el).fontSize);
  const ls = parseFloat(getComputedStyle(el).letterSpacing);
  const lsv = Number.isFinite(ls) ? ls : fs * -0.04;
  g.style.maskImage = (g.style as any).webkitMaskImage = mask(t, w, hh, fs, lsv, false);
  e!.style.maskImage = (e!.style as any).webkitMaskImage = mask(t, w, hh, fs, lsv, true);
}
