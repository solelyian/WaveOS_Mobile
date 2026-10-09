// safari.ts — Safari : Start Page, favoris, Privacy Report, barre d'URL (maquette).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";

const SITES = [
  { name: "Nyne", icon: "N", color: "#000" },
  { name: "Google", icon: "G", color: "#ef4444" },
  { name: "Twitter", icon: "X", color: "#000" },
  { name: "News", icon: "N", color: "#ec4899" },
  { name: "Reddit", icon: "R", color: "#f97316" },
  { name: "YouTube", icon: "Y", color: "#dc2626" },
];

export function SafariApp() {
  return h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative" } },
    h("div", { class: "app-scroll no-sb", style: { padding: "64px 24px 96px" } },
      h("div", { style: { fontSize: "30px", fontWeight: "700", marginBottom: "32px" } }, "Start Page"),
      h("div", { style: { fontSize: "14px", fontWeight: "700", color: "rgba(0,0,0,.3)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: ".08em" } }, "Favorites"),
      h("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", rowGap: "24px" } },
        ...SITES.map((s) =>
          h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" } },
            h("div", { class: "pressable", style: { width: "64px", height: "64px", borderRadius: "22px", background: s.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700", boxShadow: "inset 0 1px 1px rgba(255,255,255,.4),0 4px 10px rgba(0,0,0,.1)" } }, s.icon),
            h("span", { style: { fontSize: "12px", color: "rgba(0,0,0,.6)", fontWeight: "500" } }, s.name)))),
      h("div", { style: { fontSize: "14px", fontWeight: "700", color: "rgba(0,0,0,.3)", marginTop: "40px", marginBottom: "16px", textTransform: "uppercase", letterSpacing: ".08em" } }, "Privacy Report"),
      h("div", { class: "card-white", style: { padding: "20px", display: "flex", alignItems: "center", gap: "16px" } },
        h("span", { style: { color: "#3b82f6", display: "flex" } }, svgIcon(I.shield)),
        h("div", {},
          h("div", { style: { fontWeight: "700", fontSize: "18px", color: "rgba(0,0,0,.9)" } }, "24 Trackers Prevented"),
          h("div", { style: { fontSize: "12px", color: "rgba(0,0,0,.5)", fontWeight: "500" } }, "In the last 24 hours")))),
    h("div", { class: "g-light", style: { position: "absolute", bottom: "32px", left: "16px", right: "16px", height: "56px", background: "rgba(255,255,255,.4)", borderRadius: "24px", display: "flex", alignItems: "center", padding: "0 16px", gap: "12px", zIndex: "20" } },
      h("div", { style: { color: "rgba(0,0,0,.6)", fontWeight: "500", fontSize: "14px" } }, "Aa"),
      h("div", { style: { flex: "1", textAlign: "center", fontWeight: "500", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "rgba(0,0,0,.9)" } },
        svgIcon(I.lock), "Nyne.com"),
      h("div", { style: { color: "#3b82f6", display: "flex" } }, svgIcon(I.layoutGrid))));
}
