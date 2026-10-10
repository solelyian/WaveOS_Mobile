// extras.ts — apps installables via l'App Store : Notes, Files, Clock, Arcade.
// Chacune est réellement utilisable (édition, navigation, chrono live, jeu).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { GlassHeader, FloatingTabBar } from "./ui";
import { fmtTime } from "../system/state";

/* ============================== NOTES ============================== */
interface Note { id: number; title: string; body: string; ts: number }
const NOTE_KEY = "waveos.notes";

export function NotesApp() {
  let notes: Note[] = load();
  let open: Note | null = null;
  const root = h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative", background: "#fafaf7" } });
  const stage = h("div", { style: { flex: "1", display: "flex", flexDirection: "column", minHeight: "0" } });

  function load(): Note[] {
    try { return JSON.parse(localStorage.getItem(NOTE_KEY) || "null") ?? seed(); }
    catch { return seed(); }
  }
  function seed(): Note[] {
    return [
      { id: 1, title: "WaveOS ideas", body: "Spring-driven everything. Pill physics feel right — keep mass under 1 for UI, heavier for sheets.\n\nTry: stiffness 400 / damping 30 for the island.", ts: Date.now() - 86400000 },
      { id: 2, title: "Groceries", body: "Coffee, oats, eggs, basil, dark chocolate.", ts: Date.now() - 3600000 },
    ];
  }
  const save = () => localStorage.setItem(NOTE_KEY, JSON.stringify(notes));

  const listView = () => {
    const list = h("div", { class: "app-scroll no-sb", style: { padding: "8px 16px 96px" } },
      ...notes.map((n) => h("div", {
        class: "card-white pressable", style: { padding: "16px 18px", marginBottom: "10px" },
        onClick: () => { open = n; refresh(); },
      },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline" } },
          h("span", { style: { fontSize: "16px", fontWeight: "700", color: "#111" } }, n.title || "New Note"),
          h("span", { style: { fontSize: "11px", color: "#9ca3af", fontWeight: "600" } }, new Date(n.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }))),
        h("div", { style: { fontSize: "13px", color: "#6b7280", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, n.body.split("\n")[0] || "No additional text"))));
    if (!notes.length) list.append(
      h("div", { style: { textAlign: "center", padding: "80px 0", color: "#9ca3af" } },
        svgIcon(I.list, "", 40), h("div", { style: { marginTop: "8px", fontWeight: "600" } }, "No Notes")));
    return list;
  };

  const editor = (n: Note) => {
    const title = h("input", { attrs: { type: "text", placeholder: "Title" }, style: { width: "100%", fontSize: "24px", fontWeight: "700", border: "none", outline: "none", background: "none", color: "#111", padding: "16px 20px 0" } }) as HTMLInputElement;
    title.value = n.title;
    const body = h("textarea", {
      attrs: { placeholder: "Start writing…" },
      style: { flex: "1", width: "100%", resize: "none", border: "none", outline: "none", background: "none", fontSize: "16px", lineHeight: "1.55", color: "#1f2937", padding: "12px 20px 24px", fontFamily: "inherit" },
      onInput: () => { n.body = body.value; n.ts = Date.now(); save(); },
    }) as HTMLTextAreaElement;
    body.value = n.body;
    title.addEventListener("input", () => { n.title = title.value; n.ts = Date.now(); save(); });
    const del = () => { notes = notes.filter((x) => x !== n); save(); open = null; refresh(); };
    return h("div", { style: { flex: "1", display: "flex", flexDirection: "column", paddingTop: "52px", background: "#fff" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 12px" } },
        h("button", { class: "bk g-btn", style: { color: "#eab308" }, onClick: () => { open = null; refresh(); } }, svgIcon(I.chevronLeft)),
        h("button", { class: "pressable", style: { color: "#ef4444", padding: "8px", display: "flex" }, onClick: del }, svgIcon(I.trash2, "", 18))),
      title, body);
  };

  const fab = h("button", {
    class: "app-fab", style: { bottom: "36px", right: "20px", width: "56px", height: "56px", background: "#eab308", color: "#fff", border: "1px solid #fde047" },
    onClick: () => { const n: Note = { id: Date.now(), title: "", body: "", ts: Date.now() }; notes.unshift(n); save(); open = n; refresh(); },
  }, svgIcon(I.squarePen, "", 24));

  const refresh = () => { stage.replaceChildren(open ? editor(open) : h("div", { style: { display: "contents" } }, GlassHeader("Notes", { large: true }), listView())); fab.style.display = open ? "none" : "flex"; };
  root.append(stage, fab);
  refresh();
  return root;
}

/* ============================== FILES ============================== */
interface FNode { name: string; dir?: boolean; size?: string; kids?: FNode[] }
const FS: FNode = {
  name: "Nyne Drive", dir: true, kids: [
    { name: "Design", dir: true, kids: [{ name: "sillage-tokens.json", size: "12 KB" }, { name: "icons.sketch", size: "8.4 MB" }, { name: "wallpapers", dir: true, kids: [{ name: "rubans.psd", size: "44 MB" }, { name: "yosemite.heic", size: "6.1 MB" }] }] },
    { name: "Documents", dir: true, kids: [{ name: "roadmap-2027.pdf", size: "1.2 MB" }, { name: "pitch.key", size: "18 MB" }] },
    { name: "Photos", dir: true, kids: [{ name: "yosemite-trip", dir: true, kids: [{ name: "IMG_0041.heic", size: "3.2 MB" }, { name: "IMG_0042.heic", size: "2.9 MB" }] }] },
    { name: "notes.txt", size: "2 KB" },
    { name: "waveos-spec.md", size: "48 KB" },
  ],
};

export function FilesApp() {
  const path: FNode[] = [FS];
  const root = h("div", { style: { height: "100%", display: "flex", flexDirection: "column" } });
  const crumbs = h("div", { class: "no-sb", style: { display: "flex", gap: "6px", alignItems: "center", padding: "8px 20px 4px", overflowX: "auto", flexShrink: "0" } });
  const list = h("div", { class: "app-scroll no-sb", style: { padding: "8px 16px 40px" } });

  const render = () => {
    const cwd = path[path.length - 1];
    crumbs.replaceChildren(...path.map((n, i) => h("button", {
      class: "pressable", style: { fontSize: "13px", fontWeight: i === path.length - 1 ? "700" : "500", color: i === path.length - 1 ? "#111" : "#3b82f6", whiteSpace: "nowrap" },
      onClick: () => { path.length = i + 1; render(); },
    }, n.name, ...(i < path.length - 1 ? [h("span", { style: { color: "#d1d5db", margin: "0 2px" } }, " ›")] : []))));
    const kids = [...(cwd.kids ?? [])].sort((a, b) => +!!b.dir - +!!a.dir || a.name.localeCompare(b.name));
    const rows = kids.map((n) =>
      h("div", {
        class: "set-row pressable", style: { background: "#fff", borderRadius: "18px", marginBottom: "8px", border: "1px solid #f3f4f6" },
        onClick: () => { if (n.dir) { path.push(n); render(); } },
      },
        h("div", { class: "set-ic", style: { background: n.dir ? "#3b82f6" : "#9ca3af" } }, svgIcon(n.dir ? I.folderOpen : I.file)),
        h("div", { style: { flex: "1", minWidth: "0" } },
          h("div", { class: "set-lbl", style: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, n.name),
          h("div", { style: { fontSize: "11px", color: "#9ca3af" } }, n.dir ? `${n.kids!.length} items` : n.size)),
        n.dir ? h("span", { class: "chev" }, svgIcon(I.chevronLeft, "", 16)) : h("span")));
    const empty = h("div", { style: { textAlign: "center", padding: "60px", color: "#9ca3af", fontWeight: "500" } }, "Empty Folder");
    list.replaceChildren(...(rows.length ? rows : [empty]));
  };

  root.append(GlassHeader("Files", { large: true }), crumbs, list);
  render();
  return root;
}

/* ============================== CLOCK ============================== */
export function ClockApp() {
  let tab = "world";
  let running = false, t0 = 0, acc = 0, raf = 0;
  const laps: number[] = [];
  const root = h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative" } });
  const stage = h("div", { class: "app-scroll no-sb", style: { flex: "1", padding: "8px 24px 112px" } });

  const fmt = (ms: number) => {
    const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60, c = Math.floor(ms / 10) % 100;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(c).padStart(2, "0")}`;
  };

  const world = () => {
    const cities: [string, number][] = [["San Francisco", -7], ["New York", -4], ["London", 1], ["Paris", 2], ["Tokyo", 9]];
    const now = new Date();
    return h("div", { style: { display: "flex", flexDirection: "column", gap: "10px" } },
      ...cities.map(([name, off]) => {
        const d = new Date(now.getTime() + off * 3600000 - now.getTimezoneOffset() * 60000);
        return h("div", { class: "card-white", style: { padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)" } },
          h("div", {},
            h("div", { style: { fontSize: "12px", color: "rgba(255,255,255,.5)", fontWeight: "600" } }, "Today"),
            h("div", { style: { fontSize: "20px", fontWeight: "600" } }, name)),
          h("div", { style: { fontSize: "30px", fontWeight: "200", letterSpacing: "-.02em" } }, fmtTime(d)));
      }));
  };

  const stopwatch = () => {
    const disp = h("div", { style: { fontSize: "72px", fontWeight: "200", textAlign: "center", fontVariantNumeric: "tabular-nums", margin: "40px 0 32px", letterSpacing: "-.03em" } }, "00:00.00");
    const lapList = h("div", { style: { display: "flex", flexDirection: "column", marginTop: "24px" } });
    const btnRow = h("div", { style: { display: "flex", justifyContent: "space-between", padding: "0 16px" } });
    const paintLaps = () => lapList.replaceChildren(...laps.map((l, i) =>
      h("div", { style: { display: "flex", justifyContent: "space-between", padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,.08)", fontSize: "15px", fontVariantNumeric: "tabular-nums" } },
        h("span", { style: { color: "rgba(255,255,255,.5)" } }, `Lap ${laps.length - i}`),
        h("span", {}, fmt(l)))));
    const tickLoop = () => {
      disp.textContent = fmt(acc + (running ? performance.now() - t0 : 0));
      raf = requestAnimationFrame(tickLoop);
    };
    const btn = (label: string, bg: string, fn: () => void) =>
      h("button", { class: "pressable", style: { width: "88px", height: "88px", borderRadius: "50%", background: bg, fontSize: "15px", fontWeight: "600" }, onClick: fn }, label);
    const paint = () => {
      btnRow.replaceChildren(
        btn(running ? "Lap" : "Reset", "rgba(255,255,255,.12)", () => {
          if (running) { laps.unshift(acc + performance.now() - t0); paintLaps(); }
          else { acc = 0; laps.length = 0; paintLaps(); }
        }),
        btn(running ? "Stop" : "Start", running ? "rgba(239,68,68,.15)" : "rgba(34,197,94,.15)", () => {
          if (running) { acc += performance.now() - t0; running = false; }
          else { t0 = performance.now(); running = true; }
          paint();
        }));
      (btnRow.children[0] as HTMLElement).style.color = "#fff";
      (btnRow.children[1] as HTMLElement).style.color = running ? "#f87171" : "#4ade80";
    };
    paint();
    tickLoop();
    return h("div", {}, disp, btnRow, lapList);
  };

  const TABS = [
    { id: "world", icon: "globe" as const, label: "World" },
    { id: "alarms", icon: "bell" as const, label: "Alarms" },
    { id: "stopwatch", icon: "clock" as const, label: "Stopwatch" },
    { id: "timer", icon: "list" as const, label: "Timer" },
  ];
  const alarms = () => h("div", { style: { display: "flex", flexDirection: "column", gap: "10px" } },
    ...([["7:00 AM", "Wake up", true], ["8:30 AM", "Standup", true], ["10:00 PM", "Wind down", false]] as [string, string, boolean][]).map(([t, l, on]) =>
      h("div", { class: "card-white", style: { padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)" } },
        h("div", {}, h("div", { style: { fontSize: "34px", fontWeight: "200" } }, t), h("div", { style: { fontSize: "13px", color: "rgba(255,255,255,.5)" } }, l)),
        (() => {
          const tg = h("button", { class: "pressable", style: { width: "52px", height: "32px", borderRadius: "16px", background: on ? "#22c55e" : "rgba(255,255,255,.15)", position: "relative", transition: "background .2s" } },
            h("i", { style: { position: "absolute", top: "3px", left: on ? "23px" : "3px", width: "26px", height: "26px", borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 2px 6px rgba(0,0,0,.3)" } }));
          tg.addEventListener("click", () => {
            const onNow = tg.style.background.includes("34,197,94");
            tg.style.background = onNow ? "rgba(255,255,255,.15)" : "#22c55e";
            (tg.firstChild as HTMLElement).style.left = onNow ? "3px" : "23px";
          });
          return tg;
        })())));
  const timer = () => {
    let left = 300, id = 0;
    const disp = h("div", { style: { fontSize: "72px", fontWeight: "200", textAlign: "center", margin: "48px 0", fontVariantNumeric: "tabular-nums" } });
    const paint = () => { disp.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; };
    paint();
    return h("div", {}, disp,
      h("div", { style: { display: "flex", justifyContent: "center", gap: "16px" } },
        ...([[60, "+1m"], [300, "+5m"], [600, "+10m"]] as [number, string][]).map(([s, l]) =>
          h("button", { class: "pressable", style: { padding: "12px 20px", borderRadius: "999px", background: "rgba(255,255,255,.1)", fontWeight: "600" }, onClick: () => { left += s; paint(); } }, l)),
        h("button", { class: "pressable", style: { padding: "12px 24px", borderRadius: "999px", background: "#22c55e", fontWeight: "700" }, onClick: (e) => {
          if (id) { clearInterval(id); id = 0; (e.target as HTMLElement).textContent = "Start"; (e.target as HTMLElement).style.background = "#22c55e"; }
          else { (e.target as HTMLElement).textContent = "Pause"; (e.target as HTMLElement).style.background = "#f97316"; id = setInterval(() => { left = Math.max(0, left - 1); paint(); if (!left) clearInterval(id); }, 1000) as unknown as number; }
        } }, "Start")));
  };

  const views: Record<string, () => HTMLElement> = { world, alarms, stopwatch, timer };
  const bar = FloatingTabBar(TABS, tab, (id) => { tab = id; cancelAnimationFrame(raf); refresh(); });
  const refresh = () => { stage.replaceChildren(h("h1", { style: { fontSize: "34px", fontWeight: "800", margin: "8px 4px 20px" } }, { world: "World Clock", alarms: "Alarms", stopwatch: "Stopwatch", timer: "Timer" }[tab]!), views[tab]()); };
  root.append(GlassHeader("", {}), stage, bar.el);
  refresh();
  return root;
}

/* ============================== ARCADE — « Ripple » ============================== */
// Mini-jeu : des anneaux apparaissent, tape-les avant qu'ils n'expirent.
// Score + meilleur score persisté.
export function ArcadeApp() {
  const root = h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" } });
  let best = +(localStorage.getItem("waveos.ripple-best") || "0");
  let score = 0, lives = 3, playing = false, spawnId = 0;

  const hud = h("div", { style: { display: "flex", justifyContent: "space-between", padding: "64px 24px 0", position: "relative", zIndex: "5" } });
  const field = h("div", { style: { position: "absolute", inset: "0" } });
  const overlay = h("div", { style: { position: "absolute", inset: "0", zIndex: "10", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", background: "rgba(5,5,20,.6)", backdropFilter: "blur(8px)" } });

  const paintHud = () => hud.replaceChildren(
    h("div", { style: { fontSize: "15px", fontWeight: "700" } }, `Score  ${score}`),
    h("div", { style: { display: "flex", gap: "4px" } }, ...[0, 1, 2].map((i) => {
      const ic = svgIcon(I.heart, "fill", 18);
      (ic.querySelector("svg") as SVGElement).style.color = i < lives ? "#f87171" : "rgba(255,255,255,.15)";
      return ic;
    })),
    h("div", { style: { fontSize: "15px", fontWeight: "700", color: "#a5b4fc" } }, `Best  ${best}`));

  const spawn = () => {
    if (!playing) return;
    const size = 56 + Math.random() * 40;
    const x = 20 + Math.random() * (360 - size);
    const y = 140 + Math.random() * (560 - size);
    const life = Math.max(650, 1600 - score * 22);
    const ring = h("button", {
      class: "rip", style: { left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size}px` },
      onPointerDown: (e) => {
        e.stopPropagation();
        score += 10;
        clearTimeout(+ring.dataset.t!);
        ring.classList.add("hit");
        setTimeout(() => ring.remove(), 180);
        paintHud();
      },
    });
    const t = setTimeout(() => {
      ring.remove();
      lives -= 1;
      paintHud();
      if (lives <= 0) gameOver();
    }, life) as unknown as number;
    ring.dataset.t = String(t);
    field.append(ring);
    requestAnimationFrame(() => ring.classList.add("on"));
    spawnId = setTimeout(spawn, Math.max(420, 900 - score * 6)) as unknown as number;
  };

  const start = () => {
    score = 0; lives = 3; playing = true;
    field.replaceChildren();
    overlay.style.display = "none";
    paintHud();
    spawn();
  };
  const gameOver = () => {
    playing = false;
    clearTimeout(spawnId);
    field.replaceChildren();
    best = Math.max(best, score);
    localStorage.setItem("waveos.ripple-best", String(best));
    overlay.style.display = "flex";
    overlay.replaceChildren(
      h("div", { style: { fontSize: "36px", fontWeight: "800" } }, "Game Over"),
      h("div", { style: { fontSize: "18px", color: "rgba(255,255,255,.7)" } }, `Score ${score} — Best ${best}`),
      playBtn("Play Again"));
  };
  const playBtn = (label: string) =>
    h("button", { class: "pressable", style: { padding: "16px 40px", borderRadius: "999px", background: "linear-gradient(135deg,#818cf8,#7c3aed)", fontSize: "17px", fontWeight: "700", boxShadow: "0 10px 30px rgba(124,58,237,.4)", border: "1px solid rgba(255,255,255,.3)" }, onClick: start }, label);

  overlay.replaceChildren(
    h("div", { style: { fontSize: "14px", fontWeight: "800", letterSpacing: ".2em", color: "#a5b4fc" } }, "WAVEOS ARCADE"),
    h("div", { style: { fontSize: "44px", fontWeight: "800" } }, "Ripple"),
    h("div", { style: { fontSize: "15px", color: "rgba(255,255,255,.6)", textAlign: "center", padding: "0 40px" } }, "Tap the rings before they fade. Miss three and it's over."),
    playBtn("Play"));

  root.append(
    h("div", { style: { position: "absolute", inset: "0", background: "radial-gradient(120% 90% at 50% 0%, #312e81 0%, #0a0a1a 60%)" } }),
    hud, field, overlay,
    h("button", { class: "g-btn pressable", style: { position: "absolute", top: "60px", right: "20px", padding: "10px", borderRadius: "50%", zIndex: "20", display: "flex" }, onClick: () => import("../shell/api").then((m) => m.shell.closeApp()) }, svgIcon(I.x, "", 16)));
  paintHud();
  return root;
}
