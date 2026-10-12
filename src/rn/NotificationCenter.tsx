// NotificationCenter.tsx — shade NC : horloge verre, date, cartes verre, Clear all.
import * as React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { fmtDate } from "../system/state";
import { GlassClock } from "./GlassClock";
import { Icon } from "./Icon";
import { glassStyle, lg } from "./fx";

const notificationGlass: Record<string, unknown> = { dataSet: { lg: "", lgKind: "notification" } };
const NOTIFS: { app: string; icon: string; color: string; body: string; time: string }[] = [
  { app: "Sarah Connor", icon: "messageCircle", color: "#22c55e", body: "The future is not set. There is no fate but what we make for ourselves.", time: "2m ago" },
  { app: "Nyne ID", icon: "mail", color: "#3b82f6", body: "New login detected on MacBook Pro.", time: "15m ago" },
  { app: "Security", icon: "lock", color: "#f97316", body: "Front door motion detected.", time: "1h ago" },
  { app: "Up Next", icon: "calendar", color: "#ef4444", body: "Design Review in 30 mins.", time: "1h ago" },
  { app: "Music", icon: "music", color: "#ec4899", body: "Your daily mix is ready.", time: "3h ago" },
];

export function NotificationCenter({ onClear }: { onClear?: () => void }) {
  const [items, setItems] = React.useState(NOTIFS);
  return (
    <View style={st.root}>
      <View style={st.clock}>
        <Text style={st.date}>{fmtDate()}</Text>
        <GlassClock size={74} />
      </View>
      <View style={st.list} nativeID="app-scroll">
        {items.map((n, i) => (
          <View key={i} {...notificationGlass} style={[st.card, glassStyle(0.04) as object]} nativeID="nc-card">
            <View style={[st.ic, { backgroundColor: n.color }]}>
              <Icon name={n.icon} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={st.cRow}>
                <Text style={st.cTitle}>{n.app}</Text>
                <Text style={st.cTime}>{n.time}</Text>
              </View>
              <Text style={st.cBody} numberOfLines={2}>{n.body}</Text>
            </View>
          </View>
        ))}
      </View>
      {items.length > 0 && (
        <Pressable onPress={() => { setItems([]); onClear?.(); }} {...lg} style={[st.clear, glassStyle(0.05) as object]}>
          <Text style={st.clearTx}>Clear All</Text>
        </Pressable>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,.05)" },
  clock: { alignItems: "center", marginTop: 64, gap: 6 },
  date: { color: "rgba(255,255,255,.9)", fontSize: 19, fontWeight: "500" },
  list: { flex: 1, marginTop: 30, paddingHorizontal: 28, paddingVertical: 2, gap: 14 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 30 },
  ic: { width: 44, height: 44, flexShrink: 0, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10 },
  cTitle: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: -.15 },
  cTime: { color: "rgba(255,255,255,.55)", fontSize: 11.5, flexShrink: 0 },
  cBody: { color: "rgba(255,255,255,.78)", fontSize: 13, lineHeight: 17.55, marginTop: 3 },
  clear: { alignSelf: "center", paddingVertical: 10, paddingHorizontal: 22, borderRadius: 999, marginBottom: 24 },
  clearTx: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
