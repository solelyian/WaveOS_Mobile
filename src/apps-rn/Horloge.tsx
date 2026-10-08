// Horloge.tsx — quatre onglets réels : horloge mondiale (fuseaux en
// direct), alarmes (interrupteurs), chronomètre (start/tour/reset, temps
// réel), minuteur (durées + décompte + barre de progression).
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { createStore, fs, Nav, TabBar, Tg, useStore, useTheme } from "../rn";

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const fmtCS = (s: number) => `${fmt(s)}.${String(Math.floor((s % 1) * 100)).padStart(2, "0")}`;

/* ---------- horloge mondiale ---------- */

const CITIES = [
  ["Paris", "Europe/Paris"], ["New York", "America/New_York"],
  ["Tokyo", "Asia/Tokyo"], ["Montréal", "America/Toronto"], ["Sydney", "Australia/Sydney"],
] as const;

function timeIn(tz: string): string {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: tz });
}

function Monde(): ReactNode {
  const p = useTheme();
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(n => n + 1), 15000); return () => clearInterval(t); }, []);
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
      <View style={{ backgroundColor: p.card, borderRadius: 18, overflow: "hidden", borderWidth: 0.5, borderColor: p.sep }}>
        {CITIES.map(([n, tz], i) => (
          <View key={n} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: i === CITIES.length - 1 ? 0 : 0.5, borderBottomColor: p.sep }}>
            <Text style={{ flex: 1, fontSize: fs(16, p), fontWeight: "600", color: p.text }}>{n}</Text>
            <Text style={{ fontSize: fs(22, p), color: p.text, fontVariant: ["tabular-nums" as never] }}>{timeIn(tz)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/* ---------- alarmes ---------- */

const alarms = createStore([
  { t: "06:45", label: "Sport", on: true, days: "Lu–Ve" },
  { t: "07:30", label: "Réveil", on: true, days: "Tous les jours" },
  { t: "08:15", label: "Départ", on: false, days: "Lu–Ve" },
  { t: "12:30", label: "Déjeuner équipe", on: false, days: "Jeu" },
]);

function Alarmes(): ReactNode {
  const p = useTheme();
  const list = useStore(alarms);
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
      <View style={{ backgroundColor: p.card, borderRadius: 18, overflow: "hidden", borderWidth: 0.5, borderColor: p.sep }}>
        {list.map((a, i) => (
          <View key={a.t + a.label} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: i === list.length - 1 ? 0 : 0.5, borderBottomColor: p.sep }}>
            <View style={{ flex: 1, opacity: a.on ? 1 : 0.45 }}>
              <Text style={{ fontSize: fs(30, p), fontWeight: "300", color: p.text, fontVariant: ["tabular-nums" as never] }}>{a.t}</Text>
              <Text style={{ fontSize: fs(12.5, p), color: p.sub }}>{a.label} · {a.days}</Text>
            </View>
            <Tg v={a.on} onChange={() => alarms.set(ls => ls.map(x => x === a ? { ...x, on: !x.on } : x))} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/* ---------- chronomètre ---------- */

function Chrono(): ReactNode {
  const p = useTheme();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const t0 = useRef(0);
  const acc = useRef(0);
  useEffect(() => {
    if (!running) return;
    t0.current = performance.now();
    const t = setInterval(() => setElapsed(acc.current + (performance.now() - t0.current) / 1000), 31);
    return () => clearInterval(t);
  }, [running]);
  const lap = () => setLaps(l => [elapsed - (l[0] ?? 0), ...l]);
  const reset = () => { acc.current = 0; setElapsed(0); setLaps([]); setRunning(false); };
  return (
    <View style={{ flex: 1, alignItems: "center", paddingTop: 40 }}>
      <Text style={{ fontSize: fs(64, p), fontWeight: "200", color: p.text, fontVariant: ["tabular-nums" as never] }}>{fmtCS(elapsed)}</Text>
      <View style={{ flexDirection: "row", gap: 40, marginTop: 26 }}>
        <Pressable onPress={running ? lap : reset} style={{
          width: 78, height: 78, borderRadius: 39, backgroundColor: p.field, alignItems: "center", justifyContent: "center",
        }}>
          <Text style={{ fontSize: fs(15, p), color: p.text }}>{running ? "Tour" : "Reset"}</Text>
        </Pressable>
        <Pressable onPress={() => {
          if (running) acc.current = elapsed;
          setRunning(r => !r);
        }} style={{
          width: 78, height: 78, borderRadius: 39, alignItems: "center", justifyContent: "center",
          backgroundColor: running ? "rgba(255,107,87,.16)" : "rgba(47,204,146,.16)",
        }}>
          <Text style={{ fontSize: fs(15, p), fontWeight: "600", color: running ? p.corail : p.jade }}>{running ? "Stop" : "Start"}</Text>
        </Pressable>
      </View>
      <ScrollView style={{ flex: 1, width: "100%", marginTop: 24 }} contentContainerStyle={{ paddingHorizontal: 30 }}>
        {laps.map((l, i) => (
          <View key={i} style={{ flexDirection: "row", paddingVertical: 9, borderTopWidth: 0.5, borderTopColor: p.sep }}>
            <Text style={{ fontSize: fs(14, p), color: p.sub }}>Tour {laps.length - i}</Text>
            <Text style={{ flex: 1, textAlign: "right", fontSize: fs(14, p), color: p.text, fontVariant: ["tabular-nums" as never] }}>{fmtCS(l)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* ---------- minuteur ---------- */

function Minuteur(): ReactNode {
  const p = useTheme();
  const [left, setLeft] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setLeft(s => { if (s <= 1) { setRunning(false); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);
  const PRESETS = [60, 180, 300, 600, 900, 1800];
  return (
    <View style={{ flex: 1, alignItems: "center", paddingTop: 34 }}>
      <View style={{ width: 200, height: 200, borderRadius: 100, borderWidth: 6, borderColor: p.field, alignItems: "center", justifyContent: "center", position: "relative" }}>
        <View style={{
          position: "absolute", inset: -6, borderRadius: 106, borderWidth: 6, borderColor: p.tint,
          borderTopColor: "transparent", borderRightColor: left > 0 ? p.tint : "transparent",
          transform: [{ rotate: "45deg" }], opacity: left > 0 ? 1 : 0,
        }} />
        <Text style={{ fontSize: fs(44, p), fontWeight: "200", color: p.text, fontVariant: ["tabular-nums" as never] }}>{fmt(left)}</Text>
      </View>
      {!running && left === 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 30, paddingHorizontal: 30 }}>
          {PRESETS.map(s => (
            <Pressable key={s} onPress={() => { setLeft(s); setRunning(true); }} style={{
              paddingVertical: 9, paddingHorizontal: 18, borderRadius: 20, backgroundColor: p.field,
            }}>
              <Text style={{ fontSize: fs(14, p), fontWeight: "600", color: p.tint }}>{s >= 60 ? `${s / 60} min` : `${s} s`}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: 16, marginTop: 30 }}>
          <Pressable onPress={() => { setLeft(0); setRunning(false); }} style={{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 22, backgroundColor: p.field }}>
            <Text style={{ fontSize: fs(14, p), color: p.text }}>Annuler</Text>
          </Pressable>
          <Pressable onPress={() => setRunning(r => !r)} style={{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 22, backgroundColor: p.tint }}>
            <Text style={{ fontSize: fs(14, p), fontWeight: "600", color: "#fff" }}>{running ? "Pause" : "Reprendre"}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function HorlogeApp(): ReactNode {
  const p = useTheme();
  const [tab, setTab] = useState(0);
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav large={["Horloge", "Alarmes", "Chronomètre", "Minuteur"][tab]} />
      <View style={{ flex: 1 }}>
        {tab === 0 ? <Monde /> : tab === 1 ? <Alarmes /> : tab === 2 ? <Chrono /> : <Minuteur />}
      </View>
      <TabBar
        items={[
          { icon: "globe", label: "Horloge" },
          { icon: "alarm-clock", label: "Alarmes" },
          { icon: "timer", label: "Chrono" },
          { icon: "hourglass", label: "Minuteur" },
        ]}
        idx={tab} onChange={setTab}
      />
    </View>
  );
}
