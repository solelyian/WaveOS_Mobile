// WeatherApp.tsx — Météo façon HarmonyOS : ciel immersif par condition,
// température géante, courbes lisses (horaire + 7 jours), jauges, sheet villes.
// Les keyframes météo sont injectées en <style> depuis ce module TS.
import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Icon } from "../Icon";
import type { IconName } from "../../core/lucide";
import { host } from "../host";
import { domOf, Spring, SPRINGS, onFrame } from "../fx";

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
    hourly: [H("Now", "sun", 72), H("1PM", "sun", 73), H("2PM", "sun", 75), H("3PM", "sun", 76), H("4PM", "cloudSun", 75), H("5PM", "cloudSun", 73), H("6PM", "cloudSun", 71), H("7PM", "cloudMoon", 69), H("8PM", "moon", 68), H("9PM", "moon", 67)],
    daily: [D("Today", "sun", 62, 76), D("Tue", "sun", 63, 78), D("Wed", "cloudSun", 64, 77), D("Thu", "cloudy", 65, 72, 20), D("Fri", "cloudSun", 64, 74), D("Sat", "sun", 63, 79), D("Sun", "sun", 62, 80)],
    uv: { v: 4, label: "Moderate" }, humidity: 48, dew: 54,
    wind: { deg: 315, dir: "NW", speed: 12 }, vis: "10 mi",
    feels: 75, feelsNote: "Sun is making it feel warmer",
    precip: "0 in", precipNote: "None expected today",
    sunrise: "7:12 AM", sunset: "6:44 PM", sunPos: 0.55, dayLen: "11h 32m",
  },
  {
    name: "New York", country: "United States", cond: "Cloudy",
    temp: 58, hi: 61, lo: 49,
    aqi: 41, aqiLabel: "Good", aqiColor: "#4ade80", sky: "cloudy",
    hourly: [H("Now", "cloudy", 58), H("1PM", "cloudy", 59), H("2PM", "cloudSun", 60), H("3PM", "cloudy", 61), H("4PM", "cloudy", 60), H("5PM", "cloudy", 59), H("6PM", "cloudMoon", 57), H("7PM", "cloudMoon", 55), H("8PM", "cloudMoon", 54), H("9PM", "cloudMoon", 53)],
    daily: [D("Today", "cloudy", 49, 61), D("Tue", "cloudRain", 50, 58, 70), D("Wed", "cloudRain", 48, 56, 60), D("Thu", "cloudy", 47, 60), D("Fri", "cloudSun", 49, 63), D("Sat", "sun", 50, 65), D("Sun", "cloudSun", 52, 64)],
    uv: { v: 2, label: "Low" }, humidity: 61, dew: 45,
    wind: { deg: 45, dir: "NE", speed: 8 }, vis: "8 mi",
    feels: 56, feelsNote: "Wind is making it feel cooler",
    precip: "0.1 in", precipNote: "Rain expected tomorrow",
    sunrise: "6:58 AM", sunset: "6:18 PM", sunPos: 0.6, dayLen: "11h 20m",
  },
  {
    name: "Paris", country: "France", cond: "Light Rain",
    temp: 54, hi: 57, lo: 48,
    aqi: 28, aqiLabel: "Good", aqiColor: "#4ade80", sky: "rain",
    hourly: [H("Now", "cloudRain", 54), H("7PM", "cloudRain", 54), H("8PM", "cloudRain", 53), H("9PM", "cloudRain", 53), H("10PM", "cloudy", 52), H("11PM", "cloudy", 51), H("12AM", "cloudy", 50), H("1AM", "cloudRain", 50), H("2AM", "cloudRain", 49), H("3AM", "cloudRain", 49)],
    daily: [D("Today", "cloudRain", 48, 57, 90), D("Tue", "cloudRain", 47, 55, 80), D("Wed", "cloudy", 46, 58, 30), D("Thu", "cloudSun", 47, 61), D("Fri", "cloudSun", 48, 62), D("Sat", "cloudy", 49, 60, 20), D("Sun", "cloudRain", 48, 57, 60)],
    uv: { v: 1, label: "Low" }, humidity: 87, dew: 50,
    wind: { deg: 225, dir: "SW", speed: 14 }, vis: "4 mi",
    feels: 51, feelsNote: "Rain is making it feel cooler",
    precip: "0.33 in", precipNote: "0.1 in expected in the next 24h",
    sunrise: "8:12 AM", sunset: "7:02 PM", sunPos: 0.78, dayLen: "10h 50m",
  },
  {
    name: "Tokyo", country: "Japan", cond: "Clear Night",
    temp: 66, hi: 73, lo: 59,
    aqi: 55, aqiLabel: "Moderate", aqiColor: "#facc15", sky: "night",
    hourly: [H("Now", "moon", 66), H("4AM", "moon", 65), H("5AM", "cloudMoon", 64), H("6AM", "cloudMoon", 64), H("7AM", "cloudSun", 65), H("8AM", "sun", 67), H("9AM", "sun", 69), H("10AM", "sun", 71), H("11AM", "sun", 72), H("12PM", "cloudSun", 73)],
    daily: [D("Today", "sun", 59, 73), D("Tue", "sun", 60, 74), D("Wed", "cloudSun", 60, 72), D("Thu", "cloudy", 59, 70, 20), D("Fri", "cloudSun", 58, 71), D("Sat", "sun", 57, 75), D("Sun", "sun", 58, 76)],
    uv: { v: 0, label: "Low" }, humidity: 72, dew: 57,
    wind: { deg: 90, dir: "E", speed: 5 }, vis: "9 mi",
    feels: 66, feelsNote: "Similar to the actual temperature",
    precip: "0 in", precipNote: "None expected in the next 10 days",
    sunrise: "5:38 AM", sunset: "5:21 PM", sunPos: 0.06, dayLen: "11h 43m",
  },
  {
    name: "Dubai", country: "UAE", cond: "Sunny",
    temp: 97, hi: 104, lo: 86,
    aqi: 88, aqiLabel: "Moderate", aqiColor: "#facc15", sky: "heat",
    hourly: [H("Now", "sun", 97), H("1PM", "sun", 99), H("2PM", "sun", 101), H("3PM", "sun", 103), H("4PM", "sun", 104), H("5PM", "sun", 103), H("6PM", "sun", 101), H("7PM", "sun", 98), H("8PM", "sun", 95), H("9PM", "sun", 93)],
    daily: [D("Today", "sun", 86, 104), D("Tue", "sun", 87, 105), D("Wed", "sun", 88, 106), D("Thu", "sun", 87, 105), D("Fri", "cloudSun", 86, 103), D("Sat", "sun", 85, 102), D("Sun", "sun", 84, 101)],
    uv: { v: 11, label: "Extreme" }, humidity: 22, dew: 49,
    wind: { deg: 315, dir: "NW", speed: 9 }, vis: "10 mi",
    feels: 101, feelsNote: "Extreme heat — stay hydrated",
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

/* keyframes + orbes/nuages/pluie — injectés une fois (TS, pas de .css). */
let cssDone = false;
function wxCss() {
  if (cssDone) return;
  cssDone = true;
  const st = document.createElement("style");
  st.textContent = `
@keyframes wxpulse { to { transform: scale(1.14); } }
@keyframes wxdrift { from { transform: translateX(-280px); } to { transform: translateX(560px); } }
@keyframes wxtwinkle { from { opacity: .12; } to { opacity: .9; } }
@keyframes wxfall { to { background-position: -60px 140px; } }
.wx-orb { position: absolute; top: -80px; right: -80px; width: 300px; height: 300px; border-radius: 50%; pointer-events: none; }
.wx-orb.sun { background: radial-gradient(circle,rgba(255,240,190,.95),rgba(255,205,90,.4) 55%,transparent 72%); filter: blur(28px); animation: wxpulse 9s ease-in-out infinite alternate; }
.wx-orb.sun.hot { background: radial-gradient(circle,rgba(255,220,150,1),rgba(255,160,60,.45) 55%,transparent 72%); }
.wx-orb.moon { width: 150px; height: 150px; top: 44px; right: 44px; background: radial-gradient(circle,rgba(235,243,255,.95),rgba(170,200,255,.3) 55%,transparent 72%); filter: blur(16px); }
.wx-cl { position: absolute; left: 0; background: rgba(255,255,255,.55); border-radius: 999px; filter: blur(26px); animation: wxdrift linear infinite; }
.wx-cl.dk { background: rgba(20,28,44,.55); }
.wx-star { position: absolute; border-radius: 50%; background: #fff; animation: wxtwinkle ease-in-out infinite alternate; }
.wx-rainfall { position: absolute; top: -60px; left: 0; right: 0; bottom: 0; background-image: repeating-linear-gradient(100deg, transparent 0 8px, rgba(255,255,255,.12) 8px 9px, transparent 9px 20px); background-size: 200% 140px; animation: wxfall .9s linear infinite; }`;
  document.head.append(st);
}

function Html({ html, style }: { html: string; style?: object }) {
  return <View style={style} nativeID={undefined}><span dangerouslySetInnerHTML={{ __html: html }} /></View>;
}

const Lab = ({ icon, txt }: { icon: IconName; txt: string }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, opacity: 0.6 }}>
    <Icon n={icon} size={13} color="#fff" />
    <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 0.9, textTransform: "uppercase", color: "#fff" }}>{txt}</Text>
  </View>
);

