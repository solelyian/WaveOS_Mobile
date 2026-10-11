// LockScreen.tsx — lock glyph, date, horloge verre, SWIPE UP, boutons lampe/caméra.
// Monté par le shell ; le swipe est routé par le gesture router du shell.
import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fmtDate, fmtTime } from "../system/state";
import { Icon } from "./Icon";
import { glassStyle } from "./fx";

export function GlassClock({ size = 96 }: { size?: number }) {
  // horloge « verre » : gradient texte + halo de blur — calque du rendu web.
  return (
    <Text style={{
      fontSize: size, fontWeight: "200", letterSpacing: -size * 0.045,
      color: "rgba(255,255,255,0.92)",
      textShadowColor: "rgba(255,255,255,0.35)",
      textShadowRadius: 18,
      lineHeight: size,
    } as object}>
      {fmtTime()}
    </Text>
  );
}

function RoundBtn({ icon }: { icon: string }) {
  return (
    <View style={[st.round, glassStyle(0.18) as object]}>
      <Icon name={icon} size={22} color="#fff" />
    </View>
  );
}

export function LockScreen() {
  return (
    <View style={st.root}>
      <Icon name="lock" size={16} color="rgba(255,255,255,.85)" style={{ marginTop: 56, alignSelf: "center" }} />
      <View style={st.clockWrap}>
        <Text style={st.date}>{fmtDate()}</Text>
        <GlassClock />
      </View>
      <Text style={st.swipe}>SWIPE UP</Text>
      <View style={st.row}>
        <RoundBtn icon="flashlight" />
        <RoundBtn icon="camera" />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 30 },
  clockWrap: { marginTop: 30, alignItems: "center", gap: 4 },
  date: { color: "#fff", fontSize: 20, fontWeight: "500" },
  swipe: {
    position: "absolute", bottom: 110, left: 0, right: 0, textAlign: "center",
    color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "700", letterSpacing: 2,
  },
  row: {
    position: "absolute", bottom: 40, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 28,
  },
  round: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
});
