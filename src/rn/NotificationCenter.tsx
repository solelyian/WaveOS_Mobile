// NotificationCenter.tsx — shade NC : horloge verre, date, cartes verre, Clear all.
import * as React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { fmtDate } from "../system/state";
import { GlassClock } from "./LockScreen";
import { Icon } from "./Icon";
import { glassStyle } from "./fx";

const NOTIFS: { app: string; icon: string; color: string; title: string; body: string; time: string }[] = [
  { app: "Messages", icon: "messageCircle", color: "#22c55e", title: "Alex Morgan", body: "Look at this — new build is live", time: "now" },
  { app: "Mail", icon: "mail", color: "#2563eb", title: "Nyne Team", body: "Your weekly digest is ready", time: "2m" },
  { app: "Calendar", icon: "calendar", color: "#ef4444", title: "Reminder", body: "Design Review at 10:00", time: "1h" },
  { app: "Nyne Store", icon: "store", color: "#8b5cf6", title: "Nyne Store", body: "3 apps updated automatically", time: "3h" },
];

export function NotificationCenter({ onClear }: { onClear?: () => void }) {
  const [items, setItems] = React.useState(NOTIFS);
  return (
    <View style={st.root}>
      <View style={st.clock}>
        <GlassClock size={74} />
        <Text style={st.date}>{fmtDate()}</Text>
      </View>
      <View style={st.list} className="app-scroll">
        {items.map((n, i) => (
          <View key={i} style={[st.card, glassStyle(0.16) as object]} className="nc-card">
            <View style={[st.ic, { backgroundColor: n.color }]}>
              <Icon name={n.icon} size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={st.cRow}>
                <Text style={st.cTitle}>{n.app}</Text>
                <Text style={st.cTime}>{n.time}</Text>
              </View>
              <Text style={st.cTitle2}>{n.title}</Text>
              <Text style={st.cBody}>{n.body}</Text>
            </View>
          </View>
        ))}
      </View>
      {items.length > 0 && (
        <Pressable onPress={() => { setItems([]); onClear?.(); }} style={[st.clear, glassStyle(0.18) as object]}>
          <Text style={st.clearTx}>Clear All</Text>
        </Pressable>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  clock: { alignItems: "center", marginTop: 64, gap: 6 },
  date: { color: "rgba(255,255,255,.7)", fontSize: 13 },
  list: { flex: 1, marginTop: 18, paddingHorizontal: 16, gap: 10 },
  card: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 18 },
  ic: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cRow: { flexDirection: "row", justifyContent: "space-between" },
  cTitle: { color: "rgba(255,255,255,.6)", fontSize: 11, fontWeight: "600" },
  cTime: { color: "rgba(255,255,255,.5)", fontSize: 11 },
  cTitle2: { color: "#fff", fontSize: 13, fontWeight: "700", marginTop: 1 },
  cBody: { color: "rgba(255,255,255,.85)", fontSize: 13, marginTop: 1 },
  clear: { alignSelf: "center", paddingVertical: 10, paddingHorizontal: 22, borderRadius: 999, marginBottom: 24 },
  clearTx: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
