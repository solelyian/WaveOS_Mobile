// CalendarApp.tsx — mois courant réel + agenda par jour + bouton Today + « + ».
import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
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
  const [selected, setSelected] = React.useState(NOW.getDate());
  const [, bump] = React.useReducer((x: number) => x + 1, 0);
  const evs = EVENTS.filter((e) => e.day === selected);
  const label = `${MONTH} ${selected}`;

  const addEvent = () => {
    const [bg, fg] = COLORS[EVENTS.length % COLORS.length];
    EVENTS.push({ day: selected, time: SLOTS[EVENTS.length % SLOTS.length], title: "New Event", bg, fg });
    bump();
  };

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < OFFSET; i++) cells.push(<View key={`e${i}`} />);
  for (let i = 1; i <= DIM; i++) {
    const on = i === selected, today = i === NOW.getDate();
    cells.push(
      <Pressable key={i} style={{ width: "14.28%" as unknown as number, alignItems: "center", paddingVertical: 2 }} onPress={() => setSelected(i)}>
        <View style={[cs.cell, on && cs.cellOn]}>
          <Text style={[cs.cellT, on ? { color: "#fff", fontWeight: "700" } : today ? { color: "#ef4444", fontWeight: "700" } : null]}>{i}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f4f4f5" }}>
      <GlassHeader title={MONTH} large action="plus" onAction={addEvent} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }} nativeID="app-scroll">
        <View style={cs.monthCard}>
          <View style={{ flexDirection: "row", marginBottom: 8 }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <Text key={i} style={{ width: "14.28%" as unknown as number, textAlign: "center", fontSize: 12, fontWeight: "700", color: "#9ca3af" }}>{d}</Text>
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>{cells}</View>
        </View>
        <Text style={{ fontWeight: "700", fontSize: 20, paddingHorizontal: 8, marginBottom: 16 }}>
          {selected === NOW.getDate() ? "Today's Schedule" : `Schedule — ${label}`}
        </Text>
        <View style={{ gap: 12 }}>
          {evs.length ? evs.map((e, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 16 }}>
              <Text style={{ width: 64, textAlign: "right", fontSize: 12, fontWeight: "700", color: "#9ca3af", paddingTop: 12 }}>{e.time}</Text>
              <View style={{ flex: 1, padding: 16, borderRadius: 24, backgroundColor: e.bg, borderWidth: 1, borderColor: "#f3f4f6" }}>
                <Text style={{ fontWeight: "700", color: e.fg }}>{e.title}</Text>
                <Text style={{ fontSize: 12, color: e.fg, opacity: 0.7 }}>Google Meet</Text>
              </View>
            </View>
          )) : <Text style={{ textAlign: "center", color: "rgba(0,0,0,.4)", fontSize: 14, paddingVertical: 24 }}>No events</Text>}
        </View>
      </ScrollView>
      <Pressable style={cs.today} onPress={() => setSelected(NOW.getDate())}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>Today</Text>
      </Pressable>
    </View>
  );
}

const cs = StyleSheet.create({
  monthCard: { backgroundColor: "#fff", borderRadius: 32, padding: 16, marginBottom: 24 } as object,
  cell: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18 } as object,
  cellOn: { backgroundColor: "#ef4444", transform: [{ scale: 1.1 }] } as object,
  cellT: { fontSize: 14, fontWeight: "500", color: "#171717" },
  today: {
    position: "absolute", bottom: 112, right: 24,
    paddingVertical: 12, paddingHorizontal: 24, backgroundColor: "#ef4444", borderRadius: 999, zIndex: 40,
  } as object,
});
