// store.ts — App Store : onglets Today / Apps / Search, fiches app, boutons GET
// (GET → téléchargement → OPEN ; les apps système s'ouvrent pour de vrai).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import type { IconName } from "../core/lucide";
import type { AppId } from "../system/state";
import { shell } from "../shell/api";
import { GlassHeader, FloatingTabBar, img, pane, toast } from "./ui";

interface StoreApp {
  id: string; sysId?: AppId;
  name: string; cat: string; desc: string;
  rating: number; reviews: string; size: string; age: string;
  art: string; icon: IconName; shots: string[];
}

const CATALOG: StoreApp[] = [
  { id: "weather", sysId: "weather", name: "Wave Weather", cat: "Weather", desc: "Hyperlocal forecasts with live radar and beautiful animated conditions.", rating: 4.8, reviews: "12K", size: "24 MB", age: "4+", art: "linear-gradient(135deg,#60a5fa,#2563eb)", icon: "sun", shots: ["/img/photos/ph-0.jpg", "/img/photos/ph-1.jpg", "/img/photos/ph-2.jpg"] },
  { id: "nova-runner", name: "Nova Runner", cat: "Games", desc: "Dash through neon canyons at 120fps. One-thumb controls, endless style.", rating: 4.6, reviews: "98K", size: "182 MB", age: "9+", art: "linear-gradient(135deg,#f472b6,#7c3aed)", icon: "gamepad2", shots: ["/img/photos/ph-3.jpg", "/img/photos/ph-4.jpg", "/img/photos/ph-5.jpg"] },
  { id: "maps", sysId: "maps", name: "Wave Maps", cat: "Navigation", desc: "Procedurally rendered maps with turn-by-turn guidance.", rating: 4.7, reviews: "8.2K", size: "58 MB", age: "4+", art: "linear-gradient(135deg,#4ade80,#16a34a)", icon: "map", shots: ["/img/maps-1.jpg", "/img/maps-2.jpg", "/img/maps-3.jpg"] },
  { id: "pixel-studio", name: "Pixel Studio", cat: "Photo & Video", desc: "Layer-based editing with AI-powered masks and film presets.", rating: 4.9, reviews: "44K", size: "310 MB", age: "4+", art: "linear-gradient(135deg,#fbbf24,#ea580c)", icon: "image", shots: ["/img/photos/ph-6.jpg", "/img/photos/ph-7.jpg", "/img/photos/ph-8.jpg"] },
  { id: "music", sysId: "music", name: "Wave Music", cat: "Music", desc: "Your library, mixes and radio — everywhere.", rating: 4.5, reviews: "31K", size: "66 MB", age: "12+", art: "#ef4444", icon: "music", shots: ["/img/album.jpg", "/img/mix-2.jpg", "/img/mix-4.jpg"] },
  { id: "chef", name: "Chef's Table", cat: "Food & Drink", desc: "Step-by-step recipes that adapt to what's in your fridge.", rating: 4.7, reviews: "19K", size: "94 MB", age: "4+", art: "linear-gradient(135deg,#fb7185,#be123c)", icon: "star", shots: ["/img/photos/ph-9.jpg", "/img/photos/ph-10.jpg", "/img/photos/ph-11.jpg"] },
  { id: "taskflow", name: "TaskFlow", cat: "Productivity", desc: "Projects, habits and focus timers in one calm surface.", rating: 4.8, reviews: "27K", size: "41 MB", age: "4+", art: "linear-gradient(135deg,#38bdf8,#0369a1)", icon: "check", shots: ["/img/photos/ph-12.jpg", "/img/photos/ph-13.jpg", "/img/photos/ph-14.jpg"] },
  { id: "sleepsounds", name: "SleepSounds", cat: "Health & Fitness", desc: "Generative soundscapes that respond to your sleep stages.", rating: 4.6, reviews: "11K", size: "128 MB", age: "4+", art: "linear-gradient(135deg,#818cf8,#312e81)", icon: "moonStar", shots: ["/img/photos/ph-15.jpg", "/img/photos/ph-16.jpg", "/img/photos/ph-17.jpg"] },
  { id: "messages", sysId: "messages", name: "Wave Messages", cat: "Social", desc: "Fast, encrypted messaging with rich threads.", rating: 4.4, reviews: "52K", size: "38 MB", age: "4+", art: "#4ade80", icon: "messageCircle", shots: ["/img/photos/ph-18.jpg", "/img/photos/ph-19.jpg", "/img/photos/ph-20.jpg"] },
  { id: "trailmaps", name: "TrailMaps", cat: "Outdoors", desc: "Offline topo maps for 120,000 trails worldwide.", rating: 4.8, reviews: "9.4K", size: "240 MB", age: "4+", art: "linear-gradient(135deg,#a3e635,#166534)", icon: "navigation", shots: ["/img/photos/ph-21.jpg", "/img/photos/ph-22.jpg", "/img/photos/ph-23.jpg"] },
  { id: "orbitvpn", name: "Orbit VPN", cat: "Utilities", desc: "Private, one-tap VPN with per-app routing.", rating: 4.3, reviews: "64K", size: "29 MB", age: "17+", art: "linear-gradient(135deg,#94a3b8,#0f172a)", icon: "shield", shots: ["/img/photos/ph-24.jpg", "/img/photos/ph-25.jpg", "/img/photos/ph-26.jpg"] },
  { id: "finance", name: "Ledger", cat: "Finance", desc: "Beautiful budgeting — envelopes, forecasts, shared wallets.", rating: 4.7, reviews: "15K", size: "52 MB", age: "4+", art: "linear-gradient(135deg,#34d399,#065f46)", icon: "calculator", shots: ["/img/photos/ph-27.jpg", "/img/photos/ph-28.jpg", "/img/photos/ph-29.jpg"] },
];

