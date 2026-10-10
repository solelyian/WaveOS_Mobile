// safari.ts — navigateur vivant : favoris → pages article, barre d'adresse
// éditable, gestionnaire d'onglets, rapport de confidentialité.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { GlassHeader, img, pane } from "./ui";

const FAVS = [
  { name: "apple.com", title: "Apple", art: "#111", body: "Introducing the thinnest phone ever made. Crafted from aerospace-grade titanium with a ceramic shield that redefines durability.", im: "/img/photos/ph-2.jpg" },
  { name: "nyne.tech", title: "Nyne", art: "linear-gradient(135deg,#38bdf8,#1d4ed8)", body: "WaveOS 2.0 — a phone that thinks with you. Adaptive surfaces, liquid glass, and a Dynamic Island that actually earns its name.", im: "/img/photos/ph-5.jpg" },
  { name: "theverge.com", title: "The Verge", art: "linear-gradient(135deg,#f97316,#7c2d12)", body: "Review: the phone OS that finally gets motion right. Every surface is a spring, every gesture lands exactly where your finger expects.", im: "/img/photos/ph-9.jpg" },
  { name: "nationalgeographic.com", title: "NatGeo", art: "linear-gradient(135deg,#fbbf24,#92400e)", body: "Photo of the day: fog rolls over the Golden Gate at dawn as the city wakes beneath it.", im: "/img/photos/ph-14.jpg" },
] as const;

interface Tab { url: string; title: string }

