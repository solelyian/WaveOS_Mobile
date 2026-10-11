// StatusBar.tsx — heure à gauche, signal/wifi/batterie à droite (mêmes métriques).
import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fmtTime } from "../system/state";
import { Icon } from "./Icon";

export function StatusBar({ light = true }: { light?: boolean }) {
  const color = light ? "#fff" : "#111";
  return (
    <View style={st.bar} pointerEvents="none">
      <Text style={[st.time, { color }]}>{fmtTime()}</Text>
      <View style={st.icons}>
        <Icon name="signal" size={15} color={color} />
        <Icon name="wifi" size={15} color={color} />
        <Icon name="battery" size={17} color={color} />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  bar: {
    position: "absolute", top: 0, left: 0, right: 0, height: 44,
    paddingTop: 16, paddingHorizontal: 26,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    zIndex: 90,
  },
  time: { fontSize: 15, fontWeight: "600" },
  icons: { flexDirection: "row", alignItems: "center", gap: 6 },
});
