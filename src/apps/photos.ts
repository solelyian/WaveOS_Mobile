// photos.ts — photothèque vivante : onglets réels, périodes qui réorganisent
// la grille, visionneuse avec compteur et favoris.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { GlassHeader, FloatingTabBar, img, pane } from "./ui";

const PH = Array.from({ length: 30 }, (_, i) => `/img/photos/ph-${i}.jpg`);
const favs = new Set<number>();
const YEARS = [["2026", 0, 17], ["2025", 17, 30]] as const;
const MONTHS = [["October", 0, 9], ["September", 9, 17], ["August", 17, 30]] as const;

export function PhotosApp() {
  const root = h("div", { class: "pg", style: { height: "100%", display: "flex", flexDirection: "column", background: "#f4f4f5" } });
  const scroll = h("div", { class: "app-scroll no-sb", style: { padding: "0 16px 120px" } });
  let period: "years" | "months" | "days" | "all" = "all";

  const viewer = (list: string[], i: number) => {
    pane(root, (close) => {
      const im = img(list[i]) as HTMLImageElement;
      Object.assign(im.style, { width: "100%", height: "100%", objectFit: "contain" });
      const counter = h("span", { style: { color: "rgba(255,255,255,.8)", fontSize: "13px", fontWeight: "600" } }, `${i + 1} of ${list.length}`);
      const heart = h("button", { class: "g-btn", style: { width: "38px", height: "38px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" } });
      const drawHeart = () => heart.replaceChildren(svgIcon(I.heart, favs.has(i) ? "fill" : "", 20) as Node);
      drawHeart();
      heart.addEventListener("click", (e) => { e.stopPropagation(); favs.has(i) ? favs.delete(i) : favs.add(i); drawHeart(); });
      const pg = h("div", { style: { height: "100%", background: "#000", display: "flex", flexDirection: "column" } },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "60px 16px 8px" } },
          h("button", { class: "g-btn", style: { width: "38px", height: "38px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }, onClick: close }, svgIcon(I.x, "", 18)),
          counter,
          heart),
        h("div", { style: { flex: "1", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }, onClick: close }, im));
      return pg;
    });
  };

  const cell = (src: string, i: number, list: string[], big = false) =>
    h("div", { class: "pressable", style: { aspectRatio: "1", borderRadius: big ? "18px" : "8px", overflow: "hidden", ...(big ? { gridColumn: "span 2", gridRow: "span 2" } : {}) }, onClick: () => viewer(list, i) },
      img(src, "img-fill"));

  const section = (title: string, photos: string[], list: string[]) =>
    h("div", {},
      h("div", { style: { fontSize: "18px", fontWeight: "700", margin: "10px 2px 8px" } }, title),
      h("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "4px" } },
        ...photos.map((p) => cell(p, list.indexOf(p), list))));

  const pills = h("div", { class: "no-sb", style: { display: "flex", gap: "8px", justifyContent: "center", padding: "4px 0 10px" } },
    ...(["years", "months", "days", "all"] as const).map((p) =>
      h("button", { class: "chip" + (p === period ? " on" : ""), onClick: (e) => {
        period = p;
        pills.querySelectorAll(".chip").forEach((c) => c.classList.remove("on"));
        (e.currentTarget as HTMLElement).classList.add("on");
        drawLibrary();
      } }, p[0].toUpperCase() + p.slice(1))));

  const drawLibrary = () => {
    scroll.replaceChildren(pills);
    if (period === "all") {
      scroll.append(h("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "4px" } },
        ...PH.map((p, i) => cell(p, i, PH))));
    } else if (period === "years") {
      for (const [y, a, b] of YEARS) scroll.append(section(String(y), PH.slice(a, b), PH));
    } else if (period === "months") {
      for (const [m, a, b] of MONTHS) scroll.append(section(m, PH.slice(a, b), PH));
    } else {
      scroll.append(h("div", { style: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "8px" } },
        ...["Mon 6", "Sun 5", "Sat 4", "Fri 3"].map((d, i) =>
          h("div", { class: "pressable", style: { position: "relative", aspectRatio: ".9", borderRadius: "20px", overflow: "hidden" }, onClick: () => viewer(PH, i) },
            img(PH[i], "img-fill"),
            h("div", { style: { position: "absolute", left: "10px", bottom: "8px", color: "#fff", fontWeight: "700", fontSize: "13px", filter: "drop-shadow(0 1px 2px rgba(0,0,0,.6))" } }, d)))));
    }
  };

  const show = (tab: string) => {
    scroll.replaceChildren();
    if (tab === "library") { drawLibrary(); return; }
    if (tab === "foryou") {
      scroll.append(
        h("div", { style: { fontSize: "20px", fontWeight: "700", margin: "4px 2px 8px" } }, "Memories"),
        h("div", { class: "no-sb", style: { display: "flex", gap: "12px", overflowX: "auto", margin: "0 -16px", padding: "0 16px" } },
          ...[["Big Sur Trip", "/img/memory.jpg"], ["This Week", "/img/photos/ph-7.jpg"], ["On This Day", "/img/photos/ph-13.jpg"]].map(([n, s]) =>
            h("div", { class: "pressable", style: { flex: "none", width: "240px", position: "relative" }, onClick: () => viewer(PH, 0) },
              h("div", { style: { width: "240px", height: "150px", borderRadius: "22px", overflow: "hidden" } }, img(s, "img-fill")),
              h("div", { style: { fontWeight: "700", fontSize: "14px", marginTop: "6px" } }, n)))),
        h("div", { style: { fontSize: "20px", fontWeight: "700", margin: "18px 2px 8px" } }, "Featured Photos"),
        h("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "4px" } },
          ...PH.slice(0, 9).map((p, i) => cell(p, i, PH))));
    } else if (tab === "albums") {
      scroll.append(h("div", { class: "card-white", style: { padding: "2px 14px" } },
        ...[["Recents", PH[0], "30"], ["Favorites", PH[4], String(favs.size)], ["Portraits", PH[8], "12"], ["Screenshots", PH[15], "8"], ["Big Sur", "/img/memory.jpg", "24"]].map(([n, s, c]) =>
          h("div", { class: "lrow pressable", onClick: () => viewer(PH, 0) },
            h("div", { style: { width: "56px", height: "56px", borderRadius: "12px", overflow: "hidden", flex: "none" } }, img(s as string, "img-fill")),
            h("div", { class: "tx" }, h("div", { class: "t1" }, n), h("div", { class: "t2" }, `${c} items`)),
            h("span", { class: "chev" }, svgIcon(I.chevronLeft, "", 16))))));
    } else {
      const input = h("input", { attrs: { placeholder: "Photos, People, Places" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "14px" } }) as HTMLInputElement;
      const grid = h("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "4px" } });
      const draw = () => {
        const q = input.value.trim().length;
        const list = q ? PH.slice(q % 10, (q % 10) + 12) : PH.slice(0, 12);
        grid.replaceChildren(...list.map((p) => cell(p, PH.indexOf(p), PH)));
      };
      input.addEventListener("input", draw); draw();
      scroll.append(h("div", { class: "search-pill", style: { margin: "2px 0 10px" } }, svgIcon(I.search), input), grid);
      setTimeout(() => input.focus(), 60);
    }
  };

  const tabs = FloatingTabBar([
    { id: "library", icon: "image", label: "Library" },
    { id: "foryou", icon: "sparkles", label: "For You" },
    { id: "albums", icon: "layoutGrid", label: "Albums" },
    { id: "search", icon: "search", label: "Search" },
  ], "library", show);

  show("library");
  root.append(GlassHeader("Photos", { large: true }), scroll, tabs.el);
  return root;
}
