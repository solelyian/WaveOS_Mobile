// safari.ts — Safari : Start Page, favoris ouvrables, Privacy Report,
// barre d'URL fonctionnelle (ouvre une page lecteur mockée).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";

const SITES = [
  { name: "Nyne", icon: "🍎", color: "#000" },
  { name: "Google", icon: "G", color: "#ef4444" },
  { name: "Twitter", icon: "X", color: "#000" },
  { name: "News", icon: "📰", color: "#ec4899" },
  { name: "Reddit", icon: "👾", color: "#f97316" },
  { name: "YouTube", icon: "▶️", color: "#dc2626" },
];

export function SafariApp() {
  const openPage = (name: string) => {
    url.value = name;
    const d = h("div", { style: { position: "absolute", inset: "0", zIndex: "30", background: "#fff", display: "flex", flexDirection: "column", opacity: "0", transition: "opacity .2s" } },
      h("div", { style: { padding: "56px 20px 12px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #f3f4f6" } },
        h("button", { class: "pressable", style: { color: "#3b82f6", display: "flex" }, onClick: () => { d.style.opacity = "0"; setTimeout(() => d.remove(), 200); } }, svgIcon(I.chevronLeft)),
        h("span", { style: { fontWeight: "700", fontSize: "15px" } }, name),
        h("span", { style: { marginLeft: "auto", color: "#9ca3af", display: "flex" } }, svgIcon(I.share, "", 18))),
      h("div", { class: "app-scroll no-sb", style: { flex: "1", padding: "24px", overflowY: "auto" } },
        h("div", { style: { width: "56px", height: "56px", borderRadius: "18px", background: "linear-gradient(135deg,#3b82f6,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "24px", fontWeight: "800", marginBottom: "16px" } }, name[0].toUpperCase()),
        h("h1", { style: { fontSize: "28px", fontWeight: "800", marginBottom: "12px" } }, `Welcome to ${name}`),
        ...["This is a placeholder page rendered by WaveOS WebKit. The layout engine draws real content blocks with fluid typography and responsive spacing.",
          "Scroll behaviour, momentum and overscroll are handled by the shared gesture router — the same engine that drives every app in the system.",
          "Reader mode, tab management and private relay are simulated inside the shell sandbox."].map((t) =>
            h("p", { style: { color: "#4b5563", lineHeight: "1.7", fontSize: "16px", marginBottom: "14px" } }, t))));
    root.append(d);
    requestAnimationFrame(() => { d.style.opacity = "1"; });
  };

  const url = h("input", {
    attrs: { type: "text", value: "nyne.com" },
    style: { flex: "1", textAlign: "center", fontWeight: "500", fontSize: "14px", color: "rgba(0,0,0,.9)", background: "transparent", border: "none", outline: "none" },
  }) as HTMLInputElement;
  url.addEventListener("keydown", (e) => { if (e.key === "Enter") { openPage(url.value.trim() || "nyne.com"); url.blur(); } });
  url.addEventListener("focus", () => url.select());

  const root = h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative" } },
    h("div", { class: "app-scroll no-sb", style: { padding: "64px 24px 96px" } },
      h("div", { style: { fontSize: "30px", fontWeight: "700", marginBottom: "32px" } }, "Start Page"),
      h("div", { style: { fontSize: "14px", fontWeight: "700", color: "rgba(0,0,0,.3)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: ".08em" } }, "Favorites"),
      h("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", rowGap: "24px" } },
        ...SITES.map((s) =>
          h("div", { class: "pressable", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer" }, onClick: () => openPage(`${s.name.toLowerCase()}.com`) },
            h("div", { style: { width: "64px", height: "64px", borderRadius: "22px", background: s.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", boxShadow: "inset 0 1px 1px rgba(255,255,255,.4),0 4px 10px rgba(0,0,0,.1)" } }, s.icon),
            h("span", { style: { fontSize: "12px", color: "rgba(0,0,0,.6)", fontWeight: "500" } }, s.name)))),
      h("div", { style: { fontSize: "14px", fontWeight: "700", color: "rgba(0,0,0,.3)", marginTop: "40px", marginBottom: "16px", textTransform: "uppercase", letterSpacing: ".08em" } }, "Privacy Report"),
      h("div", { class: "card-white", style: { padding: "20px", display: "flex", alignItems: "center", gap: "16px" } },
        h("span", { style: { color: "#3b82f6", display: "flex" } }, svgIcon(I.shield, "", 40)),
        h("div", {},
          h("div", { style: { fontWeight: "700", fontSize: "18px", color: "rgba(0,0,0,.9)" } }, "24 Trackers Prevented"),
          h("div", { style: { fontSize: "12px", color: "rgba(0,0,0,.5)", fontWeight: "500" } }, "In the last 24 hours")))),
    h("div", { class: "g-light", style: { position: "absolute", bottom: "32px", left: "16px", right: "16px", height: "56px", background: "rgba(255,255,255,.4)", borderRadius: "24px", display: "flex", alignItems: "center", padding: "0 16px", gap: "12px", zIndex: "20" } },
      h("div", { style: { color: "rgba(0,0,0,.6)", fontWeight: "500", fontSize: "14px" } }, "Aa"),
      url,
      h("div", { class: "pressable", style: { color: "#3b82f6", display: "flex", cursor: "pointer" }, onClick: () => openPage(url.value.trim() || "nyne.com") }, svgIcon(I.layoutGrid, "", 18))));
  return root;
}
