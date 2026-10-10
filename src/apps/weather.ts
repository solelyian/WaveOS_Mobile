// weather.ts — app Météo façon HarmonyOS : ciel immersif par condition,
// température géante ultrafine, courbes continues (horaire + 7 jours), jauges.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import type { IconName } from "../core/lucide";
import { shell } from "../shell/api";

/* ------------------------------ données ------------------------------ */

type Sky = "day" | "heat" | "cloudy" | "rain" | "night";

interface Hour { t: string; icon: IconName; temp: number }
interface Day { d: string; icon: IconName; lo: number; hi: number; pp?: number }
interface City {
  name: string; country: string; cond: string;
  temp: number; hi: number; lo: number;
  aqi: number; aqiLabel: string; aqiColor: string;
  sky: Sky;
  hourly: Hour[]; daily: Day[];
  uv: { v: number; label: string };
  humidity: number; dew: number;
  wind: { deg: number; dir: string; speed: number };
  vis: string;
  feels: number; feelsNote: string;
  precip: string; precipNote: string;
  sunrise: string; sunset: string; sunPos: number; dayLen: string;
}

const H = (t: string, icon: IconName, temp: number): Hour => ({ t, icon, temp });
const D = (d: string, icon: IconName, lo: number, hi: number, pp = 0): Day =>
  pp ? { d, icon, lo, hi, pp } : { d, icon, lo, hi };

