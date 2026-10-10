// calendar.ts — calendrier vivant : événements par jour, Today, ajout
// d'événement, navigation de mois.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { pane, toast } from "./ui";

interface Ev { t: string; name: string; where: string; color: string }
const EVENTS: Record<number, Ev[]> = {
  6:  [{ t: "10:00", name: "Design Sync", where: "Nyne HQ · Room 4", color: "#60a5fa" }, { t: "13:00", name: "Lunch with Jordan", where: "Tartine", color: "#fbbf24" }],
  9:  [{ t: "09:30", name: "Dentist", where: "Union St", color: "#f87171" }],
  13: [{ t: "10:00", name: "Design Sync", where: "Nyne HQ · Room 4", color: "#60a5fa" }, { t: "14:00", name: "Sprint review", where: "Zoom", color: "#a78bfa" }, { t: "18:30", name: "Gym", where: "SoMa", color: "#34d399" }],
  16: [{ t: "12:00", name: "Call w/ Mom", where: "", color: "#fbbf24" }],
  20: [{ t: "11:00", name: "WaveOS demo", where: "All hands", color: "#f472b6" }, { t: "15:00", name: "Code review", where: "Room 2", color: "#60a5fa" }],
  25: [{ t: "20:00", name: "Game night", where: "Chris's place", color: "#34d399" }],
};

const DN = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let month = 11, sel = 13;

