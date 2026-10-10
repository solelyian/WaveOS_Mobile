// music.ts — Musique (thème sombre) : Listen Now + lecteur plein écran (maquette).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { FloatingTabBar, img } from "./ui";
import type { TabBarCtl } from "./ui";
import { sys, set, onChange } from "../system/state";

export function MusicApp() {
  type View = "library" | "browse" | "radio" | "search" | "player";
  let view: View = "library";
  let tab = "library";
  let track = { name: "Midnight City", artist: "M83", art: "/img/album.jpg" };
  const root = h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" } });

  const glow = h("div", { style: { position: "absolute", inset: "0", zIndex: "0", opacity: ".4", mixBlendMode: "screen", pointerEvents: "none" } },
    h("div", { style: { position: "absolute", top: "0", left: "0", width: "100%", height: "66%", background: "linear-gradient(to bottom,#a855f7,transparent)", filter: "blur(60px)" } }),
    h("div", { style: { position: "absolute", bottom: "0", right: "0", width: "100%", height: "66%", background: "linear-gradient(to top,#ef4444,transparent)", filter: "blur(60px)" } }));

  const stage = h("div", { style: { flex: "1", display: "flex", flexDirection: "column", position: "relative", zIndex: "10" } });
  let bar: TabBarCtl | null = null;

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
          h("div", { class: "pressable", style: { display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer" }, onClick: () => { track = { name: `Daily Mix ${i}`, artist: "Nyne Radio", art: `/img/mix-${i}.jpg` }; set("playing", true); view = "player"; refresh(); } },
            h("div", { style: { aspectRatio: "1", background: "rgba(0,0,0,.4)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(0,0,0,.3)" } },
              (() => { const im = img(`/img/mix-${i}.jpg`); im.style.cssText = "width:100%;height:100%;object-fit:cover"; return im; })()),
            h("div", { style: { fontSize: "12px", fontWeight: "500", opacity: ".8", paddingLeft: "4px" } }, `Daily Mix ${i}`)))));

  const player = () => {
    const pp = h("button", {
      class: "pressable",
      style: { width: "80px", height: "80px", borderRadius: "50%", background: "#fff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 -2px 4px rgba(0,0,0,.2),0 10px 30px rgba(255,255,255,.3)" },
      onClick: () => { set("playing", !sys.playing); syncPP(); },
    });
    const syncPP = () => {
      pp.replaceChildren(svgIcon(sys.playing ? I.pause : I.play));
      const pv = pp.querySelector("svg") as SVGElement | null;
      if (pv) { pv.setAttribute("fill", "black"); pv.style.width = "28px"; pv.style.height = "28px"; if (!sys.playing) pv.style.marginLeft = "4px"; }
    };
    syncPP();
    onChange((k) => { if (k === "playing" && pp.isConnected) syncPP(); });
    return h("div", { style: { position: "absolute", inset: "0", zIndex: "20", display: "flex", flexDirection: "column", padding: "64px 32px 40px" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" } },
        h("button", { class: "pressable", style: { padding: "8px", background: "rgba(255,255,255,.1)", borderRadius: "50%", border: "1px solid rgba(255,255,255,.2)", display: "flex" }, onClick: () => { view = "library"; refresh(); } }, svgIcon(I.chevronLeft)),
        h("span", { style: { fontSize: "12px", fontWeight: "700", letterSpacing: ".15em", textTransform: "uppercase", opacity: ".6" } }, "Playing from Library"),
        h("div", { class: "pressable", style: { padding: "8px", background: "rgba(255,255,255,.1)", borderRadius: "50%", border: "1px solid rgba(255,255,255,.2)", display: "flex" } }, svgIcon(I.ellipsis))),
      h("div", { style: { width: "100%", aspectRatio: "1", borderRadius: "40px", boxShadow: "0 20px 60px -10px rgba(255,0,50,.4),inset 0 1px 1px rgba(255,255,255,.4)", overflow: "hidden", marginBottom: "48px", border: "1px solid rgba(255,255,255,.2)" } },
        (() => { const im = img(track.art); im.style.cssText = "width:100%;height:100%;object-fit:cover"; return im; })()),
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" } },
        h("div", {},
          h("h2", { style: { fontSize: "30px", fontWeight: "700" } }, track.name),
          h("p", { style: { fontSize: "18px", color: "rgba(255,255,255,.7)", fontWeight: "500" } }, track.artist)),
        h("div", { class: "pressable", style: { padding: "12px", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", borderRadius: "50%", boxShadow: "inset 0 1px 1px rgba(255,255,255,.3)", display: "flex" } },
          h("span", { style: { color: "#ef4444", display: "flex" } }, svgIcon(I.heart, "fill", 20)))),
      h("div", { style: { marginBottom: "40px" } },
        h("div", { style: { width: "100%", height: "6px", background: "rgba(0,0,0,.4)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "3px", overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,.5)" } },
          h("div", { style: { height: "100%", width: sys.playing ? "60%" : "30%", background: "#fff", boxShadow: "0 0 15px #fff", transition: "width .4s" } })),
        h("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "500", opacity: ".6", marginTop: "8px" } },
          h("span", {}, "1:24"), h("span", {}, "4:03"))),
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px" } },
        svgIcon(I.skipBack, "", 32), pp, svgIcon(I.skipForward, "", 32)));
  };

  const POOL = [
    { name: "Midnight City", artist: "M83", art: "/img/album.jpg" },
    { name: "Daily Mix 1", artist: "Nyne Radio", art: "/img/mix-1.jpg" },
    { name: "Daily Mix 2", artist: "Nyne Radio", art: "/img/mix-2.jpg" },
    { name: "Daily Mix 3", artist: "Nyne Radio", art: "/img/mix-3.jpg" },
    { name: "Daily Mix 4", artist: "Nyne Radio", art: "/img/mix-4.jpg" },
  ];
  const playTrack = (t: typeof track) => {
    track = t; set("playing", true); view = "player"; refresh();
  };

  const GENRES = [
    ["Pop", "#ec4899"], ["Rock", "#ef4444"], ["Jazz", "#f59e0b"],
    ["Electronic", "#8b5cf6"], ["Classical", "#10b981"], ["Hip-Hop", "#3b82f6"],
  ] as const;
  const browse = () =>
    h("div", { class: "app-scroll no-sb", style: { padding: "64px 24px 96px" } },
      h("h1", { style: { fontSize: "36px", fontWeight: "700", marginBottom: "24px" } }, "Browse"),
      h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" } },
        ...GENRES.map(([g, c], i) =>
          h("div", { class: "pressable", style: { height: "96px", borderRadius: "20px", background: c, padding: "16px", display: "flex", alignItems: "flex-end", cursor: "pointer", boxShadow: "0 8px 20px -6px " + c + "88", position: "relative", overflow: "hidden" }, onClick: () => playTrack({ name: `${g} Essentials`, artist: "Nyne Curated", art: `/img/mix-${(i % 4) + 1}.jpg` }) },
            h("div", { style: { fontWeight: "800", fontSize: "17px", color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,.3)" } }, g)))));

  const radio = () =>
    h("div", { class: "app-scroll no-sb", style: { padding: "64px 24px 96px" } },
      h("h1", { style: { fontSize: "36px", fontWeight: "700", marginBottom: "24px" } }, "Radio"),
      ...([["Nyne Radio 1", "Live · Top 40", "#ef4444"], ["Chill Station", "Ambient & Lo-Fi", "#8b5cf6"], ["Jazz FM", "Smooth Jazz 24/7", "#f59e0b"], ["Deep Focus", "Instrumental Study", "#10b981"]] as const).map(([n, s, c], i) =>
        h("div", { class: "pressable", style: { display: "flex", alignItems: "center", gap: "14px", padding: "14px", background: "rgba(0,0,0,.35)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "18px", marginBottom: "12px", cursor: "pointer" }, onClick: () => playTrack({ name: n, artist: s, art: `/img/mix-${(i % 4) + 1}.jpg` }) },
          h("div", { style: { width: "52px", height: "52px", borderRadius: "12px", background: c, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: "0" } }, svgIcon(I.signal, "", 22)),
          h("div", { style: { flex: "1" } },
            h("div", { style: { fontWeight: "700", fontSize: "16px" } }, n),
            h("div", { style: { fontSize: "13px", color: "rgba(255,255,255,.6)" } }, s)),
          h("span", { style: { display: "flex", color: "rgba(255,255,255,.5)" } }, svgIcon(I.play, "", 18)))));

  const search = () => {
    const results = h("div", { style: { display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" } });
    const paint = (q: string) => {
      const qq = q.trim().toLowerCase();
      const hits = qq ? POOL.filter((t) => (t.name + " " + t.artist).toLowerCase().includes(qq)) : POOL;
      results.replaceChildren(...(hits.length ? hits : []).map((t) =>
        h("div", { class: "pressable", style: { display: "flex", alignItems: "center", gap: "12px", padding: "10px", background: "rgba(0,0,0,.35)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "16px", cursor: "pointer" }, onClick: () => playTrack(t) },
          h("div", { style: { width: "48px", height: "48px", borderRadius: "10px", overflow: "hidden", background: "#333", flexShrink: "0" } }, (() => { const im = img(t.art); im.style.cssText = "width:100%;height:100%;object-fit:cover"; return im; })()),
          h("div", { style: { flex: "1" } },
            h("div", { style: { fontWeight: "700", fontSize: "15px" } }, t.name),
            h("div", { style: { fontSize: "12px", color: "rgba(255,255,255,.6)" } }, t.artist)),
          h("span", { style: { display: "flex", color: "rgba(255,255,255,.5)" } }, svgIcon(I.play, "", 16)))));
      if (!hits.length && qq) results.append(h("div", { style: { textAlign: "center", color: "rgba(255,255,255,.5)", padding: "32px 0" } }, `No results for \u201c${q}\u201d`));
    };
    const input = h("input", {
      attrs: { type: "search", placeholder: "Songs, artists, mixes" },
      style: { width: "100%", padding: "14px 18px", borderRadius: "16px", border: "1px solid rgba(255,255,255,.15)", background: "rgba(0,0,0,.35)", color: "#fff", fontSize: "16px", outline: "none" },
    }) as HTMLInputElement;
    input.addEventListener("input", () => paint(input.value));
    paint("");
    return h("div", { class: "app-scroll no-sb", style: { padding: "64px 24px 96px" } },
      h("h1", { style: { fontSize: "36px", fontWeight: "700", marginBottom: "20px" } }, "Search"), input, results);
  };

  const TABS = [
    { id: "library", icon: "play" as const, label: "Listen" },
    { id: "browse", icon: "layoutGrid" as const, label: "Browse" },
    { id: "radio", icon: "signal" as const, label: "Radio" },
    { id: "search", icon: "search" as const, label: "Search" },
  ];

  const refresh = () => {
    stage.replaceChildren(
      view === "player" ? player()
      : tab === "browse" ? browse()
      : tab === "radio" ? radio()
      : tab === "search" ? search()
      : library());
    if (view !== "player" && !bar) { bar = FloatingTabBar(TABS, tab, (id) => { tab = id; view = id as View; refresh(); }, true); root.append(bar.el); }
    if (view === "player" && bar) { bar.el.remove(); bar = null; }
    if (view !== "player" && bar) bar.setActive(tab);
  };
  root.append(glow, stage);
  refresh();
  return root;
}