const CITIES: City[] = [
  {
    name: "San Francisco", country: "United States", cond: "Mostly Sunny",
    temp: 72, hi: 76, lo: 62,
    aqi: 32, aqiLabel: "Good", aqiColor: "#4ade80", sky: "day",
    hourly: [
      H("Now", "sun", 72), H("1PM", "sun", 73), H("2PM", "sun", 75),
      H("3PM", "sun", 76), H("4PM", "cloudSun", 75), H("5PM", "cloudSun", 73),
      H("6PM", "cloudSun", 71), H("7PM", "cloudMoon", 69), H("8PM", "moon", 68),
      H("9PM", "moon", 67),
    ],
    daily: [
      D("Today", "sun", 62, 76), D("Tue", "sun", 63, 78), D("Wed", "cloudSun", 64, 77),
      D("Thu", "cloudy", 65, 72, 20), D("Fri", "cloudSun", 64, 74),
      D("Sat", "sun", 63, 79), D("Sun", "sun", 62, 80),
    ],
    uv: { v: 4, label: "Moderate" },
    humidity: 48, dew: 54,
    wind: { deg: 315, dir: "NW", speed: 12 },
    vis: "10 mi", feels: 75, feelsNote: "Sun is making it feel warmer",
    precip: "0 in", precipNote: "None expected today",
    sunrise: "7:12 AM", sunset: "6:44 PM", sunPos: 0.55, dayLen: "11h 32m",
  },
  {
    name: "New York", country: "United States", cond: "Cloudy",
    temp: 58, hi: 61, lo: 49,
    aqi: 41, aqiLabel: "Good", aqiColor: "#4ade80", sky: "cloudy",
    hourly: [
      H("Now", "cloudy", 58), H("1PM", "cloudy", 59), H("2PM", "cloudSun", 60),
      H("3PM", "cloudy", 61), H("4PM", "cloudy", 60), H("5PM", "cloudy", 59),
      H("6PM", "cloudMoon", 57), H("7PM", "cloudMoon", 55), H("8PM", "cloudMoon", 54),
      H("9PM", "cloudMoon", 53),
    ],
    daily: [
      D("Today", "cloudy", 49, 61), D("Tue", "cloudRain", 50, 58, 70),
      D("Wed", "cloudRain", 48, 56, 60), D("Thu", "cloudy", 47, 60),
      D("Fri", "cloudSun", 49, 63), D("Sat", "sun", 50, 65), D("Sun", "cloudSun", 52, 64),
    ],
    uv: { v: 2, label: "Low" },
    humidity: 61, dew: 45,
    wind: { deg: 45, dir: "NE", speed: 8 },
    vis: "8 mi", feels: 56, feelsNote: "Wind is making it feel cooler",
    precip: "0.1 in", precipNote: "Rain expected tomorrow",
    sunrise: "6:58 AM", sunset: "6:18 PM", sunPos: 0.6, dayLen: "11h 20m",
  },
  {
    name: "Paris", country: "France", cond: "Light Rain",
    temp: 54, hi: 57, lo: 48,
    aqi: 28, aqiLabel: "Good", aqiColor: "#4ade80", sky: "rain",
    hourly: [
      H("Now", "cloudRain", 54), H("7PM", "cloudRain", 54), H("8PM", "cloudRain", 53),
      H("9PM", "cloudRain", 53), H("10PM", "cloudy", 52), H("11PM", "cloudy", 51),
      H("12AM", "cloudy", 50), H("1AM", "cloudRain", 50), H("2AM", "cloudRain", 49),
      H("3AM", "cloudRain", 49),
    ],
    daily: [
      D("Today", "cloudRain", 48, 57, 90), D("Tue", "cloudRain", 47, 55, 80),
      D("Wed", "cloudy", 46, 58, 30), D("Thu", "cloudSun", 47, 61),
      D("Fri", "cloudSun", 48, 62), D("Sat", "cloudy", 49, 60, 20),
      D("Sun", "cloudRain", 48, 57, 60),
    ],
    uv: { v: 1, label: "Low" },
    humidity: 87, dew: 50,
    wind: { deg: 225, dir: "SW", speed: 14 },
    vis: "4 mi", feels: 51, feelsNote: "Rain is making it feel cooler",
    precip: "0.33 in", precipNote: "0.1 in expected in the next 24h",
    sunrise: "8:12 AM", sunset: "7:02 PM", sunPos: 0.78, dayLen: "10h 50m",
  },
  {
    name: "Tokyo", country: "Japan", cond: "Clear Night",
    temp: 66, hi: 73, lo: 59,
    aqi: 55, aqiLabel: "Moderate", aqiColor: "#facc15", sky: "night",
    hourly: [
      H("Now", "moon", 66), H("4AM", "moon", 65), H("5AM", "cloudMoon", 64),
      H("6AM", "cloudMoon", 64), H("7AM", "cloudSun", 65), H("8AM", "sun", 67),
      H("9AM", "sun", 69), H("10AM", "sun", 71), H("11AM", "sun", 72),
      H("12PM", "cloudSun", 73),
    ],
    daily: [
      D("Today", "sun", 59, 73), D("Tue", "sun", 60, 74), D("Wed", "cloudSun", 60, 72),
      D("Thu", "cloudy", 59, 70, 20), D("Fri", "cloudSun", 58, 71),
      D("Sat", "sun", 57, 75), D("Sun", "sun", 58, 76),
    ],
    uv: { v: 0, label: "Low" },
    humidity: 72, dew: 57,
    wind: { deg: 90, dir: "E", speed: 5 },
    vis: "9 mi", feels: 66, feelsNote: "Similar to the actual temperature",
    precip: "0 in", precipNote: "None expected in the next 10 days",
    sunrise: "5:38 AM", sunset: "5:21 PM", sunPos: 0.06, dayLen: "11h 43m",
  },
  {
    name: "Dubai", country: "UAE", cond: "Sunny",
    temp: 97, hi: 104, lo: 86,
    aqi: 88, aqiLabel: "Moderate", aqiColor: "#facc15", sky: "heat",
    hourly: [
      H("Now", "sun", 97), H("1PM", "sun", 99), H("2PM", "sun", 101),
      H("3PM", "sun", 103), H("4PM", "sun", 104), H("5PM", "sun", 103),
      H("6PM", "sun", 101), H("7PM", "sun", 98), H("8PM", "sun", 95),
      H("9PM", "sun", 93),
    ],
    daily: [
      D("Today", "sun", 86, 104), D("Tue", "sun", 87, 105), D("Wed", "sun", 88, 106),
      D("Thu", "sun", 87, 105), D("Fri", "cloudSun", 86, 103),
      D("Sat", "sun", 85, 102), D("Sun", "sun", 84, 101),
    ],
    uv: { v: 11, label: "Extreme" },
    humidity: 22, dew: 49,
    wind: { deg: 315, dir: "NW", speed: 9 },
    vis: "10 mi", feels: 101, feelsNote: "Extreme heat — stay hydrated",
    precip: "0 in", precipNote: "No rain expected this month",
    sunrise: "6:14 AM", sunset: "6:08 PM", sunPos: 0.5, dayLen: "11h 54m",
  },
];

