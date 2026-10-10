// music.ts — bibliothèque + lecteur complet : file de pistes, seek cliquable,
// shuffle/repeat réels (media.ts), genres ouvrables, radio jouable, Up Next /
// AirPlay / actions — progression câblée sur le ticker partagé.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { sys, set, onChange } from "../system/state";
import { TRACKS, cur, next, prev, liked, fmtPos, mode } from "../system/media";
import { GlassHeader, FloatingTabBar, img, pane, toast } from "./ui";

const GENRES: [string, string, number[]][] = [
  ["New Music", "linear-gradient(135deg,#f472b6,#be185d)", [0, 1, 4, 2, 3]],
  ["Charts", "linear-gradient(135deg,#60a5fa,#1d4ed8)", [1, 3, 0, 4, 2]],
  ["Moods", "linear-gradient(135deg,#a78bfa,#5b21b6)", [4, 2, 1, 0, 3]],
  ["Classics", "linear-gradient(135deg,#fbbf24,#b45309)", [2, 0, 3, 1, 4]],
  ["Workout", "linear-gradient(135deg,#34d399,#065f46)", [3, 1, 4, 0, 2]],
  ["Jazz", "linear-gradient(135deg,#f87171,#7f1d1d)", [4, 0, 2, 3, 1]],
];