export function SafariApp() {
  const root = h("div", { class: "pg", style: { height: "100%", display: "flex", flexDirection: "column", background: "#f4f4f5" } });
  const scroll = h("div", { class: "app-scroll no-sb", style: { padding: "0 16px 130px" } });
  const tabs: Tab[] = [{ url: "start", title: "Start Page" }];
  let cur = 0;

  const urlBar = () => {
    const input = h("input", { attrs: { value: tabs[cur].url === "start" ? "" : tabs[cur].url, placeholder: "Search or enter website name" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "14px", textAlign: "center" } }) as HTMLInputElement;
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const v = input.value.trim() || "nyne.tech";
      tabs[cur] = { url: v.includes(".") ? v : v + ".com", title: v };
      article(v.includes(".") ? v : v + ".com", v);
      input.blur();
    });
    return h("div", { class: "search-pill", style: { margin: "0 16px 10px" } },
      svgIcon(I.search), input,
      h("button", { onClick: () => { input.value = ""; input.focus(); } }, svgIcon(I.refreshCw, "", 15)));
  };

  const article = (domain: string, title: string) => {
    scroll.replaceChildren(
      h("div", { class: "card-white", style: { overflow: "hidden" } },
        h("div", { style: { height: "160px", overflow: "hidden" } }, img("/img/photos/ph-17.jpg", "img-fill")),
        h("div", { style: { padding: "18px" } },
          h("div", { style: { fontSize: "12px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".08em" } }, domain),
          h("h2", { style: { fontSize: "22px", fontWeight: "800", letterSpacing: "-.02em", margin: "4px 0 10px" } }, title),
          h("p", { style: { fontSize: "15px", lineHeight: "1.6", color: "#374151" } }, "This is the live web, rendered in the WaveOS reader. Every paragraph is served fresh — scroll, tap the address bar and travel somewhere else. Trackers are blocked by default, so pages stay light."),
          h("p", { style: { fontSize: "15px", lineHeight: "1.6", color: "#374151", marginTop: "10px" } }, "Reader mode keeps typography clean: 15px body, 1.6 line height, single column."))),
      h("div", { style: { display: "flex", gap: "10px", marginTop: "14px" } },
        ...FAVS.slice(0, 3).map((f) => h("button", { class: "chip", onClick: () => { tabs[cur] = { url: f.name, title: f.title }; article(f.name, f.title); } }, f.name))));
  };

  const startPage = () => {
    scroll.replaceChildren(
      h("div", { style: { fontSize: "20px", fontWeight: "700", margin: "4px 2px 10px" } }, "Favorites"),
      h("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" } },
        ...FAVS.map((f) => h("div", { class: "pressable", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" },
          onClick: () => { tabs[cur] = { url: f.name, title: f.title }; article(f.name, f.title); } },
          h("div", { style: { width: "60px", height: "60px", borderRadius: "16px", background: f.art, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "20px", fontWeight: "800" } }, f.name[0].toUpperCase()),
          h("span", { style: { fontSize: "11px", color: "#6b7280", textAlign: "center", lineHeight: "1.2" } }, f.name)))),
      h("div", { class: "card-white pressable", style: { marginTop: "18px", padding: "14px 16px" }, onClick: () => pane(root, (close) =>
        h("div", { class: "pg", style: { background: "#f4f4f5", height: "100%" } },
          h("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "60px 16px 12px" } },
            h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: close }, svgIcon(I.chevronLeft, "", 18)),
            h("span", { style: { fontWeight: "700", fontSize: "17px" } }, "Privacy Report")),
          h("div", { class: "card-white", style: { margin: "0 16px", padding: "16px" } },
            h("div", { style: { fontSize: "34px", fontWeight: "800" } }, "23"),
            h("div", { style: { fontSize: "13px", color: "#9ca3af" } }, "trackers prevented in the last 7 days")),
          ...[["googletagmanager.com", "theverge.com"], ["facebook.net", "nationalgeographic.com"], ["doubleclick.net", "apple.com"]].map(([t, s]) =>
            h("div", { class: "card-white", style: { margin: "10px 16px 0", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" } },
              h("div", {}, h("div", { style: { fontWeight: "600", fontSize: "14px" } }, t), h("div", { style: { fontSize: "12px", color: "#9ca3af" } }, "on " + s)),
              h("span", { style: { fontSize: "11px", fontWeight: "700", color: "#22c55e" } }, "BLOCKED"))))) },
        h("div", { style: { display: "flex", alignItems: "center", gap: "12px" } },
          h("div", { class: "set-ic", style: { background: "#22c55e" } }, svgIcon(I.shield)),
          h("div", { style: { flex: "1" } },
            h("div", { style: { fontWeight: "700", fontSize: "15px" } }, "Privacy Report"),
            h("div", { style: { fontSize: "12px", color: "#9ca3af" } }, "23 trackers prevented")),
          h("span", { class: "chev" }, svgIcon(I.chevronLeft)))),
      h("div", { style: { fontSize: "20px", fontWeight: "700", margin: "18px 2px 10px" } }, "Reading List"),
      h("div", { class: "card-white", style: { padding: "4px 14px" } },
        ...[["The physics of spring animations", "dev.to"], ["Why glass UI won", "uxdesign.cc"]].map(([t, s]) =>
          h("div", { class: "lrow" },
            h("div", { class: "set-ic", style: { background: "#f59e0b" } }, svgIcon(I.book)),
            h("div", { class: "tx" }, h("div", { class: "t1" }, t), h("div", { class: "t2" }, s))))));
  };

  const tabManager = () => pane(root, (close) =>
    h("div", { class: "pg", style: { background: "rgba(20,20,22,.98)", height: "100%", display: "flex", flexDirection: "column", padding: "60px 16px 30px" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" } },
        h("span", { style: { color: "#fff", fontWeight: "700", fontSize: "17px" } }, `${tabs.length} Tab${tabs.length > 1 ? "s" : ""}`),
        h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }, onClick: close }, svgIcon(I.x, "", 16))),
      h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" } },
        ...tabs.map((t, i) => h("div", { class: "pressable", style: { background: "#f4f4f5", borderRadius: "20px", overflow: "hidden", height: "200px", position: "relative" },
          onClick: () => { cur = i; close(); if (t.url === "start") startPage(); else article(t.url, t.title); } },
          h("div", { style: { padding: "10px 12px", fontSize: "12px", fontWeight: "600", borderBottom: "1px solid rgba(0,0,0,.06)", display: "flex", gap: "6px", alignItems: "center" } }, svgIcon(I.globe, "", 12), t.title),
          h("div", { style: { padding: "12px", fontSize: "12px", color: "#9ca3af" } }, t.url))),
        h("button", { class: "pressable", style: { borderRadius: "20px", border: "2px dashed rgba(255,255,255,.25)", height: "200px", color: "rgba(255,255,255,.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" },
          onClick: () => { tabs.push({ url: "start", title: "Start Page" }); cur = tabs.length - 1; close(); startPage(); } },
          svgIcon(I.plus, "", 26), h("span", { style: { fontSize: "13px", fontWeight: "600" } }, "New Tab")))));

  startPage();
  const bar = h("div", { style: { position: "absolute", bottom: "0", left: "0", right: "0", padding: "0 0 34px", background: "rgba(244,244,245,.92)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(0,0,0,.05)" } },
    urlBar(),
    h("div", { style: { display: "flex", justifyContent: "space-around", padding: "2px 30px 0" } },
      ...([[I.chevronLeft, "Back"], [I.share, "Share"], [I.book, "Bookmarks"], [I.layoutGrid, "Tabs"]] as const).map(([ic, l]) =>
        h("button", { class: "pressable", style: { color: "#2563eb", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" },
          onClick: () => { if (l === "Tabs") tabManager(); if (l === "Back") startPage(); } }, svgIcon(ic, "", 20)))));
  root.append(GlassHeader(""), scroll, bar);
  return root;
}
