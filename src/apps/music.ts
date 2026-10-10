// music.ts — bibliothèque + lecteur : file de pistes, contrôles réels (skip,
// heart), progression câblée sur le ticker partagé (Dynamic Island / CC).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { sys, set, onChange } from "../system/state";
import { TRACKS, cur, next, prev, liked, fmtPos } from "../system/media";
import { GlassHeader, FloatingTabBar, img, pane } from "./ui";

export function MusicApp() {
  const root = h("div", { class: "pg", style: { height: "100%", display: "flex", flexDirection: "column", background: "#050505", color: "#fff" } });
  const scroll = h("div", { class: "app-scroll no-sb", style: { padding: "0 20px 120px" } });

  const trackRow = (i: number) => {
    const t = TRACKS[i];
    return h("div", { class: "lrow pressable", onClick: () => { set("track", i); set("playing", true); player(); } },
      img(t.art, "av"),
      h("div", { class: "tx" },
        h("div", { class: "t1", style: { color: i === sys.track && sys.playing ? "#22c55e" : "#fff" } }, t.title),
        h("div", { class: "t2" }, t.artist)),
      liked.has(i) ? svgIcon(I.heart, "fill", 16) : h("span", { class: "rt" }, fmtPos(t.dur)));
  };

  function player() {
    pane(root, (close) => {
      const t = cur();
      const art = img(t.art, "img-fill") as HTMLImageElement;
      const tt = h("div", { style: { fontSize: "22px", fontWeight: "800", letterSpacing: "-.02em" } }, t.title);
      const ar = h("div", { style: { fontSize: "15px", color: "rgba(255,255,255,.55)", marginTop: "2px" } }, t.artist);
      const fill = h("i", { style: { display: "block", height: "100%", width: "0%", background: "#fff", borderRadius: "3px" } });
      const el = h("span", { style: { fontSize: "11px", color: "rgba(255,255,255,.5)", fontVariantNumeric: "tabular-nums" } }, "0:00");
      const rem = h("span", { style: { fontSize: "11px", color: "rgba(255,255,255,.5)", fontVariantNumeric: "tabular-nums" } }, "-" + fmtPos(t.dur));
      const pp = h("button", { class: "pressable", style: { color: "#fff" }, onClick: () => set("playing", !sys.playing) });
      const heart = h("button", { class: "pressable", onClick: () => {
        liked.has(sys.track) ? liked.delete(sys.track) : liked.add(sys.track); drawHeart();
      } });
      const drawHeart = () => heart.replaceChildren(svgIcon(I.heart, liked.has(sys.track) ? "fill" : "", 22) as Node);
      const sync = () => {
        const c = cur();
        art.src = c.art; tt.textContent = c.title; ar.textContent = c.artist;
        rem.textContent = "-" + fmtPos(Math.max(0, c.dur - sys.position));
        pp.replaceChildren(svgIcon(sys.playing ? I.pause : I.play, "fill", 34) as Node);
        drawHeart();
      };
      let raf = 0;
      const tick = () => {
        const c = cur();
        fill.style.width = `${(sys.position / c.dur) * 100}%`;
        el.textContent = fmtPos(sys.position);
        rem.textContent = "-" + fmtPos(Math.max(0, c.dur - sys.position));
        raf = requestAnimationFrame(tick);
      };
      const off = onChange((k) => { if (k === "track" || k === "playing") sync(); });
      const pg = h("div", { class: "pg", style: { background: "#050505", height: "100%", display: "flex", flexDirection: "column", padding: "60px 28px 60px" } },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
          h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }, onClick: () => { cancelAnimationFrame(raf); off(); close(); } }, svgIcon(I.chevronLeft, "", 18)),
          h("span", { style: { fontSize: "12px", fontWeight: "700", letterSpacing: ".12em", color: "rgba(255,255,255,.5)" } }, "NOW PLAYING"),
          h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" } }, svgIcon(I.ellipsis, "", 16))),
        h("div", { style: { flex: "1", display: "flex", alignItems: "center", justifyContent: "center" } },
          h("div", { style: { width: "270px", height: "270px", borderRadius: "28px", overflow: "hidden", boxShadow: "0 30px 60px -15px rgba(0,0,0,.8)" } }, art)),
        h("div", {},
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" } },
            h("div", {}, tt, ar), heart),
          h("div", { style: { height: "6px", background: "rgba(255,255,255,.15)", borderRadius: "3px", overflow: "hidden" } }, fill),
          h("div", { style: { display: "flex", justifyContent: "space-between", marginTop: "6px" } }, el, rem),
          h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 30px 0" } },
            h("button", { class: "pressable", style: { color: "#fff" }, onClick: () => { sys.position = 0; prev(); } }, svgIcon(I.skipBack, "fill", 28)),
            pp,
            h("button", { class: "pressable", style: { color: "#fff" }, onClick: () => next() }, svgIcon(I.skipForward, "fill", 28))),
          h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 8px 0", color: "rgba(255,255,255,.6)" } },
            svgIcon(I.cast, "", 18), svgIcon(I.list, "", 20), svgIcon(I.share, "", 18))));
      sync(); tick();
      return pg;
    });
  }

  const show = (tab: string) => {
    scroll.replaceChildren();
    if (tab === "listen") {
      const np = cur();
      const hArt = img(np.art, "img-fill");
      const hT = h("div", { style: { fontSize: "20px", fontWeight: "800" } }, np.title);
      const hA = h("div", { style: { fontSize: "13px", color: "rgba(255,255,255,.7)" } }, np.artist);
      const syncHero = () => { const t = cur(); hArt.src = t.art; hT.textContent = t.title; hA.textContent = t.artist; };
      onChange((k) => { if (k === "track") syncHero(); });
      scroll.append(
        h("div", { class: "pressable", style: { position: "relative", height: "220px", borderRadius: "28px", overflow: "hidden", marginBottom: "18px" }, onClick: () => { set("playing", true); player(); } },
          hArt,
          h("div", { style: { position: "absolute", inset: "0", background: "linear-gradient(to top, rgba(0,0,0,.8), transparent 60%)" } }),
          h("div", { style: { position: "absolute", left: "18px", bottom: "16px" } },
            h("div", { style: { fontSize: "11px", fontWeight: "700", letterSpacing: ".12em", color: "rgba(255,255,255,.7)" } }, "NOW PLAYING"),
            hT, hA)),
        h("div", { style: { fontSize: "20px", fontWeight: "700", letterSpacing: "-.02em", margin: "4px 2px 6px" } }, "Up Next"),
        h("div", { style: { background: "rgba(255,255,255,.05)", borderRadius: "24px", padding: "4px 14px", border: "1px solid rgba(255,255,255,.08)" } },
          ...TRACKS.map((_, i) => trackRow(i))),
        h("div", { style: { fontSize: "20px", fontWeight: "700", letterSpacing: "-.02em", margin: "18px 2px 8px" } }, "Top Picks"),
        h("div", { class: "no-sb", style: { display: "flex", gap: "12px", overflowX: "auto", margin: "0 -20px", padding: "0 20px" } },
          ...[["Mix One", "/img/mix-1.jpg"], ["Chill Waves", "/img/mix-2.jpg"], ["Deep Focus", "/img/mix-3.jpg"], ["Night Drive", "/img/mix-4.jpg"]].map(([n, s], i) =>
            h("div", { class: "pressable", style: { flex: "none", width: "140px" }, onClick: () => { set("track", (i + 1) % TRACKS.length); set("playing", true); player(); } },
              h("div", { style: { width: "140px", height: "140px", borderRadius: "20px", overflow: "hidden" } }, img(s, "img-fill")),
              h("div", { style: { fontSize: "13px", fontWeight: "600", marginTop: "6px" } }, n)))));
    } else if (tab === "browse") {
      scroll.append(
        h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } },
          ...[["New Music", "linear-gradient(135deg,#f472b6,#be185d)"], ["Charts", "linear-gradient(135deg,#60a5fa,#1d4ed8)"], ["Moods", "linear-gradient(135deg,#a78bfa,#5b21b6)"], ["Classics", "linear-gradient(135deg,#fbbf24,#b45309)"], ["Workout", "linear-gradient(135deg,#34d399,#065f46)"], ["Jazz", "linear-gradient(135deg,#f87171,#7f1d1d)"]].map(([n, bg]) =>
            h("div", { class: "pressable", style: { height: "90px", borderRadius: "22px", background: bg, display: "flex", alignItems: "flex-end", padding: "14px", fontWeight: "800", fontSize: "17px", letterSpacing: "-.01em" } }, n))));
    } else if (tab === "radio") {
      scroll.append(h("div", { style: { fontSize: "20px", fontWeight: "700", margin: "4px 2px 8px" } }, "Radio"),
        h("div", { style: { background: "rgba(255,255,255,.05)", borderRadius: "24px", padding: "4px 14px", border: "1px solid rgba(255,255,255,.08)" } },
          ...([["Wave One", "Pop hits & exclusives", true], ["Chill Station", "Downtempo all day", false], ["Night Drive FM", "Synthwave & beyond", false]] as [string, string, boolean][]).map(([n, d, live]) =>
            h("div", { class: "lrow pressable", onClick: () => { set("playing", true); } },
              h("div", { style: { width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg,#ef4444,#7f1d1d)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" } }, svgIcon(I.music, "", 20)),
              h("div", { class: "tx" }, h("div", { class: "t1" }, n), h("div", { class: "t2" }, d)),
              live ? h("span", { style: { fontSize: "10px", fontWeight: "800", letterSpacing: ".1em", color: "#ef4444", border: "1px solid rgba(239,68,68,.4)", padding: "3px 8px", borderRadius: "999px" } }, "LIVE") : null))));
    } else {
      const input = h("input", { attrs: { placeholder: "Artists, Songs, Lyrics" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "14px", color: "#fff" } }) as HTMLInputElement;
      const list = h("div", { style: { background: "rgba(255,255,255,.05)", borderRadius: "24px", padding: "4px 14px", border: "1px solid rgba(255,255,255,.08)" } });
      const draw = () => {
        const q = input.value.trim().toLowerCase();
        list.replaceChildren(...TRACKS.map((t, i) => [t, i] as const).filter(([t]) => !q || (t.title + t.artist).toLowerCase().includes(q)).map(([, i]) => trackRow(i)));
      };
      input.addEventListener("input", draw); draw();
      scroll.append(h("div", { class: "search-pill", style: { margin: "2px 0 8px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)" } }, svgIcon(I.search), input), list);
      setTimeout(() => input.focus(), 60);
    }
  };

  const tabs = FloatingTabBar([
    { id: "listen", icon: "play", label: "Listen Now" },
    { id: "browse", icon: "layoutGrid", label: "Browse" },
    { id: "radio", icon: "cast", label: "Radio" },
    { id: "search", icon: "search", label: "Search" },
  ], "listen", show, true);

  show("listen");
  root.append(GlassHeader("Music", { large: true }), scroll, tabs.el);
  (root.querySelector(".ghdr h1") as HTMLElement | null)?.style.setProperty("color", "#fff");
  const bk = root.querySelector(".ghdr .bk") as HTMLElement | null; if (bk) bk.style.color = "#fff";
  return root;
}
