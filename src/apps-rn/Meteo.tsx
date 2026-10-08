// Meteo.tsx — météo complète : hero ville (grande température, condition,
// plage), bande horaire défilable, prévisions 10 jours avec barres de plage,
// grille de détails (vent, humidité, UV, lever/coucher), liste de villes
// poussée sur la stack. 100 % React Native.
import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { fs, Group, Icon, Nav, StackNav, useStack, useTheme } from "../rn";

interface Hour { h: string; ic: string; t: number }
interface Day { d: string; ic: string; lo: number; hi: number; rain?: number }
interface City {
  name: string; country: string; cond: string; t: number; lo: number; hi: number;
  ic: string; hours: Hour[]; days: Day[]; hum: number; wind: number; uv: number; vis: number;
}

const H = (hs: [string, string, number][]): Hour[] => hs.map(([h, ic, t]) => ({ h, ic, t }));

const CITIES: City[] = [
  {
    name: "Paris", country: "France", cond: "Éclaircies", t: 19, lo: 11, hi: 21, ic: "cloud-sun",
    hours: H([["19h", "cloud-sun", 19], ["20h", "cloud-sun", 18], ["21h", "moon", 17], ["22h", "moon", 16], ["23h", "moon", 15], ["0h", "moon", 14], ["1h", "moon", 13], ["2h", "moon", 13], ["3h", "moon", 12], ["4h", "moon", 12], ["5h", "moon", 11], ["6h", "sunrise", 11], ["7h", "cloud-sun", 12], ["8h", "cloud-sun", 14]]),
    days: [
      { d: "Auj.", ic: "cloud-sun", lo: 11, hi: 21 },
      { d: "Mer.", ic: "sun", lo: 13, hi: 24 },
      { d: "Jeu.", ic: "sun", lo: 14, hi: 26 },
      { d: "Ven.", ic: "cloud-drizzle", lo: 15, hi: 22, rain: 40 },
      { d: "Sam.", ic: "cloud", lo: 14, hi: 20, rain: 20 },
      { d: "Dim.", ic: "cloud-sun", lo: 13, hi: 23 },
      { d: "Lun.", ic: "sun", lo: 15, hi: 25 },
      { d: "Mar.", ic: "cloud-sun", lo: 14, hi: 24 },
      { d: "Mer.", ic: "cloud-rain", lo: 13, hi: 19, rain: 60 },
      { d: "Jeu.", ic: "cloud-sun", lo: 12, hi: 21 },
    ],
    hum: 62, wind: 14, uv: 5, vis: 24,
  },
  {
    name: "Lyon", country: "France", cond: "Ensoleillé", t: 24, lo: 14, hi: 26, ic: "sun",
    hours: H([["19h", "sun", 24], ["20h", "sun", 23], ["21h", "moon", 21], ["22h", "moon", 20], ["23h", "moon", 19], ["0h", "moon", 17], ["1h", "moon", 16], ["2h", "moon", 16], ["3h", "moon", 15], ["4h", "moon", 15], ["5h", "moon", 14], ["6h", "sunrise", 14], ["7h", "sun", 16], ["8h", "sun", 18]]),
    days: [
      { d: "Auj.", ic: "sun", lo: 14, hi: 26 }, { d: "Mer.", ic: "sun", lo: 15, hi: 28 },
      { d: "Jeu.", ic: "cloud-sun", lo: 16, hi: 27 }, { d: "Ven.", ic: "cloud-drizzle", lo: 15, hi: 23, rain: 30 },
      { d: "Sam.", ic: "cloud", lo: 14, hi: 21 }, { d: "Dim.", ic: "cloud-sun", lo: 15, hi: 25 },
      { d: "Lun.", ic: "sun", lo: 16, hi: 27 }, { d: "Mar.", ic: "sun", lo: 16, hi: 28 },
      { d: "Mer.", ic: "cloud-drizzle", lo: 14, hi: 22, rain: 35 }, { d: "Jeu.", ic: "cloud-sun", lo: 13, hi: 23 },
    ],
    hum: 48, wind: 9, uv: 7, vis: 30,
  },
  {
    name: "Montréal", country: "Canada", cond: "Nuageux", t: 14, lo: 8, hi: 16, ic: "cloud",
    hours: H([["14h", "cloud", 14], ["15h", "cloud", 15], ["16h", "cloud-sun", 15], ["17h", "cloud-sun", 14], ["18h", "cloud", 13], ["19h", "cloud", 12], ["20h", "moon", 11], ["21h", "moon", 10], ["22h", "moon", 9], ["23h", "moon", 9], ["0h", "moon", 8], ["1h", "moon", 8]]),
    days: [
      { d: "Auj.", ic: "cloud", lo: 8, hi: 16 }, { d: "Mer.", ic: "cloud-drizzle", lo: 9, hi: 14, rain: 55 },
      { d: "Jeu.", ic: "cloud-rain", lo: 9, hi: 13, rain: 70 }, { d: "Ven.", ic: "cloud-sun", lo: 7, hi: 15 },
      { d: "Sam.", ic: "sun", lo: 6, hi: 17 }, { d: "Dim.", ic: "sun", lo: 8, hi: 19 },
      { d: "Lun.", ic: "cloud-sun", lo: 9, hi: 18 }, { d: "Mar.", ic: "cloud", lo: 10, hi: 16 },
      { d: "Mer.", ic: "cloud-drizzle", lo: 9, hi: 15, rain: 40 }, { d: "Jeu.", ic: "cloud-sun", lo: 8, hi: 17 },
    ],
    hum: 71, wind: 22, uv: 2, vis: 15,
  },
  {
    name: "Tokyo", country: "Japon", cond: "Averses", t: 21, lo: 17, hi: 23, ic: "cloud-drizzle",
    hours: H([["3h", "cloud-drizzle", 21], ["4h", "cloud-drizzle", 20], ["5h", "cloud-drizzle", 20], ["6h", "sunrise", 19], ["7h", "cloud-sun", 20], ["8h", "cloud-sun", 21], ["9h", "sun", 22], ["10h", "sun", 23], ["11h", "sun", 24], ["12h", "cloud-sun", 24], ["13h", "cloud-sun", 24], ["14h", "cloud", 23]]),
    days: [
      { d: "Auj.", ic: "cloud-drizzle", lo: 17, hi: 23, rain: 60 }, { d: "Mer.", ic: "cloud-rain", lo: 18, hi: 22, rain: 80 },
      { d: "Jeu.", ic: "cloud-sun", lo: 17, hi: 24 }, { d: "Ven.", ic: "sun", lo: 18, hi: 26 },
      { d: "Sam.", ic: "sun", lo: 19, hi: 27 }, { d: "Dim.", ic: "cloud-sun", lo: 18, hi: 25 },
      { d: "Lun.", ic: "cloud-drizzle", lo: 17, hi: 22, rain: 45 }, { d: "Mar.", ic: "cloud", lo: 16, hi: 21 },
      { d: "Mer.", ic: "cloud-sun", lo: 16, hi: 23 }, { d: "Jeu.", ic: "sun", lo: 17, hi: 25 },
    ],
    hum: 84, wind: 18, uv: 3, vis: 9,
  },
];

