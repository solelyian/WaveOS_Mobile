// photos.ts — Photos : souvenir Yosemite, sélecteur période, grille 30 + visionneuse.
import { h } from "../core/el";
import { GlassHeader, FloatingTabBar, img } from "./ui";

export function PhotosApp() {
  let tab = "library";
  const root = h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative" } });

  const grid = h("div", { style: { padding: "0 4px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "4px" } });
  for (let i = 0; i < 30; i++) {
    const big = i % 12 === 0;
    const cell = h("div", {
      class: "ph",
      style: {
        position: "relative", background: "#e5e7eb", overflow: "hidden", cursor: "pointer",
        ...(big ? { gridColumn: "span 3", aspectRatio: "16/9", borderRadius: "16px", margin: "0 4px 4px" } : { aspectRatio: "1" }),
      },
      onClick: () => viewer(i),
    }, img(`/img/photos/ph-${i}.jpg`));
    const im = cell.querySelector("img") as HTMLImageElement;
    im.style.cssText = "width:100%;height:100%;object-fit:cover;transition:transform .7s";
    cell.append(im);
    grid.append(cell);
  }

  const viewer = (i: number) => {
    const ov = h("div", {
      style: { position: "absolute", inset: "0", background: "rgba(0,0,0,.9)", backdropFilter: "blur(24px)", zIndex: "100", display: "flex", alignItems: "center", justifyContent: "center", opacity: "0", transition: "opacity .2s" },
      onClick: () => { ov.style.opacity = "0"; setTimeout(() => ov.remove(), 200); },
    }, img(`/img/photos/ph-${i}.jpg`));
    (ov.querySelector("img") as HTMLImageElement).style.cssText = "max-width:100%;max-height:100%;object-fit:contain;box-shadow:0 25px 50px -12px rgba(0,0,0,.5)";
    root.append(ov);
    requestAnimationFrame(() => (ov.style.opacity = "1"));
  };

  root.append(
    GlassHeader("Photos", { large: true, action: "search" }),
    h("div", { class: "app-scroll no-sb", style: { paddingBottom: "96px" } },
      h("div", { style: { padding: "0 24px", marginBottom: "32px" } },
        h("div", { style: { fontSize: "14px", fontWeight: "700", color: "rgba(0,0,0,.3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "12px" } }, "Memories"),
        h("div", { style: { width: "100%", height: "192px", borderRadius: "32px", overflow: "hidden", position: "relative", boxShadow: "0 8px 24px rgba(0,0,0,.12)", border: "1px solid #f3f4f6" } },
          img("/img/memory.jpg"),
          h("div", { style: { position: "absolute", inset: "0", background: "linear-gradient(to top,rgba(0,0,0,.6),transparent)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "24px" } },
            h("div", { style: { color: "#fff", fontWeight: "700", fontSize: "24px" } }, "Yosemite Trip"),
            h("div", { style: { color: "rgba(255,255,255,.8)", fontSize: "14px", fontWeight: "500" } }, "October 12")))),
      h("div", { style: { display: "flex", justifyContent: "center", gap: "16px", marginBottom: "16px" } },
        ...["Years", "Months", "Days", "All"].map((t, i) =>
          h("div", { style: { padding: "6px 16px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", boxShadow: "0 1px 2px rgba(0,0,0,.05)", border: "1px solid #f3f4f6", background: i === 3 ? "#fff" : "rgba(255,255,255,.4)", color: i === 3 ? "#000" : "rgba(0,0,0,.4)" } }, t))),
      grid));

  const retab = (id: string) => { tab = id; const nb = FloatingTabBar(TABS, tab, retab); bar.replaceWith(nb); bar = nb; };
  const TABS = [
    { id: "library", icon: "layoutGrid" as const, label: "Library" },
    { id: "foryou", icon: "heart" as const, label: "For You" },
    { id: "albums", icon: "image" as const, label: "Albums" },
    { id: "search", icon: "search" as const, label: "Search" },
  ];
  let bar = FloatingTabBar(TABS, tab, retab);
  root.append(bar);
  // les images du memory occupent tout le cadre
  (root.querySelector(".app-scroll img") as HTMLImageElement)?.style.setProperty("width", "100%");
  (root.querySelector(".app-scroll img") as HTMLImageElement)?.style.setProperty("height", "100%");
  (root.querySelector(".app-scroll img") as HTMLImageElement)?.style.setProperty("object-fit", "cover");
  return root;
}