const installed = new Set<string>(["weather", "maps", "music", "messages"]);

function tile(a: StoreApp, size = 58) {
  return h("div", { class: "tile", style: {
    width: `${size}px`, height: `${size}px`, borderRadius: `${Math.round(size * .28)}px`, flex: "none",
    background: a.art, display: "flex", alignItems: "center", justifyContent: "center",
    border: "1px solid rgba(0,0,0,.06)", boxShadow: "inset 0 1px 1px rgba(255,255,255,.5), 0 4px 10px rgba(0,0,0,.12)",
  } }, svgIcon(I[a.icon], "", Math.round(size * .5)));
}

function getBtn(a: StoreApp, host: HTMLElement, big = false) {
  const mk = () => {
    const isSys = !!a.sysId;
    const label = isSys ? "OPEN" : installed.has(a.id) ? "OPEN" : "GET";
    const b = h("button", {
      class: "pressable", style: {
        padding: big ? "10px 28px" : "7px 18px", borderRadius: "999px", flex: "none",
        background: isSys || installed.has(a.id) ? "rgba(0,0,0,.06)" : "#2563eb",
        color: isSys || installed.has(a.id) ? "#2563eb" : "#fff",
        fontSize: big ? "15px" : "13px", fontWeight: "700", letterSpacing: ".02em",
      },
    }, label);
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isSys || installed.has(a.id)) {
        if (a.sysId) shell.openApp(a.sysId);
        else toast(host, "Opening " + a.name + "…");
        return;
      }
      b.textContent = "";
      b.append(h("span", { class: "spin" }));
      setTimeout(() => {
        installed.add(a.id);
        b.replaceChildren("OPEN");
        b.style.background = "rgba(0,0,0,.06)"; b.style.color = "#2563eb";
        toast(host, a.name + " installed");
      }, 1100);
    });
    return b;
  };
  return mk();
}

function stars(r: number) {
  const row = h("span", { style: { display: "inline-flex", gap: "1px", color: "#f59e0b" } });
  for (let i = 0; i < 5; i++) {
    const s = svgIcon(I.star, "fill", 11);
    (s.querySelector("svg") as SVGElement).style.opacity = i < Math.round(r) ? "1" : ".25";
    row.append(s);
  }
  return row;
}