/* ------------------------------ ciel immersif ------------------------------ */

const SKY_BG: Record<Sky, string> = {
  day: "linear-gradient(180deg,#3385d3 0%,#5ea7e2 42%,#a3cdf0 100%)",
  heat: "linear-gradient(180deg,#b96a24 0%,#de9648 45%,#efc88d 100%)",
  cloudy: "linear-gradient(180deg,#46586e 0%,#70849e 55%,#98abc0 100%)",
  rain: "linear-gradient(180deg,#2c3949 0%,#48596f 55%,#61738a 100%)",
  night: "linear-gradient(180deg,#050918 0%,#0e1733 55%,#1a2a52 100%)",
};

function SkyLayer({ sky, on }: { sky: Sky; on: boolean }) {
  const ref = React.useRef<View>(null);
  React.useEffect(() => {
    const el = domOf(ref); if (!el) return;
    el.style.background = SKY_BG[sky];
    el.style.transition = "opacity .9s ease";
    el.style.opacity = on ? "1" : "0";
    // décor (orbes/nuages/étoiles/pluie) en DOM brut
    el.innerHTML = "";
    const mk = (cls: string, css: string) => {
      const d = document.createElement("div");
      d.className = cls; d.style.cssText += css;
      return d;
    };
    const cloud = (top: string, w: number, dur: number, op: number, dark = false) =>
      mk("wx-cl" + (dark ? " dk" : ""), `top:${top};width:${w}px;height:${w * 0.34}px;animation-duration:${dur}s;opacity:${op}`);
    switch (sky) {
      case "day": el.append(mk("wx-orb sun", ""), cloud("18%", 190, 95, 0.35), cloud("42%", 130, 130, 0.22)); break;
      case "heat": el.append(mk("wx-orb sun hot", ""), cloud("30%", 150, 140, 0.16)); break;
      case "cloudy": el.append(cloud("8%", 240, 80, 0.5, true), cloud("22%", 200, 105, 0.45), cloud("40%", 160, 125, 0.35), cloud("60%", 210, 150, 0.3, true)); break;
      case "rain": el.append(cloud("4%", 260, 90, 0.6, true), cloud("16%", 220, 110, 0.5, true), mk("wx-rainfall", "")); break;
      case "night": {
        el.append(mk("wx-orb moon", ""), cloud("52%", 150, 160, 0.1, true));
        for (let i = 0; i < 46; i++) {
          const s = 1 + Math.random() * 1.6;
          el.append(mk("wx-star", `left:${Math.random() * 96}%;top:${Math.random() * 58}%;width:${s}px;height:${s}px;animation-duration:${2.2 + Math.random() * 3.4}s;animation-delay:${Math.random() * 4}s`));
        }
        break;
      }
    }
  }, [sky, on]);
  return <View ref={ref} style={StyleSheet.absoluteFill as object} pointerEvents="none" />;
}