const STATIONS: [string, string, number, boolean][] = [
  ["Wave One", "Pop hits & exclusives", 0, true],
  ["Chill Station", "Downtempo all day", 4, false],
  ["Night Drive FM", "Synthwave & beyond", 3, false],
];

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

  // ---- Up Next : file d'attente depuis la piste courante --------------------
  function queue() {
    pane(root, (close) => {
      const g = h("div", { style: { background: "rgba(255,255,255,.05)", borderRadius: "24px", padding: "4px 14px", border: "1px solid rgba(255,255,255,.08)" } });
      const draw = () => g.replaceChildren(...TRACKS.map((_, i) => (sys.track + i) % TRACKS.length).map((i) => {
        const t = TRACKS[i];
        return h("div", { class: "lrow" + (i === sys.track ? "" : " pressable"), onClick: () => { set("track", i); draw(); } },
          img(t.art, "av"),
          h("div", { class: "tx" },
            h("div", { class: "t1", style: { color: i === sys.track ? "#22c55e" : "#fff" } }, t.title),
            h("div", { class: "t2" }, t.artist)),
          i === sys.track ? svgIcon(I.music, "", 16) : h("span", { class: "rt" }, fmtPos(t.dur)));
      }));
      draw();
      return h("div", { class: "pg", style: { background: "#050505", height: "100%", display: "flex", flexDirection: "column" } },
        h("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "60px 16px 10px" } },
          h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }, onClick: close }, svgIcon(I.chevronLeft, "", 18)),
          h("span", { style: { fontWeight: "700", fontSize: "17px" } }, "Up Next")),
        h("div", { class: "no-sb", style: { flex: "1", overflowY: "auto", padding: "6px 20px 40px" } }, g));
    });
  }

  function airplay() {
    pane(root, (close) =>
      h("div", { class: "pg", style: { background: "#050505", height: "100%", display: "flex", flexDirection: "column" } },
        h("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "60px 16px 10px" } },
          h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }, onClick: close }, svgIcon(I.chevronLeft, "", 18)),
          h("span", { style: { fontWeight: "700", fontSize: "17px" } }, "AirPlay")),
        h("div", { class: "no-sb", style: { flex: "1", overflowY: "auto", padding: "6px 20px 40px" } },
          h("div", { style: { fontSize: "12px", fontWeight: "700", letterSpacing: ".08em", color: "rgba(255,255,255,.45)", textTransform: "uppercase", margin: "4px 2px 8px" } }, "Speakers & TVs"),
          h("div", { style: { background: "rgba(255,255,255,.05)", borderRadius: "24px", padding: "4px 14px", border: "1px solid rgba(255,255,255,.08)" } },
            ...["This Phone", "Living Room HomePod", "Nyne TV", "MacBook Pro"].map((n, i) =>
              h("div", { class: "lrow pressable", onClick: () => { close(); toast(root, i === 0 ? "Playing on this phone" : `Playing on ${n}`); } },
                h("div", { style: { width: "40px", height: "40px", borderRadius: "12px", background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" } },
                  svgIcon(i === 0 ? I.music : I.cast, "", 18)),
                h("div", { class: "tx" }, h("div", { class: "t1" }, n)),
                i === 0 ? svgIcon(I.check, "", 18) : null))))));
  }

  // ---- lecteur --------------------------------------------------------------
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
      const shuf = h("button", { class: "pressable", style: { color: mode.shuffle ? "#22c55e" : "rgba(255,255,255,.5)" }, onClick: () => { mode.shuffle = !mode.shuffle; drawModes(); toast(root, mode.shuffle ? "Shuffle on" : "Shuffle off"); } });
      const rep = h("button", { class: "pressable", style: { color: mode.repeat ? "#22c55e" : "rgba(255,255,255,.5)" }, onClick: () => { mode.repeat = ((mode.repeat + 1) % 3) as 0 | 1 | 2; drawModes(); toast(root, mode.repeat === 0 ? "Repeat off" : mode.repeat === 1 ? "Repeat all" : "Repeat one"); } });
      const drawModes = () => {
        shuf.style.color = mode.shuffle ? "#22c55e" : "rgba(255,255,255,.5)";
        rep.style.color = mode.repeat ? "#22c55e" : "rgba(255,255,255,.5)";
        rep.replaceChildren(svgIcon(mode.repeat === 2 ? I.repeat1 : I.repeat, "", 20) as Node);
      };
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

      const bar = h("div", { style: { padding: "10px 0", cursor: "pointer" } },
        h("div", { style: { height: "6px", background: "rgba(255,255,255,.15)", borderRadius: "3px", overflow: "hidden" } }, fill));
      const seek = (e: PointerEvent) => {
        const r = bar.getBoundingClientRect();
        const ratio = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
        sys.position = ratio * cur().dur;
      };
      bar.addEventListener("pointerdown", (e) => {
        seek(e);
        const mv = (ev: PointerEvent) => seek(ev);
        window.addEventListener("pointermove", mv);
        window.addEventListener("pointerup", () => window.removeEventListener("pointermove", mv), { once: true });
      });

      const pg = h("div", { class: "pg", style: { background: "#050505", height: "100%", display: "flex", flexDirection: "column", padding: "60px 28px 60px" } },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
          h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }, onClick: () => { cancelAnimationFrame(raf); off(); close(); } }, svgIcon(I.chevronLeft, "", 18)),
          h("span", { style: { fontSize: "12px", fontWeight: "700", letterSpacing: ".12em", color: "rgba(255,255,255,.5)" } }, "NOW PLAYING"),
          h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" },
            onClick: () => toast(root, `${cur().title} — ${cur().artist}`) }, svgIcon(I.ellipsis, "", 16))),
        h("div", { style: { flex: "1", display: "flex", alignItems: "center", justifyContent: "center" } },
          h("div", { style: { width: "270px", height: "270px", borderRadius: "28px", overflow: "hidden", boxShadow: "0 30px 60px -15px rgba(0,0,0,.8)" } }, art)),
        h("div", {},
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" } },
            h("div", {}, tt, ar), heart),
          bar,
          h("div", { style: { display: "flex", justifyContent: "space-between", marginTop: "2px" } }, el, rem),
          h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 30px 0" } },
            (drawModes(), shuf),
            h("div", { style: { display: "flex", alignItems: "center", gap: "26px" } },
              h("button", { class: "pressable", style: { color: "#fff" }, onClick: () => prev() }, svgIcon(I.skipBack, "fill", 28)),
              pp,
              h("button", { class: "pressable", style: { color: "#fff" }, onClick: () => next() }, svgIcon(I.skipForward, "fill", 28))),
            rep),
          h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 8px 0", color: "rgba(255,255,255,.6)" } },
            h("button", { class: "pressable", style: { color: "inherit", display: "flex" }, onClick: airplay }, svgIcon(I.cast, "", 18)),
            h("button", { class: "pressable", style: { color: "inherit", display: "flex" }, onClick: queue }, svgIcon(I.list, "", 20)),
            h("button", { class: "pressable", style: { color: "inherit", display: "flex" }, onClick: () => toast(root, `Shared “${cur().title}”`) }, svgIcon(I.share, "", 18)))));
      sync(); tick();
      return pg;
    });
  }

  // ---- page genre (Browse) --------------------------------------------------
  function genre(name: string, order: number[]) {
    pane(root, (close) =>
      h("div", { class: "pg", style: { background: "#050505", height: "100%", display: "flex", flexDirection: "column" } },
        h("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "60px 16px 10px" } },
          h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }, onClick: close }, svgIcon(I.chevronLeft, "", 18)),
          h("span", { style: { fontWeight: "700", fontSize: "17px" } }, name)),
        h("div", { class: "no-sb", style: { flex: "1", overflowY: "auto", padding: "6px 20px 40px" } },
          h("div", { style: { background: "rgba(255,255,255,.05)", borderRadius: "24px", padding: "4px 14px", border: "1px solid rgba(255,255,255,.08)" } },
            ...order.map((i) => trackRow(i))))));
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
            h("div", { class: "pressable", style: { flex: "none", width: "140px" }, onClick: () => genre(n as string, TRACKS.map((_, k) => (k + i) % TRACKS.length)) },
              h("div", { style: { width: "140px", height: "140px", borderRadius: "20px", overflow: "hidden" } }, img(s, "img-fill")),
              h("div", { style: { fontSize: "13px", fontWeight: "600", marginTop: "6px" } }, n)))));
    } else if (tab === "browse") {
      scroll.append(
        h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } },
          ...GENRES.map(([n, bg, order]) =>
            h("div", { class: "pressable", style: { height: "90px", borderRadius: "22px", background: bg, display: "flex", alignItems: "flex-end", padding: "14px", fontWeight: "800", fontSize: "17px", letterSpacing: "-.01em", cursor: "pointer" },
              onClick: () => genre(n, order) }, n))));
    } else if (tab === "radio") {
      scroll.append(h("div", { style: { fontSize: "20px", fontWeight: "700", margin: "4px 2px 8px" } }, "Radio"),
        h("div", { style: { background: "rgba(255,255,255,.05)", borderRadius: "24px", padding: "4px 14px", border: "1px solid rgba(255,255,255,.08)" } },
          ...STATIONS.map(([n, d, ti, live]) =>
            h("div", { class: "lrow pressable", onClick: () => { set("track", ti); set("playing", true); player(); toast(root, `Playing ${n}`); } },
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
