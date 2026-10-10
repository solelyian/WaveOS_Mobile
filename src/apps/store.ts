// store.ts — App Store : onglets Today/Apps/Games/Search, catalogue,
// GET -> progression -> OPEN (install = icône springboard + Spotlight).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import type { IconName } from "../core/lucide";
import { GlassHeader, FloatingTabBar } from "./ui";
import { EXTRA_APPS, INSTALLED, appMeta } from "./registry";
import type { AppMeta } from "./registry";
import type { AppId } from "../system/state";
import { shell } from "../shell/api";

interface Entry {
  id?: AppId;          // absent = « coming soon » (pas installable)
  name: string;
  cat: string;
  desc: string;
  rating: string;
  color: string;
  icon: IconName;
}

const CATALOG: Entry[] = [
  ...EXTRA_APPS.map((a) => ({
    id: a.id, name: a.name, cat: a.id === "arcade" ? "Games" : a.id === "notes" ? "Productivity" : "Utilities",
    desc: a.id === "notes" ? "Capture ideas in a flash — synced, searchable, always with you."
      : a.id === "files" ? "All your documents, neatly organized. Browse, preview, done."
      : a.id === "clock" ? "World clocks, stopwatch and a gentle alarm — pixel-perfect."
      : "A pocket arcade. Ripple — chase the light, beat your best streak.",
    rating: "4.9", color: a.color, icon: a.icon,
  })),
  { name: "Wave Racer", cat: "Games", desc: "Anti-gravity racing on the ribbon roads of WaveOS.", rating: "—", color: "linear-gradient(135deg,#f472b6,#e11d48)", icon: "navigation" },
  { name: "Nyne Quest", cat: "Games", desc: "A hand-painted adventure in the Nyne universe.", rating: "—", color: "linear-gradient(135deg,#34d399,#059669)", icon: "compass" },
  { name: "Pulse", cat: "Health", desc: "Mindful minutes, streaks and breathing sessions.", rating: "—", color: "linear-gradient(135deg,#fb923c,#ea580c)", icon: "heart" },
];

const FEATURED: { kicker: string; title: string; sub: string; entry: Entry; grad: string }[] = [
  { kicker: "APP OF THE DAY", title: "Notes", sub: "Your ideas, one tap away", entry: CATALOG[0], grad: "linear-gradient(135deg,#fde047,#f59e0b)" },
  { kicker: "NOW PLAYING", title: "Arcade", sub: "Ripple — a tiny game, dangerously replayable", entry: CATALOG[3], grad: "linear-gradient(135deg,#818cf8,#6d28d9)" },
];

