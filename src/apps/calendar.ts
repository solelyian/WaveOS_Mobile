// calendar.ts — Calendrier : mois de décembre + agenda + bouton Today (maquette).
import { h } from "../core/el";
import { GlassHeader } from "./ui";

const EVENTS = [
  { time: "09:00 AM", title: "Team Sync", bg: "#eff6ff", fg: "#1d4ed8" },
  { time: "11:30 AM", title: "Design Review", bg: "#faf5ff", fg: "#7e22ce" },
  { time: "02:00 PM", title: "Client Call", bg: "#fff7ed", fg: "#c2410c" },
  { time: "04:00 PM", title: "Focus Time", bg: "#f0fdf4", fg: "#15803d" },
];

export function CalendarApp() {
  let selected = 13;
  const cells: HTMLElement[] = [];
  const dayGrid = h("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", rowGap: "8px" } });
  for (let i = 1; i <= 31; i++) {
    const d = h("div", {
      style: { display: "flex", justifyContent: "center", cursor: "pointer" },
      onClick: () => { selected = i; paint(); paintSched(); },
    });
    const c = h("div", { style: { width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontSize: "14px", fontWeight: "500", transition: "all .2s" } }, String(i));
    d.append(c); cells.push(c); dayGrid.append(d);
  }
  const paint = () => cells.forEach((c, i) => {
    const on = i + 1 === selected;
    c.style.background = on ? "#ef4444" : "transparent";
    c.style.color = on ? "#fff" : "#171717";
    c.style.boxShadow = on ? "0 10px 15px -3px rgba(0,0,0,.2)" : "none";
    c.style.transform = on ? "scale(1.1)" : "none";
  });
  const schedTitle = h("h3", { style: { fontWeight: "700", fontSize: "20px", padding: "0 8px", marginBottom: "16px" } });
  const paintSched = () => { schedTitle.textContent = selected === new Date().getDate() ? "Today's Schedule" : `Schedule — Dec ${selected}`; };
  paint(); paintSched();

  return h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative" } },
    GlassHeader("December", { large: true, action: "plus" }),
    h("div", { class: "app-scroll no-sb", style: { padding: "0 16px 96px" } },
      h("div", { class: "card-white", style: { borderRadius: "32px", padding: "16px", marginBottom: "24px" } },
        h("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: "8px" } },
          ...["S", "M", "T", "W", "T", "F", "S"].map((d) =>
            h("div", { style: { textAlign: "center", fontSize: "12px", fontWeight: "700", color: "#9ca3af" } }, d))),
        dayGrid),
      schedTitle,
      h("div", { style: { display: "flex", flexDirection: "column", gap: "12px" } },
        ...EVENTS.map((e) =>
          h("div", { style: { display: "flex", gap: "16px" } },
            h("div", { style: { width: "64px", textAlign: "right", fontSize: "12px", fontWeight: "700", color: "#9ca3af", paddingTop: "12px" } }, e.time),
            h("div", { class: "pressable", style: { flex: "1", padding: "16px", borderRadius: "24px", background: e.bg, color: e.fg, border: "1px solid #f3f4f6", boxShadow: "0 1px 3px rgba(0,0,0,.04)" } },
              h("div", { style: { fontWeight: "700" } }, e.title),
              h("div", { style: { fontSize: "12px", opacity: ".7" } }, "Google Meet")))))),
    h("div", { style: { position: "absolute", bottom: "112px", right: "24px" } },
      h("button", { class: "pressable", style: { padding: "12px 24px", background: "#ef4444", color: "#fff", fontWeight: "700", borderRadius: "999px", boxShadow: "0 10px 15px -3px rgba(239,68,68,.3)" }, onClick: () => { selected = Math.min(31, new Date().getDate()); paint(); paintSched(); } }, "Today")));
}