function appRow(a: StoreApp, host: HTMLElement, rank?: number) {
  return h("div", { class: "pressable", style: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 4px" },
    onClick: () => detail(a, host) },
    rank ? h("span", { style: { width: "18px", textAlign: "center", fontSize: "17px", fontWeight: "700", color: "rgba(0,0,0,.35)", flex: "none" } }, String(rank)) : null,
    tile(a, 54),
    h("div", { style: { flex: "1", minWidth: "0" } },
      h("div", { style: { fontSize: "15px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, a.name),
      h("div", { style: { fontSize: "12px", color: "#9ca3af" } }, a.cat)),
    getBtn(a, host));
}

function sectionTitle(t: string, sub?: string) {
  return h("div", { style: { margin: "22px 4px 6px" } },
    h("div", { style: { fontSize: "20px", fontWeight: "700", letterSpacing: "-.02em" } }, t),
    sub ? h("div", { style: { fontSize: "13px", color: "#9ca3af", marginTop: "1px" } }, sub) : null);
}

function detail(a: StoreApp, host: HTMLElement) {
  pane(host, (close) => {
    const page = h("div", { class: "pg", style: { background: "#f4f4f5", height: "100%", overflowY: "auto" } });
    const hero = h("div", { style: { padding: "64px 24px 0", position: "relative" } },
      h("button", { class: "g-btn pressable", style: { position: "absolute", top: "16px", right: "16px", width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(0,0,0,.6)", zIndex: "5" }, onClick: close }, svgIcon(I.x, "", 16)),
      h("div", { style: { height: "150px", borderRadius: "28px", background: a.art, display: "flex", alignItems: "flex-end", padding: "18px", color: "#fff", overflow: "hidden", position: "relative" } },
        h("div", { style: { position: "absolute", inset: "0", background: "linear-gradient(to top, rgba(0,0,0,.45), transparent)" } }),
        h("div", { style: { position: "relative", fontSize: "13px", fontWeight: "700", letterSpacing: ".12em", opacity: ".9" } }, a.cat.toUpperCase())));
    const head = h("div", { style: { display: "flex", gap: "14px", padding: "16px 24px 0", alignItems: "center" } },
      tile(a, 64),
      h("div", { style: { flex: "1" } },
        h("div", { style: { fontSize: "20px", fontWeight: "700" } }, a.name),
        h("div", { style: { fontSize: "13px", color: "#9ca3af" } }, a.cat)),
      getBtn(a, host, true));
    const meta = h("div", { class: "card-white", style: { margin: "16px 24px 0", padding: "12px", display: "flex", justifyContent: "space-around", textAlign: "center" } });
    for (const [v, l] of [[`${a.rating} ★`, `${a.reviews} Ratings`], [a.age, "Age"], [a.size, "Size"]]) {
      meta.append(h("div", {},
        h("div", { style: { fontSize: "15px", fontWeight: "700" } }, v),
        h("div", { style: { fontSize: "11px", color: "#9ca3af", marginTop: "2px" } }, l)));
    }
    const shots = h("div", { class: "no-sb", style: { display: "flex", gap: "10px", overflowX: "auto", padding: "16px 24px 0" } },
      ...a.shots.map((s) => img(s, "img-fill") as HTMLElement));
    a.shots.forEach((s, i) => { const im = shots.children[i] as HTMLElement; im.style.width = "140px"; im.style.height = "90px"; im.style.borderRadius = "14px"; im.style.objectFit = "cover"; im.style.flex = "none"; });
    const desc = h("div", { class: "card-white", style: { margin: "16px 24px 120px", padding: "16px" } },
      h("div", { style: { fontWeight: "700", fontSize: "15px", marginBottom: "6px" } }, "About"),
      h("p", { style: { fontSize: "14px", lineHeight: "1.5", color: "#4b5563" } }, a.desc + " Crafted for WaveOS with full gesture support and Dynamic Island integration."),
      h("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginTop: "10px" } }, stars(a.rating),
        h("span", { style: { fontSize: "12px", color: "#9ca3af" } }, ` ${a.rating} · ${a.reviews} ratings`)));
    page.append(hero, head, meta, shots, desc);
    return page;
  });
}

export function StoreApp() {
  const root = h("div", { class: "pg", style: { height: "100%", display: "flex", flexDirection: "column", background: "#f4f4f5" } });
  const scroll = h("div", { class: "app-scroll no-sb", style: { padding: "0 20px 120px" } });

  const featured = CATALOG[1];
  const heroCard = h("div", { class: "pressable", style: { position: "relative", height: "270px", borderRadius: "30px", overflow: "hidden", background: featured.art, cursor: "pointer" },
    onClick: () => detail(featured, root) },
    h("div", { style: { position: "absolute", inset: "0", background: "linear-gradient(to top, rgba(0,0,0,.65), transparent 60%)" } }),
    h("div", { style: { position: "absolute", top: "18px", left: "20px", color: "#fff" } },
      h("div", { style: { fontSize: "12px", fontWeight: "700", letterSpacing: ".14em", opacity: ".85" } }, "APP OF THE DAY"),
      h("div", { style: { fontSize: "26px", fontWeight: "800", letterSpacing: "-.02em", marginTop: "2px" } }, "Race the neon storm")),
    h("div", { style: { position: "absolute", left: "20px", right: "20px", bottom: "16px", display: "flex", alignItems: "center", gap: "12px" } },
      tile(featured, 52),
      h("div", { style: { flex: "1", color: "#fff" } },
        h("div", { style: { fontWeight: "700", fontSize: "16px" } }, featured.name),
        h("div", { style: { fontSize: "12px", opacity: ".8" } }, featured.desc.slice(0, 34) + "…")),
      getBtn(featured, root)));

  const show = (tab: string) => {
    scroll.replaceChildren();
    if (tab === "today") {
      scroll.append(heroCard, sectionTitle("Our Picks", "Hand-picked by the editors"),
        h("div", { class: "card-white", style: { padding: "4px 14px" } },
          ...CATALOG.slice(2, 6).map((a) => appRow(a, root))),
        sectionTitle("Must-Have Apps"),
        h("div", { class: "card-white", style: { padding: "4px 14px", marginBottom: "8px" } },
          ...CATALOG.slice(6, 10).map((a) => appRow(a, root))));
    } else if (tab === "apps") {
      scroll.append(sectionTitle("Top Charts", "Free apps · Today"),
        h("div", { class: "card-white", style: { padding: "4px 14px" } },
          ...CATALOG.map((a, i) => appRow(a, root, i + 1))));
    } else {
      const input = h("input", { attrs: { type: "text", placeholder: "Games, apps, stories and more" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "14px" } }) as HTMLInputElement;
      const list = h("div", {});
      const apply = () => {
        const q = input.value.trim().toLowerCase();
        const hits = CATALOG.filter((a) => !q || a.name.toLowerCase().includes(q) || a.cat.toLowerCase().includes(q));
        list.replaceChildren(
          q ? h("div", { style: { fontSize: "13px", color: "#9ca3af", margin: "10px 4px" } }, `${hits.length} result${hits.length === 1 ? "" : "s"}`) : h("div", {}),
          h("div", { class: "card-white", style: { padding: "4px 14px" } }, ...hits.map((a) => appRow(a, root))));
      };
      input.addEventListener("input", apply);
      scroll.append(
        h("div", { class: "search-pill", style: { margin: "4px 0 6px" } }, svgIcon(I.search), input),
        sectionTitle("Discover", "Trending searches"),
        h("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "4px" } },
          ...["Photo editor", "Running game", "Sleep", "Budget", "Maps offline", "VPN"].map((t) =>
            h("button", { class: "pressable", style: { padding: "7px 14px", borderRadius: "999px", background: "#fff", border: "1px solid #f3f4f6", fontSize: "13px", fontWeight: "600", color: "#374151" },
              onClick: () => { input.value = t.split(" ")[0]; apply(); } }, t))),
        list);
      apply();
      setTimeout(() => input.focus(), 60);
    }
  };

  const tabs = FloatingTabBar([
    { id: "today", icon: "newspaper", label: "Today" },
    { id: "apps", icon: "layoutGrid", label: "Apps" },
    { id: "search", icon: "search", label: "Search" },
  ], "today", show);

  show("today");
  root.append(GlassHeader("Today", { large: true }), scroll, tabs.el);
  return root;
}
