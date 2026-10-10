// weather.ts — météo vivante : sélecteur de ville, données par ville,
// détails horaire + prévisions 10 jours.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import type { IconName } from "../core/lucide";
import { GlassHeader, pane } from "./ui";

interface City { name: string; temp: number; cond: string; icon: IconName; hi: number; lo: number; glow: string }
const CITIES: City[] = [
  { name: "San Francisco", temp: 18, cond: "Partly Cloudy", icon: "cloudSun", hi: 21, lo: 12, glow: "rgba(253,224,71,.3)" },
  { name: "New York", temp: 9, cond: "Clear", icon: "sun", hi: 12, lo: 3, glow: "rgba(96,165,250,.35)" },
  { name: "Paris", temp: 14, cond: "Light Rain", icon: "cloudRain", hi: 16, lo: 9, glow: "rgba(148,163,184,.35)" },
  { name: "Tokyo", temp: 22, cond: "Sunny", icon: "sun", hi: 25, lo: 17, glow: "rgba(251,191,36,.35)" },
];

const HOURS = ["Now", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM", "7PM"];
const DAYS = ["Today", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

export function WeatherApp() {
  const root = h("div", { class: "pg", style: { height: "100%", position: "relative", display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#1e3a8a,#0c1b3d)", color: "#fff", overflow: "hidden" } });
  const glow = h("div", { class: "wx-glow" });
  const scroll = h("div", { class: "app-scroll no-sb", style: { padding: "0 20px 60px", position: "relative" } });
  let city = CITIES[0];

  const tile = (icon: IconName, t: string, v: string, s = "") =>
    h("div", { class: "g-dark", style: { borderRadius: "22px", padding: "14px", display: "flex", flexDirection: "column", gap: "4px" } },
      h("div", { style: { display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", color: "rgba(255,255,255,.6)", textTransform: "uppercase" } }, svgIcon(I[icon], "", 13), t),
      h("div", { style: { fontSize: "22px", fontWeight: "700" } }, v),
      s ? h("div", { style: { fontSize: "11px", color: "rgba(255,255,255,.6)" } }, s) : null);

  const draw = () => {
    glow.style.background = city.glow;
    scroll.replaceChildren(
      h("div", { class: "pressable", style: { textAlign: "center", margin: "12px 0 18px", cursor: "pointer" }, onClick: () => picker() },
        h("div", { style: { fontSize: "30px", fontWeight: "600" } }, city.name),
        h("div", { style: { fontSize: "86px", fontWeight: "200", letterSpacing: "-.05em", lineHeight: "1" } }, city.temp + "°"),
        h("div", { style: { fontSize: "17px", fontWeight: "500", color: "rgba(255,255,255,.85)" } }, city.cond),
        h("div", { style: { fontSize: "14px", color: "rgba(255,255,255,.7)", marginTop: "2px" } }, `H:${city.hi}°  L:${city.lo}°`)),
      h("div", { class: "g-dark no-sb", style: { display: "flex", gap: "18px", overflowX: "auto", borderRadius: "22px", padding: "14px 18px", marginBottom: "14px" } },
        ...HOURS.map((hr, i) => h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: "none" } },
          h("span", { style: { fontSize: "12px", fontWeight: "600", color: "rgba(255,255,255,.7)" } }, hr),
          svgIcon(I[i < 2 || i > 5 ? city.icon : "sun"], "", 20),
          h("span", { style: { fontSize: "15px", fontWeight: "700" } }, `${city.temp + [0, 1, 2, 2, 1, 0, -1, -2][i]}°`)))),
      h("div", { class: "g-dark", style: { borderRadius: "22px", padding: "8px 18px", marginBottom: "14px" } },
        h("div", { style: { fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", color: "rgba(255,255,255,.6)", padding: "8px 0", textTransform: "uppercase" } }, "7-Day Forecast"),
        ...DAYS.map((d, i) =>
          h("div", { style: { display: "flex", alignItems: "center", gap: "12px", padding: "9px 0", borderTop: i ? "1px solid rgba(255,255,255,.08)" : "none" } },
            h("span", { style: { width: "52px", fontWeight: "600", fontSize: "15px" } }, d),
            svgIcon(I[["sun", "cloudSun", "cloudRain", "sun", "cloud", "cloudSun", "sun"][i] as IconName], "", 18),
            h("span", { style: { fontSize: "14px", color: "rgba(255,255,255,.6)" } }, `${city.lo - 2 + i}°`),
            h("div", { style: { flex: "1", height: "4px", borderRadius: "2px", background: `linear-gradient(90deg,#38bdf8,#fbbf24)` } }),
            h("span", { style: { fontSize: "14px", fontWeight: "600" } }, `${city.hi - i}°`)))),
      h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } },
        tile("wind", "Wind", `${8 + city.lo} km/h`, "NW · Gusts 14"),
        tile("droplets", "Humidity", `${55 + city.lo}%`, "Dew point 9°"),
        tile("eye", "Visibility", "24 km", "Perfectly clear"),
        tile("sun", "UV Index", "3", "Moderate")));
  };

  const picker = () => pane(root, (close) =>
    h("div", { class: "pg", style: { background: "#f4f4f5", color: "#111", height: "100%", display: "flex", flexDirection: "column" } },
      h("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "60px 16px 10px" } },
        h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: close }, svgIcon(I.chevronLeft, "", 18)),
        h("span", { style: { fontWeight: "700", fontSize: "17px" } }, "Weather")),
      h("div", { class: "no-sb", style: { flex: "1", padding: "8px 16px", display: "flex", flexDirection: "column", gap: "10px" } },
        ...CITIES.map((c) => h("div", { class: "pressable", style: { borderRadius: "24px", padding: "18px", color: "#fff", background: c.glow.replace(".3", ".55").replace(".35", ".6"), backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "space-between" },
          onClick: () => { city = c; draw(); close(); } },
          h("div", {},
            h("div", { style: { fontSize: "20px", fontWeight: "700" } }, c.name),
            h("div", { style: { fontSize: "13px", opacity: ".85" } }, c.cond)),
          h("div", { style: { fontSize: "40px", fontWeight: "200" } }, c.temp + "°"))))));

  draw();
  root.append(glow, GlassHeader(""), scroll);
  const bk = root.querySelector(".ghdr .bk") as HTMLElement | null; if (bk) bk.style.color = "#fff";
  return root;
}
