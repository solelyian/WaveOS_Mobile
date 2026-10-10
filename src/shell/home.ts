// home.ts — widgets SF/Calendar, grille 11 apps, dock (layout maquette).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { Spring } from "../core/motion";
import { APPS, DOCK, appMeta } from "../apps/registry";
import type { AppMeta } from "../apps/registry";
import type { AppId } from "../system/state";

export class Home {
  el = h("div", { attrs: { id: "home" } });
  private tiles = new Map<string, HTMLElement>();
  /** recul du springboard : maquette scale .95/.9 + fade .5 quand une app s'ouvre. */
  private sc = new Spring(1, "morph");
  private op = new Spring(1, "morph");
  private onOpen: (id: AppId, rect: DOMRect) => void;
  onSpot?: () => void;
  searchEl!: HTMLElement;

  constructor(onOpen: (id: AppId, rect: DOMRect) => void) {
    this.onOpen = onOpen;

    const widgets = h("div", { class: "wdg-row" },
      h("div", { class: "wdg g-light" },
        h("div", { class: "wt" }, h("span", {}, "SAN FRANCISCO"), svgIcon(I.sun)),
        h("div", {},
          h("div", { class: "wdg-temp" }, "72°"),
          h("div", { class: "wdg-sub" }, "Mostly Clear"))),
      h("div", { class: "wdg g-light wdg-cal" },
        h("div", { class: "wt" }, h("span", {}, "CALENDAR"), h("span", { class: "wdg-sub", style: { marginTop: "0", opacity: ".9" } }, "SAT 6")),
        h("div", { class: "wdg-evt" },
          h("div", { class: "t1" }, "Design Review"),
          h("div", { class: "t2" }, "10:00 - 11:30"))));

    const grid = h("div", { attrs: { id: "grid" } });
    for (const app of APPS) grid.append(this.icon(app.id, false));
    this.grid = grid;

    // capsule recherche style iOS au-dessus du dock -> Spotlight
    const search = h("button", { class: "home-search g-light", onClick: () => this.onSpot?.() },
      svgIcon(I.search), h("span", {}, "Search"));
    this.searchEl = search;

    const dock = h("div", { attrs: { id: "dock" } },
      h("div", { class: "dock-in g-light" },
        ...DOCK.map((id) => this.icon(id, true))));

    this.el.append(widgets, grid, search, dock);
  }

  private grid!: HTMLElement;

  /** App installée depuis l'App Store : nouvelle tuile en fin de grille. */
  addIcon(m: AppMeta) {
    if (this.tiles.has(m.id)) return;
    this.grid.append(this.icon(m.id, false));
  }

  private icon(id: AppId, inDock: boolean) {
    const m = appMeta(id);
    const tile = h("div", { class: "tile", style: { background: m.color } }, svgIcon(I[m.icon]));
    const wrap = h("div", { class: "aicon" }, tile, h("span", { class: "nm" }, m.name));
    wrap.addEventListener("pointerdown", () => wrap.classList.add("pressed"));
    wrap.addEventListener("pointerup", () => wrap.classList.remove("pressed"));
    wrap.addEventListener("pointerleave", () => wrap.classList.remove("pressed"));
    wrap.addEventListener("click", () => this.onOpen(id, tile.getBoundingClientRect()));
    this.tiles.set(inDock ? `${id}-dock` : id, tile);
    return wrap;
  }

  iconRect(id: AppId): DOMRect | null {
    return (this.tiles.get(id) ?? this.tiles.get(`${id}-dock`))?.getBoundingClientRect() ?? null;
  }
  setIconHidden(id: AppId, hidden: boolean) {
    const t = this.tiles.get(id) ?? this.tiles.get(`${id}-dock`);
    if (t) t.style.opacity = hidden ? "0" : "1";
  }

  /** entrée iOS : part réduit + transparent ; le setMode('full') qui suit
   *  ramène au ressort vers 1 — zoom-settle du déverrouillage. */
  enter() { this.sc.set(0.9); this.op.set(0); }

  /** maquette : app -> scale .95 / opacity .5 ; panneau -> scale .9 / opacity 1. */
  setMode(mode: "full" | "app" | "sheet") {
    this.sc.to(mode === "full" ? 1 : mode === "app" ? 0.95 : 0.9);
    this.op.to(mode === "app" ? 0.5 : 1);
  }
  render() {
    this.el.style.transform = `scale(${this.sc.v.toFixed(4)})`;
    this.el.style.opacity = this.op.v.toFixed(3);
  }
}