/* ------------------------------ cartes ------------------------------ */

const card: object = {
  backgroundColor: "rgba(255,255,255,.13)", borderWidth: 1, borderColor: "rgba(255,255,255,.2)",
  borderRadius: 24, paddingVertical: 14, paddingHorizontal: 18, paddingBottom: 16,
};
const tile: object = { ...card, minHeight: 148 };

function HourlyCard({ c }: { c: City }) {
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
  return (
    <View style={card}>
      <Lab icon="clock" txt="Hourly Forecast" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18 }} contentContainerStyle={{ paddingHorizontal: 18 }}>
        <View style={{ width: W }}>
          <View style={{ flexDirection: "row", paddingTop: 14, paddingBottom: 8 }}>
            {c.hourly.map((x, i) => (
              <View key={i} style={{ width: CW, alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: "500", color: "rgba(255,255,255,.85)" }}>{x.t}</Text>
                <Icon n={x.icon} size={20} color="rgba(255,255,255,.95)" />
              </View>
            ))}
          </View>
          <Html html={svg} />
        </View>
      </ScrollView>
    </View>
  );
}

function DailyCard({ c }: { c: City }) {
  const CW = 46, n = c.daily.length, W = CW * n, SH = 118, pad = 24;
  const los = c.daily.map((d) => d.lo), his = c.daily.map((d) => d.hi);
  const mn = Math.min(...los) - 2, mx = Math.max(...his) + 2;
  const y = (t: number) => pad + ((mx - t) / (mx - mn)) * (SH - pad * 2);
  const hiPts = c.daily.map((d, i): [number, number] => [i * CW + CW / 2, y(d.hi)]);
  const loPts = c.daily.map((d, i): [number, number] => [i * CW + CW / 2, y(d.lo)]);
  const hiLine = smooth(hiPts), loLine = smooth(loPts);
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
  return (
    <View style={card}>
      <Lab icon="calendar" txt="7-Day Forecast" />
      <View style={{ alignItems: "center" }}>
        <View style={{ width: W }}>
          <View style={{ flexDirection: "row", paddingTop: 14, paddingBottom: 4 }}>
            {c.daily.map((d, i) => (
              <View key={i} style={{ width: CW, alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,.9)" }}>{d.d}</Text>
                <Icon n={d.icon} size={19} color="#fff" />
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#7cc4ff", height: 12 }}>{d.pp ? `${d.pp}%` : ""}</Text>
              </View>
            ))}
          </View>
          <Html html={svg} />
        </View>
      </View>
    </View>
  );
}

function ArcGauge({ frac, color, grad, big, sub, full }: {
  frac: number; color?: string; grad?: [string, string][]; big: string; sub: string; full?: boolean;
}) {
  const cx = 60, cy = 64, r = 44;
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const dotA = Math.PI * (1 - Math.min(1, Math.max(0, frac)));
  const dx = cx + r * Math.cos(dotA), dy = cy - r * Math.sin(dotA);
  const g = gid("wxa");
  const stroke = grad ? `url(#${g})` : color!;
  const defs = grad ? `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0">${grad.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient></defs>` : "";
  const svg = `<svg width="120" height="74" viewBox="0 0 120 74" style="display:block;margin:0 auto">
    ${defs}
    <path d="${arc}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="7" stroke-linecap="round"/>
    <path d="${arc}" fill="none" stroke="${stroke}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${Math.PI * r}" stroke-dashoffset="${full ? 0 : Math.PI * r * (1 - Math.min(1, Math.max(0, frac)))}"/>
    <circle cx="${dx}" cy="${dy}" r="5" fill="#fff" stroke="rgba(0,0,0,.15)" stroke-width="1.5"/>
  </svg>`;
  return (
    <View style={{ flex: 1 }}>
      <Html html={svg} />
      <View style={{ alignItems: "center", marginTop: -6 }}>
        <Text style={{ fontSize: 26, fontWeight: "600", color: "#fff", lineHeight: 28 }}>{big}</Text>
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,.65)", fontWeight: "500", marginTop: 2 }}>{sub}</Text>
      </View>
    </View>
  );
}

