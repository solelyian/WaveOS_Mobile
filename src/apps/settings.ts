// settings.ts — Réglages : profil JD, groupes Wi-Fi/Bluetooth/Cellular/Hotspot +
// Notifications/Sounds/Focus (maquette).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import type { IconName } from "../core/lucide";
import { GlassHeader } from "./ui";

function row(icon: IconName, color: string, label: string, val = "") {
  return h("div", { class: "set-row" },
    h("div", { class: "set-ic", style: { background: color } }, svgIcon(I[icon])),
    h("span", { class: "set-lbl" }, label),
    val ? h("span", { class: "set-val" }, val) : null,
    h("span", { class: "chev" }, svgIcon(I.chevronLeft, "", 16)));
}

export function SettingsApp() {
  return h("div", { style: { height: "100%", display: "flex", flexDirection: "column" } },
    GlassHeader("Settings", { large: true }),
    h("div", { style: { padding: "8px 24px 16px" } },
      h("div", { class: "search-pill" }, svgIcon(I.search, "", 16), h("span", {}, "Search Settings"))),
    h("div", { class: "app-scroll no-sb", style: { padding: "0 24px 40px", display: "flex", flexDirection: "column", gap: "24px" } },
      h("div", { class: "card-white", style: { padding: "20px", display: "flex", alignItems: "center", gap: "16px" } },
        h("div", { style: { width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "20px", fontWeight: "700", boxShadow: "inset 0 1px 1px rgba(255,255,255,.4),0 4px 10px rgba(0,0,0,.1)", flexShrink: "0" } }, "JD"),
        h("div", { style: { flex: "1" } },
          h("div", { style: { fontSize: "20px", fontWeight: "700", color: "rgba(0,0,0,.9)" } }, "John Doe"),
          h("div", { style: { fontSize: "14px", color: "rgba(0,0,0,.5)", fontWeight: "500" } }, "Nyne ID, iCloud+, Media")),
        h("span", { class: "chev" }, svgIcon(I.chevronLeft, "", 16))),
      h("div", { class: "set-group g-light" },
        row("wifi", "#3b82f6", "Wi-Fi", "Home_5G"),
        row("bluetooth", "#3b82f6", "Bluetooth", "On"),
        row("signal", "#22c55e", "Cellular"),
        row("globe", "#3b82f6", "Personal Hotspot", "Off")),
      h("div", { class: "set-group g-light" },
        row("bell", "#ef4444", "Notifications"),
        row("volume2", "#ec4899", "Sounds & Haptics"),
        row("moon", "#6366f1", "Focus"))));
}
