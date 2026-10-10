// di.ts — Dynamic Island (maquette : capsule noire 120→180→360, r 24→44,
// mini-player + égaliseur + carte média étendue).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { Spring } from "../core/motion";
import { lerp } from "../wasm/bridge";
import { sys, set, onChange } from "../system/state";
import { cur, next, prev } from "../system/media";

// keyframes (width, height, radius) : 0 idle / 1 lecture / 2 étendu
const K = [
  { w: 120, h: 36, r: 24 },
  { w: 180, h: 36, r: 24 },
  { w: 360, h: 180, r: 44 },
] as const;

export class DynamicIsland {
  el = h("div", { attrs: { id: "di" } });
  private cap = h("div", { class: "di-capsule" });
  private s = new Spring(0, "island");
  private expanded = false;
  private mini: HTMLElement;
  private big: HTMLElement;
  private miniArt!: HTMLImageElement;
  private prog: HTMLElement | null = null;

  constructor() {
    const art = h("div", { class: "art" }, this.miniArt = h("img", { attrs: { src: "/img/album.jpg", alt: "" } }));
    const eq = h("div", { class: "di-eq" }, h("i"), h("i"), h("i"), h("i"));
    this.mini = h("div", { class: "di-mini" }, art, eq);

    this.big = h("div", { class: "di-big" });
    this.renderBig();

    this.cap.append(this.mini, this.big);
    this.el.append(this.cap);
    this.cap.addEventListener("click", () => {
      this.expanded = !this.expanded;
      this.sync();
    });
    onChange((k) => { if (k === "playing" || k === "track") this.sync(); });
    this.sync();
  }

  private renderBig() {
    this.big.replaceChildren();
    if (!sys.playing) {
      this.big.append(h("div", { class: "nomedia" }, svgIcon(I.music), h("span", {}, "No Media Playing")));
      return;
    }
    const t = cur();
    this.prog = h("i");
    this.big.append(
      h("div", { class: "row1" },
        h("div", { class: "art" }, h("img", { attrs: { src: t.art, alt: "" } })),
        h("div", { style: { flex: "1", minWidth: "0" } },
          h("div", { class: "tt" }, t.title),
          h("div", { class: "ar" }, t.artist)),
        h("div", { class: "live" }, h("i"))),
      h("div", { class: "prog" }, this.prog),
      h("div", { class: "ctrl" },
        h("button", { onClick: (e) => { e.stopPropagation(); prev(); } }, svgIcon(I.skipBack)),
        h("button", { class: "playpause", onClick: (e) => { e.stopPropagation(); set("playing", !sys.playing); } },
          svgIcon(sys.playing ? I.pause : I.play)),
        h("button", { onClick: (e) => { e.stopPropagation(); next(); } }, svgIcon(I.skipForward))));
  }

  private sync() {
    this.s.to(this.expanded ? 2 : sys.playing ? 1 : 0);
    // mini : contenu seulement en lecture (capsule vide sinon — maquette)
    this.mini.style.visibility = sys.playing ? "visible" : "hidden";
    this.miniArt.src = cur().art;
    this.renderBig();
  }

  render() {
    const v = this.s.v;
    const i = v <= 1 ? 0 : 1;
    const t = v <= 1 ? v : v - 1;
    const a = K[i], b = K[i + 1];
    this.cap.style.width = `${lerp(a.w, b.w, t).toFixed(1)}px`;
    this.cap.style.height = `${lerp(a.h, b.h, t).toFixed(1)}px`;
    this.cap.style.borderRadius = `${lerp(a.r, b.r, t).toFixed(1)}px`;
    // mini visible hors état étendu ; la carte apparaît en entrant (maquette : fondu retardé)
    const e = Math.max(0, Math.min(1, (v - 1.4) / 0.4));
    this.mini.style.opacity = v > 1.2 ? "0" : "1";
    this.big.style.opacity = e.toFixed(3);
    this.big.style.filter = `blur(${((1 - e) * 10).toFixed(1)}px)`;
    this.big.style.pointerEvents = e > 0.5 ? "auto" : "none";
    // progression réelle (lire sys.position, muté par le ticker média)
    if (this.prog) this.prog.style.width = `${Math.min(100, (sys.position / cur().dur) * 100).toFixed(1)}%`;
  }
}