const DETAILS = [
  { ic: "droplets", k: "Humidité", v: (c: City) => `${c.hum} %`, s: () => "Point de rosée 12°" },
  { ic: "wind", k: "Vent", v: (c: City) => `${c.wind} km/h`, s: () => "Rafales 24 km/h" },
  { ic: "sun", k: "Indice UV", v: (c: City) => `${c.uv}`, s: (c: City) => c.uv >= 6 ? "Élevé — protection" : "Modéré" },
  { ic: "eye", k: "Visibilité", v: (c: City) => `${c.vis} km`, s: () => "Ciel dégagé" },
  { ic: "sunrise", k: "Lever", v: () => "6:48", s: () => "Coucher 20:12" },
  { ic: "gauge", k: "Pression", v: () => "1018 hPa", s: () => "Stable" },
];

function Hero({ c }: { c: City }): ReactNode {
  const p = useTheme();
  return (
    <View style={{ alignItems: "center", paddingTop: 64, paddingBottom: 18 }}>
      <Text style={{ fontSize: fs(27, p), fontWeight: "600", color: p.text }}>{c.name}</Text>
      <Text style={{ fontSize: fs(84, p), fontWeight: "200", color: p.text, marginTop: -8, letterSpacing: -2 }}>{c.t}°</Text>
      <Text style={{ fontSize: fs(16.5, p), fontWeight: "500", color: p.sub, marginTop: -8 }}>{c.cond}</Text>
      <Text style={{ fontSize: fs(15.5, p), color: p.sub, marginTop: 2 }}>Max {c.hi}°  Min {c.lo}°</Text>
    </View>
  );
}

function Hourly({ c }: { c: City }): ReactNode {
  const p = useTheme();
  return (
    <Group style={{ paddingVertical: 12 }}>
      <Text style={{ fontSize: fs(11.5, p), fontWeight: "600", color: p.sub, textTransform: "uppercase", letterSpacing: 0.4, paddingHorizontal: 14, marginBottom: 8 }}>
        Heure par heure
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 16 }}>
        {c.hours.map((h, i) => (
          <View key={i} style={{ alignItems: "center", gap: 7, width: 34 }}>
            <Text style={{ fontSize: fs(12, p), fontWeight: i === 0 ? "700" : "500", color: p.text }}>{i === 0 ? "Maint." : h.h}</Text>
            <Icon name={h.ic} size={19} color={h.ic === "sun" || h.ic === "cloud-sun" || h.ic === "sunrise" ? p.ambre : p.sub} sw={1.9} />
            <Text style={{ fontSize: fs(14.5, p), fontWeight: "600", color: p.text }}>{h.t}°</Text>
          </View>
        ))}
      </ScrollView>
    </Group>
  );
}