function SunTile({ c }: { c: City }) {
  const cx = 60, cy = 66, r = 44;
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const a = Math.PI * (1 - c.sunPos);
  const sx = cx + r * Math.cos(a), sy = cy - r * Math.sin(a);
  const svg = `<svg width="120" height="80" viewBox="0 0 120 80" style="display:block;margin:2px auto 0">
    <line x1="8" y1="${cy}" x2="112" y2="${cy}" stroke="rgba(255,255,255,.4)" stroke-width="1.5"/>
    <path d="${arc}" stroke="rgba(255,255,255,.35)" stroke-width="1.5" stroke-dasharray="2 5" fill="none"/>
    <circle cx="${sx}" cy="${sy}" r="9" fill="#ffd76a" opacity=".3"/>
    <circle cx="${sx}" cy="${sy}" r="4.5" fill="#ffd76a"/>
    <circle cx="${cx - r}" cy="${cy}" r="2.5" fill="#fff" opacity=".7"/>
    <circle cx="${cx + r}" cy="${cy}" r="2.5" fill="#fff" opacity=".7"/>
  </svg>`;
  return (
    <View style={tile}>
      <Lab icon="sunrise" txt="Sun" />
      <Html html={svg} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
        <Text style={ws.small}>{c.sunrise}</Text><Text style={ws.small}>{c.sunset}</Text>
      </View>
      <Text style={{ fontSize: 11, color: "rgba(255,255,255,.55)", textAlign: "center", marginTop: 4 }}>Day length {c.dayLen}</Text>
    </View>
  );
}