/* ------------------------------ helpers ------------------------------ */

let uid = 0;
const gid = (p: string) => `${p}${++uid}`;

/** Catmull-Rom → Bézier cubique : la courbe lisse signature de HarmonyOS. */
function smooth(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i];
    const p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

const lab = (icon: IconName, txt: string) =>
  h("div", { style: { display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "700", letterSpacing: ".08em", textTransform: "uppercase", opacity: ".6" } },
    svgIcon(I[icon], "", 13), txt);

/* ------------------------------ ciel immersif ------------------------------ */

function skyDecor(sky: Sky): HTMLElement[] {
  const orb = (cls: string, style: Partial<CSSStyleDeclaration> = {}) =>
    h("div", { class: "wx-orb " + cls, style });
  const cloud = (top: string, w: number, dur: number, op: number, dark = false) =>
    h("div", {
      class: "wx-cl" + (dark ? " dk" : ""),
      style: { top, width: `${w}px`, height: `${w * 0.34}px`, animationDuration: `${dur}s`, opacity: `${op}` },
    });
  switch (sky) {
    case "day":
      return [orb("sun"), cloud("18%", 190, 95, 0.35), cloud("42%", 130, 130, 0.22)];
    case "heat":
      return [orb("sun hot"), cloud("30%", 150, 140, 0.16)];
    case "cloudy":
      return [
        cloud("8%", 240, 80, 0.5, true), cloud("22%", 200, 105, 0.45),
        cloud("40%", 160, 125, 0.35), cloud("60%", 210, 150, 0.3, true),
      ];
    case "rain":
      return [
        cloud("4%", 260, 90, 0.6, true), cloud("16%", 220, 110, 0.5, true),
        h("div", { class: "wx-rainfall" }),
      ];
    case "night": {
      const stars = h("div", { style: { position: "absolute", inset: "0" } });
      for (let i = 0; i < 46; i++) {
        const s = 1 + Math.random() * 1.6;
        stars.append(h("i", {
          class: "wx-star",
          style: {
            left: `${Math.random() * 96}%`, top: `${Math.random() * 58}%`,
            width: `${s}px`, height: `${s}px`,
            animationDuration: `${2.2 + Math.random() * 3.4}s`,
            animationDelay: `${Math.random() * 4}s`,
          },
        }));
      }
      return [orb("moon"), stars, cloud("52%", 150, 160, 0.1, true)];
    }
  }
}

/* ------------------------------ cartes ------------------------------ */

