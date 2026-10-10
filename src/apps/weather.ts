// weather.ts — app Météo (thème sombre, contenu maquette : SF, 72°, hourly, 4 tuiles).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { shell } from "../shell/api";

export function WeatherApp() {
  const hourly = ["Now", "1PM", "2PM", "3PM", "4PM", "5PM"].map((t, i) =>
    h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", minWidth: "30px" } },
      h("span", { style: { fontSize: "12px", fontWeight: "500", opacity: ".9" } }, t),
      (() => { const c = svgIcon(I.cloud); (c.querySelector("svg") as SVGElement).style.fill = i === 0 ? "#fff" : "rgba(255,255,255,.2)"; return c; })(),
      h("span", { style: { fontSize: "18px", fontWeight: "700" } }, `${72 + i}°`)));

  const tile = (icon: string, label: string, big: string, sub: string, extra?: HTMLElement) =>
    h("div", { class: "g-dark", style: { aspectRatio: "1", borderRadius: "30px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" } },
      h("div", { style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", opacity: ".6" } }, svgIcon(icon), label),
      h("div", {}, h("div", { style: { fontSize: "36px", fontWeight: "600" } }, big), h("div", { style: { fontSize: "14px", fontWeight: "500", opacity: ".8", marginTop: "4px" } }, sub)),
      extra ?? h("span"));

  const wind = h("div", { style: { position: "relative", height: "80px", width: "80px", alignSelf: "center" } },
    h("div", { style: { position: "absolute", inset: "0", opacity: ".2" } }, svgIcon(I.compass, "", 80)),
    h("div", { style: { position: "absolute", inset: "0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" } }, "NW"),
    h("div", { style: { position: "absolute", inset: "0", borderTop: "4px solid #fff", borderRadius: "50%", transform: "rotate(45deg)", boxShadow: "0 2px 10px rgba(255,255,255,.5)" } }));

  const dailyRows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) =>
    h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" } },
      h("span", { style: { fontSize: "15px", fontWeight: "600", width: "48px" } }, d),
      svgIcon(i < 3 ? I.sun : I.cloud, "", 20),
      h("span", { style: { fontSize: "14px", opacity: ".6", width: "36px", textAlign: "right" } }, `${60 + i}°`),
      h("div", { style: { flex: "1", height: "4px", margin: "0 12px", borderRadius: "2px", background: "rgba(255,255,255,.15)", overflow: "hidden" } },
        h("div", { style: { height: "100%", width: `${55 + i * 5}%`, background: "linear-gradient(90deg,#60a5fa,#facc15)" } })),
      h("span", { style: { fontSize: "14px", fontWeight: "700", width: "36px" } }, `${74 + i}°`)));

  const hourlyStrip = h("div", { style: { display: "flex", gap: "32px", width: "max-content" } }, ...hourly);
  const dailyList = h("div", { style: { display: "none", flexDirection: "column" } }, ...dailyRows);
  const seg = (label: string, on: boolean, onClick: () => void) =>
    h("button", { class: "pressable", style: { padding: "5px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".06em", background: on ? "rgba(255,255,255,.9)" : "transparent", color: on ? "#111" : "rgba(255,255,255,.6)", transition: "all .2s" }, onClick }, label);
  const segHour = seg("Hourly", true, () => setMode("h"));
  const segDay = seg("Daily", false, () => setMode("d"));
  const setMode = (m: "h" | "d") => {
    hourlyStrip.style.display = m === "h" ? "flex" : "none";
    dailyList.style.display = m === "d" ? "flex" : "none";
    segHour.style.background = m === "h" ? "rgba(255,255,255,.9)" : "transparent"; segHour.style.color = m === "h" ? "#111" : "rgba(255,255,255,.6)";
    segDay.style.background = m === "d" ? "rgba(255,255,255,.9)" : "transparent"; segDay.style.color = m === "d" ? "#111" : "rgba(255,255,255,.6)";
  };

  return h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" } },
    h("div", { class: "wx-glow" }),
    h("div", { class: "app-scroll no-sb", style: { padding: "80px 24px 96px", position: "relative", zIndex: "10" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "64px" } },
        h("div", {},
          h("div", { style: { fontSize: "18px", fontWeight: "500", letterSpacing: ".15em", textTransform: "uppercase", opacity: ".9", display: "flex", alignItems: "center", gap: "8px" } }, svgIcon(I.mapPin, "", 16), "San Francisco"),
          h("div", { style: { fontSize: "112px", lineHeight: "1", fontWeight: "200", letterSpacing: "-.06em", marginTop: "8px" } }, "72°"),
          h("div", { style: { fontSize: "20px", fontWeight: "500", opacity: ".9", marginTop: "8px" } }, "Mostly Clear"),
          h("div", { style: { display: "flex", gap: "16px", marginTop: "8px", fontSize: "14px", opacity: ".8", fontWeight: "500" } },
            h("span", {}, "H:76° L:62°"), h("span", {}, "AQI 32")))),
      h("div", { class: "g-dark", style: { borderRadius: "35px", padding: "24px", marginBottom: "16px", overflowX: "auto" } },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" } },
          h("div", { style: { fontSize: "12px", fontWeight: "700", textTransform: "uppercase", opacity: ".6" } }, "Forecast"),
          h("div", { style: { display: "flex", gap: "4px", background: "rgba(255,255,255,.1)", borderRadius: "999px", padding: "3px" } }, segHour, segDay)),
        hourlyStrip, dailyList),
      h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" } },
        tile(I.sun, "UV Index", "4", "Moderate",
          h("div", { style: { height: "4px", width: "100%", background: "rgba(255,255,255,.2)", borderRadius: "2px", overflow: "hidden" } },
            h("div", { style: { width: "40%", height: "100%", background: "linear-gradient(90deg,#4ade80,#facc15)" } }))),
        tile(I.droplets, "Humidity", "48%", "Dew Point 54°"),
        tile(I.wind, "Wind", "", "", wind),
        tile(I.eye, "Visibility", "10 mi", "Perfect View"))),
    h("button", { class: "g-btn pressable", style: { position: "absolute", top: "56px", right: "24px", padding: "12px", borderRadius: "50%", zIndex: "50", display: "flex" }, onClick: () => shell.closeApp() },
      svgIcon(I.x, "", 20)));
}