function WindTile({ c }: { c: City }) {
  const cx = 55, cy = 46, r = 30;
  const ticks = [["N", cx, cy - r - 6], ["E", cx + r + 8, cy + 4], ["S", cx, cy + r + 14], ["W", cx - r - 8, cy + 4]]
    .map(([t, x, y]) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="9" font-weight="700" fill="rgba(255,255,255,.6)">${t}</text>`).join("");
  const svg = `<svg width="110" height="92" viewBox="0 0 110 92" style="display:block;margin:0 auto">
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="rgba(255,255,255,.2)" stroke-width="1.5" fill="rgba(255,255,255,.05)"/>
    ${ticks}
    <path d="M${cx} ${cy - r + 4} L${cx + 5} ${cy + 5} L${cx} ${cy} L${cx - 5} ${cy + 5} Z" fill="#fff" transform="rotate(${c.wind.deg} ${cx} ${cy})"/>
    <circle cx="${cx}" cy="${cy}" r="3" fill="#fff"/>
  </svg>`;
  return (
    <View style={tile}>
      <Lab icon="wind" txt="Wind" />
      <Html html={svg} />
      <View style={{ alignItems: "center", marginTop: -4 }}>
        <Text style={{ fontSize: 22, fontWeight: "600", color: "#fff", lineHeight: 24 }}>{c.wind.speed} mph</Text>
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,.65)", fontWeight: "500", marginTop: 2 }}>{c.wind.dir} wind</Text>
      </View>
    </View>
  );
}

const MiniTile = ({ icon, label, big, sub }: { icon: IconName; label: string; big: string; sub: string }) => (
  <View style={tile}>
    <Lab icon={icon} txt={label} />
    <View style={{ flex: 1, justifyContent: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "500", color: "#fff", lineHeight: 31 }}>{big}</Text>
      <Text style={{ fontSize: 12, color: "rgba(255,255,255,.65)", fontWeight: "500", marginTop: 4, lineHeight: 16 }}>{sub}</Text>
    </View>
  </View>
);

/* ------------------------------ app ------------------------------ */

export function WeatherApp() {
  const [ci, setCi] = React.useState(0);
  const [sheet, setSheet] = React.useState(false);
  const c = CITIES[ci];
  wxCss();

  const sheetRef = React.useRef<View>(null);
  const sp = React.useMemo(() => new Spring(103, SPRINGS.shade[0], SPRINGS.shade[1]), []);
  React.useEffect(() => { sp.to(sheet ? 0 : 103); }, [sheet, sp]);
  React.useEffect(() => {
    const off = onFrame((dt) => {
      const el = domOf(sheetRef); if (!el) return;
      sp.step(dt);
      el.style.transform = `translateY(${sp.v}%)`;
      el.style.visibility = sp.v > 100 && sp.settled ? "hidden" : "visible";
    });
    return () => { off(); };
  }, [sp]);

  return (
    <View style={ws.root}>
      <SkyLayer sky={c.sky} on />
      <ScrollView style={{ flex: 1, zIndex: 10 }} contentContainerStyle={{ paddingTop: 74, paddingHorizontal: 20, paddingBottom: 110 }} nativeID="app-scroll">
        <View style={{ marginBottom: 26 }}>
          <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 7 }} onPress={() => setSheet(true)}>
            <Icon n="mapPin" size={15} color="#fff" />
            <Text style={{ fontSize: 17, fontWeight: "500", letterSpacing: 0.3, color: "#fff" }}>{c.name}</Text>
            <Icon n="chevronDown" size={14} color="#fff" />
          </Pressable>
          <Text style={{ fontSize: 128, lineHeight: 122, fontWeight: "100", letterSpacing: -6, marginTop: 6, marginLeft: -6, color: "#fff" }}>{c.temp}°</Text>
          <Text style={{ fontSize: 19, fontWeight: "500", color: "rgba(255,255,255,.92)", marginTop: 6 }}>{c.cond}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: "500", color: "rgba(255,255,255,.85)" }}>H:{c.hi}°  L:{c.lo}°</Text>
            <Text style={{ fontSize: 12, fontWeight: "700", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(255,255,255,.2)", color: "#fff" }}>AQI {c.aqi}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 14 }}>
            {CITIES.map((_, i) => (
              <Pressable key={i} onPress={() => setCi(i)}
                style={{ width: i === ci ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === ci ? "#fff" : "rgba(255,255,255,.45)" }} />
            ))}
          </View>
        </View>
        <View style={{ gap: 12 }}>
          <HourlyCard c={c} />
          <DailyCard c={c} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <View style={[tile, { width: "47.5%" }]}>
              <Lab icon="sun" txt="UV Index" />
              <ArcGauge frac={c.uv.v / 11} grad={[["0", "#4ade80"], ["0.35", "#a3e635"], ["0.55", "#facc15"], ["0.75", "#fb923c"], ["0.9", "#ef4444"], ["1", "#a855f7"]]} big={`${c.uv.v}`} sub={c.uv.label} full />
            </View>
            <View style={{ width: "47.5%" }}><SunTile c={c} /></View>
            <View style={[tile, { width: "47.5%" }]}>
              <Lab icon="gauge" txt="Air Quality" />
              <ArcGauge frac={Math.min(1, c.aqi / 150)} color={c.aqiColor} big={`${c.aqi}`} sub={c.aqiLabel} />
            </View>
            <View style={{ width: "47.5%" }}><WindTile c={c} /></View>
            <View style={{ width: "47.5%" }}><MiniTile icon="thermometer" label="Feels Like" big={`${c.feels}°`} sub={c.feelsNote} /></View>
            <View style={{ width: "47.5%" }}><MiniTile icon="droplets" label="Humidity" big={`${c.humidity}%`} sub={`Dew point ${c.dew}°`} /></View>
            <View style={{ width: "47.5%" }}><MiniTile icon="eye" label="Visibility" big={c.vis} sub="Perfectly clear view" /></View>
            <View style={{ width: "47.5%" }}><MiniTile icon="umbrella" label="Precipitation" big={c.precip} sub={c.precipNote} /></View>
          </View>
          <Text style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,.45)", fontWeight: "500", paddingVertical: 10 }}>
            Updated {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · NyneSky
          </Text>
        </View>
      </ScrollView>
      <View style={ws.topbar}>
        <Pressable style={ws.tbtn} onPress={() => setSheet(true)}><Icon n="list" size={17} color="#fff" /></Pressable>
        <Pressable style={ws.tbtn} onPress={() => host.closeApp()}><Icon n="x" size={17} color="#fff" /></Pressable>
      </View>
      {sheet && <Pressable style={ws.sheetBg} onPress={() => setSheet(false)} />}
      <View ref={sheetRef} style={ws.sheet}>
        <View style={{ alignItems: "center", paddingVertical: 6, paddingBottom: 14 }}>
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,.35)" }} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingHorizontal: 8, paddingBottom: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>Cities</Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,.5)", fontWeight: "500" }}>{CITIES.length} places</Text>
        </View>
        <ScrollView nativeID="app-scroll">
          {CITIES.map((ct, i) => (
            <Pressable key={i} onPress={() => { setCi(i); setSheet(false); }}
              style={[ws.cityRow, i === ci && ws.cityOn]}>
              <Icon n={i === 0 ? "navigation" : "mapPin"} size={16} color="#fff" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>{ct.name}</Text>
                  {i === 0 && <Text style={{ fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,.55)", marginLeft: 8 }}>My Location</Text>}
                </View>
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,.55)", fontWeight: "500" }}>{ct.cond}</Text>
              </View>
              <Icon n={ct.hourly[0].icon} size={20} color="#fff" />
              <Text style={{ fontSize: 22, fontWeight: "300", color: "#fff", width: 44, textAlign: "right" }}>{ct.temp}°</Text>
              <View style={{ width: 16 }}>{i === ci && <Icon n="check" size={16} color="#fff" />}</View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const ws = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0e1a", overflow: "hidden" },
  small: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,.9)" },
  topbar: { position: "absolute", top: 54, right: 20, zIndex: 60, flexDirection: "row", gap: 8 } as object,
  tbtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,.16)" } as object,
  sheetBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 80, backgroundColor: "rgba(4,6,12,.4)" } as object,
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 90,
    backgroundColor: "rgba(16,22,34,.86)", borderTopLeftRadius: 26, borderTopRightRadius: 26,
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,.16)",
    paddingTop: 10, paddingHorizontal: 16, paddingBottom: 44, maxHeight: "66%" as unknown as number,
  } as object,
  cityRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 18, marginBottom: 6,
    backgroundColor: "rgba(255,255,255,.05)", borderWidth: 1, borderColor: "transparent",
  } as object,
  cityOn: { backgroundColor: "rgba(255,255,255,.16)", borderColor: "rgba(255,255,255,.3)" } as object,
});
