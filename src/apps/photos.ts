// photos.ts — Photos : souvenir Yosemite, sélecteur période actif, grille 30 + visionneuse,
// onglets Library / For You / Albums / Search.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { GlassHeader, FloatingTabBar, img } from "./ui";

const COUNT = 30;
const range = (a: number, b: number) => Array.from({ length: b - a }, (_, i) => a + i);
const ALL = range(0, COUNT);

export function PhotosApp() {
  let tab = "library";
  let period = "all";
  let album: [string, number[]] | null = null;
  const root = h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative" } });
  const stage = h("div", { style: { flex: "1", display: "flex", flexDirection: "column", minHeight: "0" } });

  const cell = (i: number) => {
    const big = i % 12 === 0;
    const c = h("div", {
      class: "ph",
      style: {
        position: "relative", background: "#e5e7eb", overflow: "hidden", cursor: "pointer",
        ...(big ? { gridColumn: "span 3", aspectRatio: "16/9", borderRadius: "16px", margin: "0 4px 4px" } : { aspectRatio: "1" }),
      },
      onClick: () => viewer(i),
    }, img(`/img/photos/ph-${i}.jpg`));
    const im = c.querySelector("img") as HTMLImageElement;
    im.style.cssText = "width:100%;height:100%;object-fit:cover;transition:transform .7s";
    c.append(im);
    return c;
  };
  const gridEl = (indices: number[]) => {
    const g = h("div", { style: { padding: "0 4px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "4px" } });
    indices.forEach((i) => g.append(cell(i)));
    return g;
  };
  const section = (label: string, indices: number[]) =>
    h("div", {},
      h("div", { style: { padding: "18px 20px 10px", fontSize: "17px", fontWeight: "700", color: "rgba(0,0,0,.85)" } }, label),
      gridEl(indices));

  const viewer = (i: number) => {
    let cur = i;
    const pic = img(`/img/photos/ph-${cur}.jpg`);
    pic.style.cssText = "max-width:100%;max-height:100%;object-fit:contain;box-shadow:0 25px 50px -12px rgba(0,0,0,.5);transition:opacity .15s";
    const counter = h("div", { style: { position: "absolute", top: "24px", left: "0", right: "0", textAlign: "center", color: "rgba(255,255,255,.8)", fontSize: "13px", fontWeight: "600" } });
    const iconBtn = (icon: string, fn: (e: Event) => void) => h("button", { class: "pressable", style: { color: "#fff", display: "flex", padding: "8px" }, onClick: fn }, svgIcon(icon as never, "", 22));
    const heart = iconBtn(I.heart, (e) => { e.stopPropagation(); const s = heart.querySelector("svg") as SVGElement; s.setAttribute("fill", s.getAttribute("fill") === "#ef4444" ? "none" : "#ef4444"); s.style.color = "#ef4444"; });
    const paint = () => { counter.textContent = `${cur + 1} / ${COUNT}`; };
    const step = (d: number) => (e: Event) => {
      e.stopPropagation(); cur = (cur + d + COUNT) % COUNT;
      pic.style.opacity = "0";
      setTimeout(() => { pic.src = `/img/photos/ph-${cur}.jpg`; pic.style.opacity = "1"; paint(); }, 120);
    };
    const nav = (d: number) => h("button", {
      class: "pressable", style: { position: "absolute", top: "50%", transform: `translateY(-50%) rotate(${d < 0 ? 0 : 180}deg)`, [d < 0 ? "left" : "right"]: "8px", zIndex: "5", width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
      onClick: step(d),
    }, svgIcon(I.chevronLeft, "", 20));
    const ov = h("div", {
      style: { position: "absolute", inset: "0", background: "rgba(0,0,0,.9)", backdropFilter: "blur(24px)", zIndex: "100", display: "flex", alignItems: "center", justifyContent: "center", opacity: "0", transition: "opacity .2s" },
      onClick: () => { ov.style.opacity = "0"; setTimeout(() => ov.remove(), 200); },
    }, pic, counter, nav(-1), nav(1),
      h("div", { style: { position: "absolute", bottom: "28px", left: "0", right: "0", display: "flex", justifyContent: "center", gap: "28px", color: "#fff" } },
        heart,
        iconBtn(I.share, (e) => e.stopPropagation()),
        iconBtn(I.trash2, (e) => { e.stopPropagation(); ov.style.opacity = "0"; setTimeout(() => ov.remove(), 200); })));
    root.append(ov);
    paint();
    requestAnimationFrame(() => (ov.style.opacity = "1"));
  };

  const memoryCard = (title: string, sub: string, src: string, hgt = "192px") =>
    h("div", { class: "pressable", style: { width: "100%", height: hgt, borderRadius: "32px", overflow: "hidden", position: "relative", boxShadow: "0 8px 24px rgba(0,0,0,.12)", border: "1px solid #f3f4f6", marginBottom: "20px", cursor: "pointer" }, onClick: () => viewer(0) },
      (() => { const im = img(src); im.style.cssText = "width:100%;height:100%;object-fit:cover"; return im; })(),
      h("div", { style: { position: "absolute", inset: "0", background: "linear-gradient(to top,rgba(0,0,0,.6),transparent)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "24px" } },
        h("div", { style: { color: "#fff", fontWeight: "700", fontSize: "24px" } }, title),
        h("div", { style: { color: "rgba(255,255,255,.8)", fontSize: "14px", fontWeight: "500" } }, sub)));

  const pills = () =>
    h("div", { style: { display: "flex", justifyContent: "center", gap: "16px", marginBottom: "16px" } },
      ...["Years", "Months", "Days", "All"].map((t) => {
        const id = t.toLowerCase();
        const on = period === id;
        return h("div", {
          class: "pressable",
          style: { padding: "6px 16px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", boxShadow: "0 1px 2px rgba(0,0,0,.05)", border: "1px solid #f3f4f6", background: on ? "#fff" : "rgba(255,255,255,.4)", color: on ? "#000" : "rgba(0,0,0,.4)", cursor: "pointer", transition: "all .15s" },
          onClick: () => { period = id; render(); },
        }, t);
      }));

  const library = () =>
    h("div", { class: "app-scroll no-sb", style: { paddingBottom: "96px" } },
      h("div", { style: { padding: "0 24px", marginBottom: "28px" } },
        h("div", { style: { fontSize: "14px", fontWeight: "700", color: "rgba(0,0,0,.3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "12px" } }, "Memories"),
        memoryCard("Yosemite Trip", "October 12", "/img/memory.jpg")),
      pills(),
      ...(period === "all" ? [gridEl(ALL)]
        : period === "days" ? [section("Today", range(0, 6)), section("Yesterday", range(6, 12)), section("Last Week", range(12, 30))]
        : period === "months" ? [section("October", range(0, 18)), section("September", range(18, 30))]
        : [section("2026", range(0, 20)), section("2025", range(20, 30))]));

  const foryou = () =>
    h("div", { class: "app-scroll no-sb", style: { padding: "64px 24px 96px" } },
      h("h1", { style: { fontSize: "30px", fontWeight: "700", marginBottom: "24px" } }, "For You"),
      h("div", { style: { fontSize: "14px", fontWeight: "700", color: "rgba(0,0,0,.3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "12px" } }, "Memories"),
      memoryCard("Yosemite Trip", "October 12 · 18 photos", "/img/memory.jpg"),
      memoryCard("Best of 2026", "Curated highlights", "/img/photos/ph-15.jpg"),
      memoryCard("On This Day", "1 year ago", "/img/photos/ph-22.jpg", "148px"));

  const ALBUMS: [string, number[], string][] = [
    ["Recents", ALL, "/img/photos/ph-0.jpg"],
    ["Favorites", range(2, 14), "/img/photos/ph-4.jpg"],
    ["Trips", range(8, 18), "/img/photos/ph-9.jpg"],
    ["Portraits", range(16, 24), "/img/photos/ph-16.jpg"],
  ];
  const albums = () => {
    if (album) {
      const [name, idx] = album;
      return h("div", { class: "app-scroll no-sb", style: { padding: "64px 0 96px" } },
        h("div", { style: { display: "flex", alignItems: "center", gap: "8px", padding: "0 20px 18px" } },
          h("button", { class: "pressable", style: { color: "#3b82f6", display: "flex", alignItems: "center", fontSize: "17px", fontWeight: "600" }, onClick: () => { album = null; render(); } }, svgIcon(I.chevronLeft, "", 20), "Albums"),
          h("h1", { style: { fontSize: "28px", fontWeight: "700", marginLeft: "4px" } }, name)),
        gridEl(idx));
    }
    return h("div", { class: "app-scroll no-sb", style: { padding: "64px 24px 96px" } },
      h("h1", { style: { fontSize: "30px", fontWeight: "700", marginBottom: "24px" } }, "Albums"),
      h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" } },
        ...ALBUMS.map(([name, idx, cover]) =>
          h("div", { class: "pressable", style: { display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer" }, onClick: () => { album = [name, idx]; render(); } },
            h("div", { style: { aspectRatio: "1", borderRadius: "20px", overflow: "hidden", background: "#e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,.08)", border: "1px solid #f3f4f6" } },
              (() => { const im = img(cover); im.style.cssText = "width:100%;height:100%;object-fit:cover"; return im; })()),
            h("div", {},
              h("div", { style: { fontWeight: "700", fontSize: "15px", color: "rgba(0,0,0,.9)" } }, name),
              h("div", { style: { fontSize: "13px", color: "rgba(0,0,0,.5)" } }, `${idx.length}`))))));
  };

  const search = () => {
    const count = h("div", { style: { padding: "14px 4px 10px", fontSize: "13px", fontWeight: "600", color: "rgba(0,0,0,.45)" } });
    const gridWrap = h("div", {});
    const paint = (indices: number[], label: string) => {
      count.textContent = `${indices.length} ${label}`;
      gridWrap.replaceChildren(gridEl(indices));
    };
    let chip = "all";
    const CHIPS: [string, string, number[]][] = [
      ["all", "All", ALL],
      ["people", "People", range(0, 10)],
      ["places", "Places", range(10, 20)],
      ["shots", "Screenshots", range(20, 30)],
    ];
    const chips = h("div", { class: "no-sb", style: { display: "flex", gap: "10px", overflowX: "auto", padding: "14px 0 4px" } },
      ...CHIPS.map(([id, label, idx]) => h("div", {
        class: "pressable",
        style: { padding: "7px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: "700", border: "1px solid #f3f4f6", flexShrink: "0", cursor: "pointer", transition: "all .15s", background: chip === id ? "#000" : "rgba(255,255,255,.5)", color: chip === id ? "#fff" : "rgba(0,0,0,.55)" },
        onClick: (e) => {
          chip = id;
          const me = e.currentTarget as HTMLElement;
          (me.parentElement as HTMLElement).querySelectorAll(".pressable").forEach((el) => {
            const on = el === me;
            (el as HTMLElement).style.background = on ? "#000" : "rgba(255,255,255,.5)";
            (el as HTMLElement).style.color = on ? "#fff" : "rgba(0,0,0,.55)";
          });
          paint(idx, label.toLowerCase());
        },
      }, label)));
    paint(ALL, "items");
    return h("div", { class: "app-scroll no-sb", style: { padding: "64px 20px 96px" } },
      h("h1", { style: { fontSize: "30px", fontWeight: "700", marginBottom: "8px" } }, "Search"),
      h("div", { class: "search-pill" }, svgIcon(I.search, "", 16), h("span", {}, "Search photos, people, places")),
      chips, count, gridWrap);
  };

  const render = () => {
    stage.replaceChildren(...(
      tab === "library" ? [GlassHeader("Photos", { large: true, action: "search", onAction: () => { tab = "search"; render(); bar.setActive("search"); } }), library()]
      : tab === "foryou" ? [foryou()]
      : tab === "albums" ? [albums()]
      : [search()]));
  };
  render();

  const TABS = [
    { id: "library", icon: "layoutGrid" as const, label: "Library" },
    { id: "foryou", icon: "heart" as const, label: "For You" },
    { id: "albums", icon: "image" as const, label: "Albums" },
    { id: "search", icon: "search" as const, label: "Search" },
  ];
  const bar = FloatingTabBar(TABS, tab, (id) => { tab = id; album = null; render(); });
  root.append(stage, bar.el);
  return root;
}
