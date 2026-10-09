// music.ts — Musique (thème sombre) : Listen Now + lecteur plein écran (maquette).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { FloatingTabBar, img } from "./ui";
import { sys, set } from "../system/state";

export function MusicApp() {
  let view: "library" | "player" = "library";
  const root = h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" } });

  const glow = h("div", { style: { position: "absolute", inset: "0", zIndex: "0", opacity: ".4", mixBlendMode: "screen", pointerEvents: "none" } },
    h("div", { style: { position: "absolute", top: "0", left: "0", width: "100%", height: "66%", background: "linear-gradient(to bottom,#a855f7,transparent)", filter: "blur(60px)" } }),
    h("div", { style: { position: "absolute", bottom: "0", right: "0", width: "100%", height: "66%", background: "linear-gradient(to top,#ef4444,transparent)", filter: "blur(60px)" } }));

  const stage = h("div", { style: { flex: "1", display: "flex", flexDirection: "column", position: "relative", zIndex: "10" } });
  let bar: HTMLElement | null = null;

  const library = () =>
    h("div", { class: "app-scroll no-sb", style: { padding: "64px 24px 96px" } },
      h("h1", { style: { fontSize: "36px", fontWeight: "700", marginBottom: "24px" } }, "Listen Now"),
      h("div", { class: "pressable", style: { width: "100%", aspectRatio: "4/3", background: "rgba(0,0,0,.4)", border: "1px solid rgba(255,255,255,.2)", borderRadius: "30px", overflow: "hidden", position: "relative", boxShadow: "0 10px 40px rgba(0,0,0,.5)", marginBottom: "32px", cursor: "pointer" }, onClick: () => { view = "player"; refresh(); } },
        (() => { const im = img("/img/album.jpg"); im.style.cssText = "width:100%;height:100%;object-fit:cover;opacity:.8"; return im; })(),
        h("div", { style: { position: "absolute", bottom: "0", left: "0", right: "0", padding: "24px", background: "linear-gradient(to top,rgba(0,0,0,.9),transparent)" } },
          h("div", { style: { fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "#f87171", marginBottom: "4px" } }, "Now Playing"),
          h("div", { style: { fontSize: "24px", fontWeight: "700" } }, "Midnight City"),
          h("div", { style: { color: "rgba(255,255,255,.7)", fontWeight: "500" } }, "M83"))),
      h("div", { style: { fontSize: "18px", fontWeight: "700", marginBottom: "16px" } }, "Top Picks"),
      h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" } },
        ...[1, 2, 3, 4].map((i) =>
          h("div", { style: { display: "flex", flexDirection: "column", gap: "8px" } },
            h("div", { style: { aspectRatio: "1", background: "rgba(0,0,0,.4)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(0,0,0,.3)" } },
              (() => { const im = img(`/img/mix-${i}.jpg`); im.style.cssText = "width:100%;height:100%;object-fit:cover"; return im; })()),
            h("div", { style: { fontSize: "12px", fontWeight: "500", opacity: ".8", paddingLeft: "4px" } }, `Daily Mix ${i}`)))));

  const player = () => {
    const pp = h("button", {
      class: "pressable",
      style: { width: "80px", height: "80px", borderRadius: "50%", background: "#fff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 -2px 4px rgba(0,0,0,.2),0 10px 30px rgba(255,255,255,.3)" },
      onClick: () => { set("playing", !sys.playing); syncPP(); },
    });
    const syncPP = () => pp.replaceChildren(svgIcon(sys.playing ? I.pause : I.play));
    syncPP();
    const pv = pp.querySelector("svg");
    if (pv) { pv.setAttribute("fill", "black"); }
    return h("div", { style: { position: "absolute", inset: "0", zIndex: "20", display: "flex", flexDirection: "column", padding: "64px 32px 40px" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" } },
        h("button", { class: "pressable", style: { padding: "8px", background: "rgba(255,255,255,.1)", borderRadius: "50%", border: "1px solid rgba(255,255,255,.2)", display: "flex" }, onClick: () => { view = "library"; refresh(); } }, svgIcon(I.chevronLeft)),
        h("span", { style: { fontSize: "12px", fontWeight: "700", letterSpacing: ".15em", textTransform: "uppercase", opacity: ".6" } }, "Playing from Library"),
        h("div", { class: "pressable", style: { padding: "8px", background: "rgba(255,255,255,.1)", borderRadius: "50%", border: "1px solid rgba(255,255,255,.2)", display: "flex" } }, svgIcon(I.ellipsis))),
      h("div", { style: { width: "100%", aspectRatio: "1", borderRadius: "40px", boxShadow: "0 20px 60px -10px rgba(255,0,50,.4),inset 0 1px 1px rgba(255,255,255,.4)", overflow: "hidden", marginBottom: "48px", border: "1px solid rgba(255,255,255,.2)" } },
        (() => { const im = img("/img/album.jpg"); im.style.cssText = "width:100%;height:100%;object-fit:cover"; return im; })()),
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" } },
        h("div", {},
          h("h2", { style: { fontSize: "30px", fontWeight: "700" } }, "Midnight City"),
          h("p", { style: { fontSize: "18px", color: "rgba(255,255,255,.7)", fontWeight: "500" } }, "M83")),
        h("div", { class: "pressable", style: { padding: "12px", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", borderRadius: "50%", boxShadow: "inset 0 1px 1px rgba(255,255,255,.3)", display: "flex" } },
          h("span", { style: { color: "#ef4444", display: "flex" } }, svgIcon(I.heart)))),
      h("div", { style: { marginBottom: "40px" } },
        h("div", { style: { width: "100%", height: "6px", background: "rgba(0,0,0,.4)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "3px", overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,.5)" } },
          h("div", { style: { height: "100%", width: sys.playing ? "60%" : "30%", background: "#fff", boxShadow: "0 0 15px #fff", transition: "width .4s" } })),
        h("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "500", opacity: ".6", marginTop: "8px" } },
          h("span", {}, "1:24"), h("span", {}, "4:03"))),
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px" } },
        svgIcon(I.skipBack), pp, svgIcon(I.skipForward)));
  };

  const TABS = [
    { id: "library", icon: "play" as const, label: "Listen" },
    { id: "browse", icon: "layoutGrid" as const, label: "Browse" },
    { id: "radio", icon: "signal" as const, label: "Radio" },
    { id: "search", icon: "search" as const, label: "Search" },
  ];

  const refresh = () => {
    stage.replaceChildren(view === "library" ? library() : player());
    if (view === "library" && !bar) { bar = FloatingTabBar(TABS, "library", () => {}, true); root.append(bar); }
    if (view === "player" && bar) { bar.remove(); bar = null; }
  };
  root.append(glow, stage);
  refresh();
  return root;
}