export function CalendarApp() {
  const root = h("div", { class: "pg", style: { height: "100%", display: "flex", flexDirection: "column", background: "#f4f4f5" } });
  const mlabel = h("h1", { style: { fontSize: "34px", fontWeight: "700", letterSpacing: "-.02em", color: "#ef4444" } });
  const grid = h("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "4px", padding: "0 8px" } });
  const list = h("div", { class: "app-scroll no-sb", style: { padding: "8px 16px 120px" } });

  const daysIn = (m: number) => new Date(2025, m + 1, 0).getDate();
  const firstOff = (m: number) => new Date(2025, m, 1).getDay();

  const drawGrid = () => {
    mlabel.textContent = MONTHS[month] + " 2025";
    const cells: HTMLElement[] = DN.map((d) => h("div", { style: { textAlign: "center", fontSize: "11px", fontWeight: "700", color: "#9ca3af", padding: "6px 0" } }, d));
    for (let i = 0; i < firstOff(month); i++) cells.push(h("div"));
    for (let d = 1; d <= daysIn(month); d++) {
      const day = d;
      const has = !!EVENTS[day];
      cells.push(h("button", {
        class: "pressable", style: {
          aspectRatio: "1", borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          fontSize: "16px", fontWeight: day === sel ? "700" : "500",
          background: day === sel ? "#ef4444" : "transparent", color: day === sel ? "#fff" : "#111",
        }, onClick: () => { sel = day; drawGrid(); drawList(); } },
        String(day),
        has ? h("i", { style: { width: "4px", height: "4px", borderRadius: "50%", background: day === sel ? "#fff" : "#ef4444", marginTop: "2px" } }) : null));
    }
    grid.replaceChildren(...cells);
  };

  const drawList = () => {
    const evs = (EVENTS[sel] ?? []).slice().sort((a, b) => a.t.localeCompare(b.t));
    list.replaceChildren(
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 2px 8px" } },
        h("span", { style: { fontSize: "17px", fontWeight: "700" } }, `December ${sel}`),
        h("span", { style: { fontSize: "12px", color: "#9ca3af" } }, `${evs.length} event${evs.length === 1 ? "" : "s"}`)),
      ...(evs.length ? evs.map((e) =>
        h("div", { class: "card-white pressable", style: { display: "flex", gap: "12px", padding: "14px", marginBottom: "8px", position: "relative", overflow: "hidden" },
          onClick: () => toast(root, e.name + " · " + e.where) },
          h("i", { style: { position: "absolute", left: "0", top: "0", bottom: "0", width: "5px", background: e.color } }),
          h("div", { style: { width: "44px", flex: "none", textAlign: "center" } },
            h("div", { style: { fontSize: "15px", fontWeight: "700" } }, e.t.split(":")[0]),
            h("div", { style: { fontSize: "10px", color: "#9ca3af", fontWeight: "600" } }, ":" + e.t.split(":")[1])),
          h("div", { style: { flex: "1" } },
            h("div", { style: { fontWeight: "700", fontSize: "15px" } }, e.name),
            e.where ? h("div", { style: { fontSize: "12px", color: "#9ca3af", marginTop: "1px" } }, e.where) : null),
          h("button", { class: "pressable", style: { color: "#d1d5db", alignSelf: "center" }, onClick: (ev) => {
            ev.stopPropagation();
            EVENTS[sel] = (EVENTS[sel] ?? []).filter((x) => x !== e);
            drawList(); drawGrid();
          } }, svgIcon(I.trash2, "", 16))))
        : [h("div", { class: "card-white", style: { padding: "28px", textAlign: "center", color: "#9ca3af", fontSize: "14px" } }, "No events")]));
  };

  const addEvent = () => pane(root, (close) => {
    const title = h("input", { attrs: { placeholder: "Title" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "15px" } }) as HTMLInputElement;
    const time = h("input", { attrs: { placeholder: "10:00", value: "10:00" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "15px" } }) as HTMLInputElement;
    setTimeout(() => title.focus(), 80);
    const save = () => {
      const t = title.value.trim(); if (!t) return;
      const tm = /^\d{1,2}:\d{2}$/.test(time.value.trim()) ? time.value.trim() : "10:00";
      (EVENTS[sel] ??= []).push({ t: tm, name: t, where: "", color: "#60a5fa" });
      drawGrid(); drawList(); close(); toast(root, "Event added");
    };
    return h("div", { class: "pg", style: { background: "#f4f4f5", height: "100%", display: "flex", flexDirection: "column" } },
      h("div", { style: { display: "flex", alignItems: "center", padding: "60px 16px 10px" } },
        h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: close }, svgIcon(I.x, "", 16)),
        h("span", { style: { flex: "1", textAlign: "center", fontWeight: "700", fontSize: "17px" } }, "New Event"),
        h("button", { class: "pressable", style: { padding: "8px 18px", borderRadius: "999px", background: "#ef4444", color: "#fff", fontWeight: "700", fontSize: "14px" }, onClick: save }, "Add")),
      h("div", { class: "card-white", style: { margin: "10px 16px", padding: "4px 16px" } },
        h("div", { style: { display: "flex", padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,.05)" } }, title),
        h("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "12px 0" } },
          svgIcon(I.clock, "", 16), time,
          h("span", { style: { fontSize: "13px", color: "#9ca3af" } }, `Dec ${sel}, 2025`))));
  });

  drawGrid(); drawList();
  const hdr = h("div", { class: "ghdr" },
    h("div", { class: "row" },
      h("button", { class: "bk g-btn", style: { display: "flex", padding: "8px", borderRadius: "50%" }, onClick: () => { month = (month + 11) % 12; drawGrid(); } }, svgIcon(I.chevronLeft)),
      h("div", { style: { display: "flex", gap: "8px" } },
        h("button", { class: "act g-btn", style: { display: "flex", padding: "8px", borderRadius: "50%", fontSize: "13px", fontWeight: "700", color: "#ef4444" }, onClick: () => { month = 11; sel = 13; drawGrid(); drawList(); } }, "Today"),
        h("button", { class: "act g-btn", style: { display: "flex", padding: "8px", borderRadius: "50%" }, onClick: () => { month = (month + 1) % 12; drawGrid(); } },
          h("span", { style: { transform: "rotate(180deg)", display: "flex" } }, svgIcon(I.chevronLeft))))),
    mlabel);
  root.append(hdr, grid, list,
    h("button", { class: "app-fab", style: { width: "56px", height: "56px", right: "20px", bottom: "36px", background: "#ef4444", color: "#fff" }, onClick: addEvent }, svgIcon(I.plus)));
  return root;
}