export function StoreApp() {
  let tab = "today";
  const root = h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative" } });
  const stage = h("div", { class: "app-scroll no-sb", style: { flex: "1", padding: "8px 16px 112px" } });

  // ---------- bouton GET -> progression -> OPEN ----------
  const getBtn = (e: Entry, big = false) => {
    const b = h("button", {
      class: "st-get pressable" + (big ? " big" : ""),
      onClick: (ev) => { ev.stopPropagation(); install(b, e); },
    });
    const paint = () => {
      b.classList.remove("busy");
      b.classList.toggle("open", !!e.id && INSTALLED.has(e.id));
      b.replaceChildren(!e.id ? "SOON" : INSTALLED.has(e.id) ? "OPEN" : "GET");
      (b as HTMLButtonElement).disabled = !e.id;
      b.style.opacity = e.id ? "1" : ".55";
    };
    paint();
    (b as any)._paint = paint;
    return b;
  };
  const refreshGets = () =>
    root.querySelectorAll<HTMLElement>(".st-get").forEach((b) => (b as any)._paint?.());

  const install = (b: HTMLElement, e: Entry) => {
    if (!e.id) return;
    if (INSTALLED.has(e.id)) { shell.launchApp(e.id); return; }
    (b as HTMLButtonElement).disabled = true;
    b.classList.add("busy");
    b.replaceChildren(h("i", { class: "st-prog" }, h("em")));
    const bar = b.querySelector("em") as HTMLElement;
    const t0 = performance.now();
    const step = () => {
      const p = Math.min(1, (performance.now() - t0) / 1300);
      bar.style.transform = `scaleX(${p})`;
      if (p < 1) requestAnimationFrame(step);
      else { shell.installApp(e.id!); refreshGets(); }
    };
    requestAnimationFrame(step);
  };

  // ---------- détail ----------
  const detail = (e: Entry) => {
    const m: AppMeta | undefined = e.id ? appMeta(e.id) : undefined;
    const btn = getBtn(e, true);
    const d = h("div", { class: "st-detail", style: { transform: "translateY(60px)", opacity: "0" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 0" } },
        h("button", { class: "st-close g-btn", onClick: () => { d.style.opacity = "0"; d.style.transform = "translateY(60px)"; setTimeout(() => d.remove(), 220); } }, svgIcon(I.x, "", 16))),
      h("div", { style: { padding: "8px 24px 24px", overflowY: "auto", flex: "1" } },
        h("div", { style: { display: "flex", gap: "16px", alignItems: "center", marginBottom: "16px" } },
          h("div", { class: "tile", style: { width: "84px", height: "84px", borderRadius: "20px", background: m?.color ?? e.color, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,0,0,.06)" } },
            (() => { const i = svgIcon(I[(m?.icon ?? e.icon)]); (i.querySelector("svg") as SVGElement).style.cssText = "width:42px;height:42px;color:#fff"; return i; })()),
          h("div", {},
            h("div", { style: { fontSize: "22px", fontWeight: "700", color: "#111" } }, e.name),
            h("div", { style: { fontSize: "13px", color: "#6b7280", fontWeight: "500" } }, e.cat),
            h("div", { style: { display: "flex", gap: "2px", color: "#f59e0b", marginTop: "4px", alignItems: "center" } },
              ...[1, 2, 3, 4, 5].map(() => svgIcon(I.star, "fill", 12)),
              h("span", { style: { fontSize: "12px", color: "#9ca3af", marginLeft: "6px", fontWeight: "600" } }, e.rating))),
        ),
        btn,
        h("div", { style: { height: "1px", background: "#e5e7eb", margin: "20px 0" } }),
        h("p", { style: { fontSize: "15px", lineHeight: "1.55", color: "#374151" } }, e.desc),
        h("div", { style: { fontSize: "13px", fontWeight: "700", color: "#111", margin: "20px 0 10px" } }, "Preview"),
        h("div", { class: "no-sb", style: { display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" } },
          ...[1, 2, 3].map(() => h("div", { style: { width: "150px", height: "260px", flex: "none", borderRadius: "20px", background: m?.color ?? e.color, opacity: ".85", border: "1px solid rgba(0,0,0,.05)", boxShadow: "0 6px 16px rgba(0,0,0,.08)" } })))));
    root.append(d);
    requestAnimationFrame(() => { d.style.opacity = "1"; d.style.transform = "none"; });
  };

  // ---------- lignes catalogue ----------
  const row = (e: Entry) =>
    h("div", { class: "st-row pressable", onClick: () => detail(e) },
      h("div", { class: "tile", style: { width: "56px", height: "56px", borderRadius: "16px", background: e.color, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,0,0,.05)" } },
        (() => { const i = svgIcon(I[e.icon]); (i.querySelector("svg") as SVGElement).style.cssText = "width:28px;height:28px;color:#fff"; return i; })()),
      h("div", { style: { flex: "1", minWidth: "0" } },
        h("div", { style: { fontSize: "16px", fontWeight: "600", color: "#111" } }, e.name),
        h("div", { style: { fontSize: "12px", color: "#9ca3af", fontWeight: "500" } }, e.cat)),
      getBtn(e));

  const featuredCard = (f: typeof FEATURED[number]) =>
    h("div", { class: "pressable", style: { borderRadius: "28px", overflow: "hidden", background: f.grad, color: "#fff", padding: "24px", minHeight: "180px", display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", boxShadow: "0 12px 28px rgba(0,0,0,.14)", marginBottom: "16px", border: "1px solid rgba(255,255,255,.25)" }, onClick: () => detail(f.entry) },
      h("div", { style: { position: "absolute", top: "20px", right: "20px", opacity: ".35", transform: "scale(2.4)", transformOrigin: "top right" } }, svgIcon(I[f.entry.icon], "", 44)),
      h("div", { style: { fontSize: "11px", fontWeight: "800", letterSpacing: ".12em", opacity: ".85" } }, f.kicker),
      h("div", { style: { fontSize: "26px", fontWeight: "800", margin: "4px 0 2px" } }, f.title),
      h("div", { style: { fontSize: "14px", fontWeight: "500", opacity: ".9" } }, f.sub));

  const sectionTitle = (t: string, to?: string) =>
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "20px 4px 12px" } },
      h("span", { style: { fontSize: "20px", fontWeight: "800", color: "#111" } }, t),
      h("span", { class: "pressable", style: { fontSize: "13px", fontWeight: "600", color: "#3b82f6", cursor: "pointer" }, onClick: (ev) => { ev.stopPropagation(); if (to) { tab = to; refresh(); } } }, "See All"));

  // ---------- vues ----------
  const views: Record<string, () => HTMLElement> = {
    today: () => h("div", {},
      ...FEATURED.map(featuredCard),
      sectionTitle("Must-Have Apps", "apps"),
      h("div", { class: "card-white", style: { borderRadius: "24px", padding: "4px 16px" } },
        ...CATALOG.filter((c) => c.id && c.id !== "arcade").map(row))),
    apps: () => h("div", {},
      sectionTitle("Top Free Apps", "apps"),
      h("div", { class: "card-white", style: { borderRadius: "24px", padding: "4px 16px" } },
        ...CATALOG.filter((c) => c.cat !== "Games").map(row))),
    games: () => h("div", {},
      featuredCard(FEATURED[1]),
      sectionTitle("New Games", "games"),
      h("div", { class: "card-white", style: { borderRadius: "24px", padding: "4px 16px" } },
        ...CATALOG.filter((c) => c.cat === "Games").map(row))),
    search: () => {
      const input = h("input", { attrs: { type: "text", placeholder: "Games, apps, stories…" }, style: { flex: "1", background: "none", border: "none", outline: "none", fontSize: "15px", fontWeight: "500", color: "#111" } }) as HTMLInputElement;
      const list = h("div", { class: "card-white", style: { borderRadius: "24px", padding: "4px 16px", marginTop: "12px" } });
      const fill = () => {
        const q = input.value.trim().toLowerCase();
        const rs = CATALOG.filter((c) => c.name.toLowerCase().includes(q) || c.cat.toLowerCase().includes(q));
        list.replaceChildren(...(rs.length ? rs.map(row) : [h("div", { style: { padding: "32px", textAlign: "center", color: "#9ca3af", fontSize: "14px", fontWeight: "500" } }, "No Results")]));
      };
      input.addEventListener("input", fill);
      fill();
      setTimeout(() => input.focus(), 250);
      return h("div", {},
        h("div", { class: "search-pill", style: { marginTop: "4px" } }, svgIcon(I.search, "", 16), input),
        list);
    },
  };

  const TABS = [
    { id: "today", icon: "star" as const, label: "Today" },
    { id: "games", icon: "gamepad2" as const, label: "Games" },
    { id: "apps", icon: "layoutGrid" as const, label: "Apps" },
    { id: "search", icon: "search" as const, label: "Search" },
  ];
  const bar = FloatingTabBar(TABS, tab, (id) => { tab = id; refresh(); });
  const refresh = () => stage.replaceChildren(views[tab]());
  root.append(GlassHeader("Nyne Store", { large: true }), stage, bar.el);
  refresh();
  return root;
}
