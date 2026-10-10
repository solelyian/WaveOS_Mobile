// calendar.ts — Calendrier : mois courant réel + agenda par jour + bouton Today + "+".
import { h } from "../core/el";
import { GlassHeader } from "./ui";

interface Ev { day: number; time: string; title: string; bg: string; fg: string }

const NOW = new Date();
const MONTH = NOW.toLocaleDateString("en-US", { month: "long" });
const DIM = new Date(NOW.getFullYear(), NOW.getMonth() + 1, 0).getDate();
const OFFSET = new Date(NOW.getFullYear(), NOW.getMonth(), 1).getDay();
const COLORS: [string, string][] = [["#eff6ff", "#1d4ed8"], ["#faf5ff", "#7e22ce"], ["#fff7ed", "#c2410c"], ["#f0fdf4", "#15803d"]];
const SLOTS = ["09:00 AM", "11:30 AM", "02:00 PM", "05:00 PM"];

const EVENTS: Ev[] = [
  { day: NOW.getDate(), time: "09:00 AM", title: "Team Sync", bg: "#eff6ff", fg: "#1d4ed8" },
  { day: NOW.getDate(), time: "11:30 AM", title: "Design Review", bg: "#faf5ff", fg: "#7e22ce" },
  { day: NOW.getDate(), time: "02:00 PM", title: "Client Call", bg: "#fff7ed", fg: "#c2410c" },
  { day: NOW.getDate() + 2 <= DIM ? NOW.getDate() + 2 : 1, time: "10:00 AM", title: "Yosemite Trip", bg: "#f0fdf4", fg: "#15803d" },
  { day: 20, time: "04:00 PM", title: "Focus Time", bg: "#f0fdf4", fg: "#15803d" },
];

export function CalendarApp() {
  let selected = NOW.getDate();
  const cells: HTMLElement[] = [];
  const dayGrid = h("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", rowGap: "8px" } });
  for (let i = 0; i < OFFSET; i++) dayGrid.append(h("div", {}));
  for (let i = 1; i <= DIM; i++) {
    const d = h("div", {
      style: { display: "flex", justifyContent: "center", cursor: "pointer" },
      onClick: () => { selected = i; paint(); paintSched(); },
    });
    const c = h("div", { style: { width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontSize: "14px", fontWeight: "500", transition: "all .2s" } }, String(i));
    d.append(c); cells.push(c); dayGrid.append(d);
  }
  const paint = () => cells.forEach((c, i) => {
    const on = i + 1 === selected;
    const today = i + 1 === NOW.getDate();
    c.style.background = on ? "#ef4444" : "transparent";
    c.style.color = on ? "#fff" : today ? "#ef4444" : "#171717";
    c.style.fontWeight = today || on ? "700" : "500";
    c.style.boxShadow = on ? "0 10px 15px -3px rgba(0,0,0,.2)" : "none";
    c.style.transform = on ? "scale(1.1)" : "none";
  });
  const schedTitle = h("h3", { style: { fontWeight: "700", fontSize: "20px", padding: "0 8px", marginBottom: "16px" } });
  const schedList = h("div", { style: { display: "flex", flexDirection: "column", gap: "12px" } });
  const paintSched = () => {
    const label = `${MONTH} ${selected}`;
    schedTitle.textContent = selected === NOW.getDate() ? "Today's Schedule" : `Schedule — ${label}`;
    const evs = EVENTS.filter((e) => e.day === selected);
    schedList.replaceChildren(...(evs.length ? evs.map((e) =>
      h("div", { style: { display: "flex", gap: "16px" } },
        h("div", { style: { width: "64px", textAlign: "right", fontSize: "12px", fontWeight: "700", color: "#9ca3af", paddingTop: "12px" } }, e.time),
        h("div", { class: "pressable", style: { flex: "1", padding: "16px", borderRadius: "24px", background: e.bg, color: e.fg, border: "1px solid #f3f4f6", boxShadow: "0 1px 3px rgba(0,0,0,.04)" } },
          h("div", { style: { fontWeight: "700" } }, e.title),
          h("div", { style: { fontSize: "12px", opacity: ".7" } }, "Google Meet"))))
      : [h("div", { style: { textAlign: "center", color: "rgba(0,0,0,.4)", fontSize: "14px", padding: "24px 0" } }, "No events")]));
  };
  paint(); paintSched();

  const addEvent = () => {
    const [bg, fg] = COLORS[EVENTS.length % COLORS.length];
    EVENTS.push({ day: selected, time: SLOTS[EVENTS.length % SLOTS.length], title: "New Event", bg, fg });
    paintSched();
  };

  return h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative" } },
    GlassHeader(MONTH, { large: true, action: "plus", onAction: addEvent }),
    h("div", { class: "app-scroll no-sb", style: { padding: "0 16px 96px" } },
      h("div", { class: "card-white", style: { borderRadius: "32px", padding: "16px", marginBottom: "24px" } },
        h("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: "8px" } },
          ...["S", "M", "T", "W", "T", "F", "S"].map((d) =>
            h("div", { style: { textAlign: "center", fontSize: "12px", fontWeight: "700", color: "#9ca3af" } }, d))),
        dayGrid),
      schedTitle,
      schedList),
    h("div", { style: { position: "absolute", bottom: "112px", right: "24px" } },
      h("button", { class: "pressable", style: { padding: "12px 24px", background: "#ef4444", color: "#fff", fontWeight: "700", borderRadius: "999px", boxShadow: "0 10px 15px -3px rgba(239,68,68,.3)" }, onClick: () => { selected = NOW.getDate(); paint(); paintSched(); } }, "Today")));
}