function hourlyCard(c: City): HTMLElement {
  const CW = 60, n = c.hourly.length, W = CW * n, SH = 92, top = 30, bot = 10;
  const ts = c.hourly.map((x) => x.temp);
  const mn = Math.min(...ts), mx = Math.max(...ts);
  const y = (t: number) => top + ((mx - t) / Math.max(1, mx - mn)) * (SH - top - bot);
  const pts = c.hourly.map((x, i): [number, number] => [i * CW + CW / 2, y(x.temp)]);
  const line = smooth(pts);
  const last = pts[pts.length - 1], first = pts[0];
  const fill = `${line} L ${last[0]} ${SH + 30} L ${first[0]} ${SH + 30} Z`;
  const g = gid("wxh");
  const svg = `<svg width="${W}" height="${SH}" viewBox="0 0 ${W} ${SH}" fill="none">
    <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${fill}" fill="url(#${g})"/>
    <path d="${line}" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".95"/>
    ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.2" fill="#fff"/><text x="${p[0]}" y="${p[1] - 10}" text-anchor="middle" font-size="13" font-weight="600" fill="#fff" fill-opacity=".9">${ts[i]}°</text>`).join("")}
  </svg>`;
  const cols = c.hourly.map((x) =>
    h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: `${CW}px` } },
      h("span", { style: { fontSize: "13px", fontWeight: "500", opacity: ".85" } }, x.t),
      (() => { const c2 = svgIcon(I[x.icon], "", 20); (c2.querySelector("svg") as SVGElement).style.color = "rgba(255,255,255,.95)"; return c2; })()));
  return h("div", { class: "wx-card" },
    lab("clock", "Hourly Forecast"),
    h("div", { class: "wx-strip no-sb" },
      h("div", { style: { width: `${W}px` } },
        h("div", { style: { display: "flex", padding: "14px 0 8px" } }, ...cols),
        h("div", { html: svg }))));
}

function dailyCard(c: City): HTMLElement {
  const CW = 46, n = c.daily.length, W = CW * n, SH = 118, pad = 24;
  const los = c.daily.map((d) => d.lo), his = c.daily.map((d) => d.hi);
  const mn = Math.min(...los) - 2, mx = Math.max(...his) + 2;
  const y = (t: number) => pad + ((mx - t) / (mx - mn)) * (SH - pad * 2);
  const hiPts = c.daily.map((d, i): [number, number] => [i * CW + CW / 2, y(d.hi)]);
  const loPts = c.daily.map((d, i): [number, number] => [i * CW + CW / 2, y(d.lo)]);
  const hiLine = smooth(hiPts), loLine = smooth(loPts);
  // ruban : courbe haute + courbe basse inversée
  const bandD = `${hiLine} ${smooth([...loPts].reverse()).replace(/^M/, "L")} Z`;
  const g = gid("wxd");
  const svg = `<svg width="${W}" height="${SH}" viewBox="0 0 ${W} ${SH}" fill="none">
    <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd9a3" stop-opacity=".55"/><stop offset="1" stop-color="#9cd2ff" stop-opacity=".4"/>
    </linearGradient></defs>
    <path d="${bandD}" fill="url(#${g})" stroke="none"/>
    <path d="${hiLine}" stroke="#ffdcae" stroke-width="2.2" stroke-linecap="round"/>
    <path d="${loLine}" stroke="#a8d6ff" stroke-width="2.2" stroke-linecap="round"/>
    ${hiPts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#ffdcae"/><text x="${p[0]}" y="${p[1] - 9}" text-anchor="middle" font-size="12" font-weight="600" fill="#fff">${his[i]}°</text>`).join("")}
    ${loPts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#a8d6ff"/><text x="${p[0]}" y="${p[1] + 16}" text-anchor="middle" font-size="12" font-weight="500" fill="#fff" fill-opacity=".65">${los[i]}°</text>`).join("")}
  </svg>`;
  const cols = c.daily.map((d) =>
    h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: `${CW}px` } },
      h("span", { style: { fontSize: "13px", fontWeight: "600", opacity: ".9" } }, d.d),
      svgIcon(I[d.icon], "", 19),
      h("span", { style: { fontSize: "10px", fontWeight: "700", color: "#7cc4ff", height: "12px" } }, d.pp ? `${d.pp}%` : "")));
  return h("div", { class: "wx-card" },
    lab("calendar", "7-Day Forecast"),
    h("div", { style: { display: "flex", justifyContent: "center" } },
      h("div", { style: { width: `${W}px` } },
        h("div", { style: { display: "flex", padding: "14px 0 4px" } }, ...cols),
        h("div", { html: svg }))));
}

/** Jauge en arc 180° (UV / AQI) — `full` : arc complet coloré, sinon rempli à `frac`. */
function arcGauge(frac: number, color: string | { grad: [string, string][] }, big: string, sub: string, full = false): HTMLElement {
  const cx = 60, cy = 64, r = 44;
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const dotA = Math.PI * (1 - Math.min(1, Math.max(0, frac)));
  const dx = cx + r * Math.cos(dotA), dy = cy - r * Math.sin(dotA);
  const g = gid("wxa");
  const stroke = typeof color === "string" ? color : `url(#${g})`;
  const defs = typeof color === "string" ? "" :
    `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0">${color.grad.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient></defs>`;
  return h("div", { style: { display: "flex", flexDirection: "column", flex: "1" } },
    h("div", { html: `<svg width="120" height="74" viewBox="0 0 120 74" style="display:block;margin:0 auto">
      ${defs}
      <path d="${arc}" stroke="rgba(255,255,255,.18)" stroke-width="7" stroke-linecap="round"/>
      <path d="${arc}" stroke="${stroke}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${Math.PI * r}" stroke-dashoffset="${full ? 0 : Math.PI * r * (1 - Math.min(1, Math.max(0, frac)))}"/>
      <circle cx="${dx}" cy="${dy}" r="5" fill="#fff" stroke="rgba(0,0,0,.15)" stroke-width="1.5"/>
    </svg>` }),
    h("div", { style: { textAlign: "center", marginTop: "-6px" } },
      h("div", { style: { fontSize: "26px", fontWeight: "600", lineHeight: "1.05" } }, big),
      h("div", { style: { fontSize: "12px", opacity: ".65", fontWeight: "500", marginTop: "2px" } }, sub)));
}

function sunTile(c: City): HTMLElement {
  const cx = 60, cy = 66, r = 44;
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const a = Math.PI * (1 - c.sunPos);
  const sx = cx + r * Math.cos(a), sy = cy - r * Math.sin(a);
  return h("div", { class: "wx-card wx-tile" },
    lab("sunrise", "Sun"),
    h("div", { html: `<svg width="120" height="80" viewBox="0 0 120 80" style="display:block;margin:2px auto 0">
      <line x1="8" y1="${cy}" x2="112" y2="${cy}" stroke="rgba(255,255,255,.4)" stroke-width="1.5"/>
      <path d="${arc}" stroke="rgba(255,255,255,.35)" stroke-width="1.5" stroke-dasharray="2 5" fill="none"/>
      <circle cx="${sx}" cy="${sy}" r="9" fill="#ffd76a" opacity=".3"/>
      <circle cx="${sx}" cy="${sy}" r="4.5" fill="#ffd76a"/>
      <circle cx="${cx - r}" cy="${cy}" r="2.5" fill="#fff" opacity=".7"/>
      <circle cx="${cx + r}" cy="${cy}" r="2.5" fill="#fff" opacity=".7"/>
    </svg>` }),
    h("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "600", opacity: ".9", marginTop: "2px" } },
      h("span", {}, c.sunrise), h("span", {}, c.sunset)),
    h("div", { style: { fontSize: "11px", opacity: ".55", textAlign: "center", marginTop: "4px" } }, `Day length ${c.dayLen}`));
}

function windTile(c: City): HTMLElement {
  const cx = 55, cy = 55, r = 40;
  const ticks = [["N", cx, 13], ["E", cx + r - 6, cy + 4], ["S", cx, cy + r + 3], ["W", cx - r + 6, cy + 4]]
    .map(([t, x, y]) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="10" font-weight="700" fill="rgba(255,255,255,.6)">${t}</text>`).join("");
  return h("div", { class: "wx-card wx-tile" },
    lab("wind", "Wind"),
    h("div", { html: `<svg width="110" height="110" viewBox="0 0 110 110" style="display:block;margin:0 auto">
      <circle cx="${cx}" cy="${cy}" r="${r}" stroke="rgba(255,255,255,.2)" stroke-width="1.5" fill="rgba(255,255,255,.05)"/>
      ${ticks}
      <path d="M55 21 L61 60 L55 55 L49 60 Z" fill="#fff" transform="rotate(${c.wind.deg} ${cx} ${cy})"/>
      <circle cx="${cx}" cy="${cy}" r="3" fill="#fff"/>
      <text x="${cx}" y="${cy + 26}" text-anchor="middle" font-size="15" font-weight="700" fill="#fff">${c.wind.speed}</text>
      <text x="${cx}" y="${cy + 38}" text-anchor="middle" font-size="9" font-weight="600" fill="rgba(255,255,255,.6)">mph ${c.wind.dir}</text>
    </svg>` }));
}

function miniTile(icon: IconName, label: string, big: string, sub: string): HTMLElement {
  return h("div", { class: "wx-card wx-tile" },
    lab(icon, label),
    h("div", { style: { flex: "1", display: "flex", flexDirection: "column", justifyContent: "center" } },
      h("div", { style: { fontSize: "28px", fontWeight: "500", lineHeight: "1.1" } }, big),
      h("div", { style: { fontSize: "12px", opacity: ".65", fontWeight: "500", marginTop: "4px", lineHeight: "1.35" } }, sub)));
}

function tilesGrid(c: City): HTMLElement {
  const uvFrac = c.uv.v / 11;
  const uvColor = { grad: [["0", "#4ade80"], ["0.35", "#a3e635"], ["0.55", "#facc15"], ["0.75", "#fb923c"], ["0.9", "#ef4444"], ["1", "#a855f7"]] as [string, string][] };
  return h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } },
    h("div", { class: "wx-card wx-tile" }, lab("sun", "UV Index"), arcGauge(uvFrac, uvColor, `${c.uv.v}`, c.uv.label, true)),
    sunTile(c),
    h("div", { class: "wx-card wx-tile" }, lab("gauge", "Air Quality"), arcGauge(Math.min(1, c.aqi / 150), c.aqiColor, `${c.aqi}`, c.aqiLabel)),
    windTile(c),
    miniTile("thermometer", "Feels Like", `${c.feels}°`, c.feelsNote),
    miniTile("droplets", "Humidity", `${c.humidity}%`, `Dew point ${c.dew}°`),
    miniTile("eye", "Visibility", c.vis, "Perfectly clear view"),
    miniTile("umbrella", "Precipitation", c.precip, c.precipNote));
}

/* ------------------------------ app ------------------------------ */

export function WeatherApp() {
  let ci = 0;
  const root = h("div", { style: { height: "100%", position: "relative", overflow: "hidden", background: "#0a0e1a", display: "flex", flexDirection: "column" } });
  const skyA = h("div", { class: "wx-sky" });
  const skyB = h("div", { class: "wx-sky" });
  let skyFront = skyA;
  const stage = h("div", { class: "app-scroll no-sb", style: { position: "relative", zIndex: "10", padding: "74px 20px 110px" } });

  /* --- sheet villes --- */
  const sheetBg = h("div", { class: "wx-sheet-bg", onClick: () => setSheet(false) });
  const sheet = h("div", { class: "wx-sheet" });
  const setSheet = (on: boolean) => {
    sheetBg.classList.toggle("on", on);
    sheet.classList.toggle("on", on);
    if (on) sheet.replaceChildren(sheetBody());
  };
  const sheetBody = () => h("div", {},
    h("div", { style: { display: "flex", justifyContent: "center", padding: "6px 0 14px" } },
      h("i", { style: { width: "40px", height: "5px", borderRadius: "3px", background: "rgba(255,255,255,.35)", display: "block" } })),
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 8px 12px" } },
      h("span", { style: { fontSize: "20px", fontWeight: "700" } }, "Cities"),
      h("span", { style: { fontSize: "12px", opacity: ".5", fontWeight: "500" } }, `${CITIES.length} places`)),
    ...CITIES.map((ct, i) => h("button", {
      class: "pressable",
      style: {
        width: "100%", display: "flex", alignItems: "center", gap: "12px", textAlign: "left",
        padding: "14px 14px", borderRadius: "18px", marginBottom: "6px",
        background: i === ci ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.05)",
        border: i === ci ? "1px solid rgba(255,255,255,.3)" : "1px solid transparent",
      },
      onClick: () => { ci = i; render(); setSheet(false); },
    },
      svgIcon(i === 0 ? I.navigation : I.mapPin, "", 16),
      h("div", { style: { flex: "1", minWidth: "0" } },
        h("div", { style: { fontSize: "16px", fontWeight: "600" } },
          ct.name, i === 0 ? h("span", { style: { fontSize: "11px", fontWeight: "600", opacity: ".55", marginLeft: "8px" } }, "My Location") : ""),
        h("div", { style: { fontSize: "12px", opacity: ".55", fontWeight: "500" } }, ct.cond)),
      svgIcon(I[ct.hourly[0].icon], "", 20),
      h("span", { style: { fontSize: "22px", fontWeight: "300", width: "44px", textAlign: "right" } }, `${ct.temp}°`),
      i === ci ? svgIcon(I.check, "", 16) : h("span", { style: { width: "16px" } }))));

  /* --- en-tête immersif --- */
  const pager = () => h("div", { style: { display: "flex", gap: "6px", marginTop: "14px" } },
    ...CITIES.map((_, i) => h("button", {
      style: { width: i === ci ? "18px" : "6px", height: "6px", borderRadius: "3px", background: i === ci ? "#fff" : "rgba(255,255,255,.45)", transition: "all .3s", padding: "0" },
      onClick: () => { ci = i; render(); },
    })));

  const header = (c: City) => h("div", { style: { marginBottom: "26px" } },
    h("button", {
      class: "pressable",
      style: { display: "flex", alignItems: "center", gap: "7px", fontSize: "17px", fontWeight: "500", letterSpacing: ".02em", padding: "6px 10px 6px 0", filter: "drop-shadow(0 1px 3px rgba(0,0,0,.3))" },
      onClick: () => setSheet(true),
    }, svgIcon(I.mapPin, "", 15), c.name, svgIcon(I.chevronDown, "", 14)),
    h("div", { style: { fontSize: "128px", lineHeight: ".95", fontWeight: "100", letterSpacing: "-.05em", marginTop: "6px", marginLeft: "-6px", filter: "drop-shadow(0 2px 8px rgba(0,0,0,.18))" } }, `${c.temp}°`),
    h("div", { style: { fontSize: "19px", fontWeight: "500", opacity: ".92", marginTop: "6px" } }, c.cond),
    h("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", fontSize: "15px", fontWeight: "500" } },
      h("span", { style: { opacity: ".85" } }, `H:${c.hi}°  L:${c.lo}°`),
      h("span", { style: { fontSize: "12px", fontWeight: "700", padding: "3px 10px", borderRadius: "999px", background: "rgba(255,255,255,.2)", backdropFilter: "blur(8px)" } }, `AQI ${c.aqi}`)),
    pager());

  const render = () => {
    const c = CITIES[ci];
    stage.replaceChildren(
      header(c),
      h("div", { style: { display: "flex", flexDirection: "column", gap: "12px" } },
        hourlyCard(c), dailyCard(c), tilesGrid(c),
        h("div", { style: { textAlign: "center", fontSize: "11px", opacity: ".45", fontWeight: "500", padding: "10px 0 4px" } },
          `Updated ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · NyneSky`)));
    // crossfade du ciel
    const back = skyFront === skyA ? skyB : skyA;
    back.className = "wx-sky wx-" + (c.sky === "rain" ? "rainsky" : c.sky);
    back.replaceChildren(...skyDecor(c.sky));
    back.classList.add("on");
    skyFront.classList.remove("on");
    skyFront = back;
  };

  const topbar = h("div", { style: { position: "absolute", top: "54px", right: "20px", zIndex: "60", display: "flex", gap: "8px" } },
    h("button", { class: "g-btn pressable", style: { padding: "10px", borderRadius: "50%", display: "flex" }, onClick: () => setSheet(true) }, svgIcon(I.list, "", 17)),
    h("button", { class: "g-btn pressable", style: { padding: "10px", borderRadius: "50%", display: "flex" }, onClick: () => shell.closeApp() }, svgIcon(I.x, "", 17)));

  root.append(skyA, skyB, stage, topbar, sheetBg, sheet);
  render();
  return root;
}