function Daily({ c }: { c: City }): ReactNode {
  const p = useTheme();
  const min = Math.min(...c.days.map(d => d.lo));
  const max = Math.max(...c.days.map(d => d.hi));
  const rg = max - min || 1;
  return (
    <Group style={{ paddingVertical: 12 }}>
      <Text style={{ fontSize: fs(11.5, p), fontWeight: "600", color: p.sub, textTransform: "uppercase", letterSpacing: 0.4, paddingHorizontal: 14 }}>
        Prévisions à 10 jours
      </Text>
      {c.days.map((d, i) => {
        const l = ((d.lo - min) / rg) * 100, w = ((d.hi - d.lo) / rg) * 100;
        return (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 9, borderTopWidth: i ? 0.5 : 0, borderTopColor: p.sep }}>
            <Text style={{ width: 44, fontSize: fs(14.5, p), fontWeight: "600", color: p.text }}>{d.d}</Text>
            <Icon name={d.ic} size={17} color={d.ic.includes("sun") ? p.ambre : d.ic.includes("rain") || d.ic.includes("drizzle") ? p.tint : p.sub} sw={1.9} />
            {d.rain ? <Text style={{ width: 32, fontSize: fs(10.5, p), fontWeight: "700", color: p.tint }}> {d.rain}%</Text> : <View style={{ width: 32 }} />}
            <Text style={{ width: 34, textAlign: "right", fontSize: fs(14.5, p), color: p.sub }}>{d.lo}°</Text>
            <View style={{ flex: 1, height: 4, marginHorizontal: 10, borderRadius: 2, backgroundColor: p.field, overflow: "hidden" }}>
              <View style={{ position: "absolute", left: `${l}%`, width: `${w}%`, top: 0, bottom: 0, borderRadius: 2, background: `linear-gradient(90deg, ${p.jade}, ${p.ambre})` }} />
            </View>
            <Text style={{ width: 34, textAlign: "right", fontSize: fs(14.5, p), fontWeight: "600", color: p.text }}>{d.hi}°</Text>
          </View>
        );
      })}
    </Group>
  );
}

function DetailGrid({ c }: { c: City }): ReactNode {
  const p = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 8 }}>
      {DETAILS.map(d => (
        <View key={d.k} style={{
          width: "48.5%", borderRadius: 16, padding: 12,
          backgroundColor: p.card, borderWidth: 0.5, borderColor: p.sep,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Icon name={d.ic} size={13} color={p.sub} sw={2.2} />
            <Text style={{ fontSize: fs(11, p), fontWeight: "600", color: p.sub, textTransform: "uppercase", letterSpacing: 0.3 }}>{d.k}</Text>
          </View>
          <Text style={{ fontSize: fs(21, p), fontWeight: "600", color: p.text, marginTop: 6 }}>{d.v(c)}</Text>
          <Text style={{ fontSize: fs(11.5, p), color: p.faint, marginTop: 2 }}>{d.s(c)}</Text>
        </View>
      ))}
    </View>
  );
}

/* ---------- liste des villes ---------- */

function CityList({ onPick }: { onPick: (i: number) => void }): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  const pick = (i: number) => { onPick(i); pop(); };
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav large="Météo" back="" onBack={pop} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        {CITIES.map((c, i) => (
          <Pressable key={c.name} onPress={() => pick(i)} style={({ pressed }) => ({
            borderRadius: 18, marginBottom: 10, padding: 14, flexDirection: "row",
            alignItems: "center", justifyContent: "space-between",
            backgroundColor: pressed ? p.card2 : p.card,
            borderWidth: 0.5, borderColor: p.sep,
          })}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fs(19, p), fontWeight: "600", color: p.text }}>{c.name}</Text>
              <Text style={{ fontSize: fs(12.5, p), color: p.sub, marginTop: 1 }}>{c.country} · {c.cond}</Text>
            </View>
            <Icon name={c.ic} size={20} color={c.ic.includes("sun") ? p.ambre : p.sub} sw={1.9} />
            <Text style={{ fontSize: fs(30, p), fontWeight: "300", color: p.text, width: 58, textAlign: "right" }}>{c.t}°</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

/* ---------- écran principal ---------- */

function MeteoRoot(): ReactNode {
  const p = useTheme();
  const { push } = useStack();
  const [cityIdx, setCityIdx] = useState(0);
  const city = CITIES[cityIdx];
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 26, paddingHorizontal: 16 }}>
        <Hero c={city} />
        <Hourly c={city} />
        <Daily c={city} />
        <DetailGrid c={city} />
      </ScrollView>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: p.sep }}>
        <Pressable onPress={() => push(<CityList onPick={setCityIdx} />)} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Icon name="list" size={19} color={p.tint} sw={2.2} />
          <Text style={{ fontSize: fs(14.5, p), color: p.tint, fontWeight: "500" }}>Villes</Text>
        </Pressable>
        <Text style={{ fontSize: fs(12, p), color: p.faint }}>WaveOS Météo</Text>
      </View>
    </View>
  );
}

export function MeteoApp(): ReactNode {
  return <StackNav root={<MeteoRoot />} />;
}
