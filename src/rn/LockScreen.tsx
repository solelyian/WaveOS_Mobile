// LockScreen.tsx — lock glyph, date, horloge verre, SWIPE UP, boutons lampe/caméra.
// Monté par le shell ; le swipe est routé par le gesture router du shell.
import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fmtDate } from "../system/state";
import { Icon } from "./Icon";
import { glassStyle, domOf, lg } from "./fx";
import { GlassClock } from "./GlassClock";

function RoundBtn({ icon }: { icon: string }) {
  return (
    <View {...lg} style={[st.round, glassStyle(0.05) as object]}>
      <Icon name={icon} size={22} color="#fff" />
    </View>
  );
}

// Contrôle externe (gestures) : barre + fade/blur pendant le drag.
export const lockCtl: { drag(dy: number): void; reset(): void } = { drag: () => {}, reset: () => {} };

export function LockScreen() {
  const root = React.useRef<View>(null);
  const bar = React.useRef<View>(null);
  React.useEffect(() => {
    lockCtl.drag = (dy) => {
      const v = Math.min(0, dy);
      const bel = domOf(bar); if (bel) bel.style.transform = `translateY(${v}px)`;
      const p = Math.min(1, -v / 200);
      const el = domOf(root);
      if (el) { el.style.opacity = `${1 - p}`; el.style.filter = `blur(${p * 10}px)`; }
    };
    lockCtl.reset = () => {
      const bel = domOf(bar); if (bel) bel.style.transform = "";
      const el = domOf(root);
      if (el) { el.style.opacity = "1"; el.style.filter = "none"; }
    };
  }, []);
  return (
    <View ref={root} style={st.root}>
      <Icon name="lock" size={20} color="rgba(255,255,255,.85)" style={{ marginTop: 96, alignSelf: "center" }} />
      <View style={st.clockWrap}>
        <Text style={st.date}>{fmtDate()}</Text>
        <GlassClock />
      </View>
      <View ref={bar} style={st.barWrap}>
        <Text style={st.swipe}>SWIPE UP</Text>
        <View style={st.swipeBar} />
      </View>
      <View style={st.row}>
        <RoundBtn icon="flashlight" />
        <RoundBtn icon="camera" />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 30 },
  clockWrap: { marginTop: 16, alignItems: "center", gap: 4 },
  date: { color: "#fff", fontSize: 20, fontWeight: "500" },
  barWrap: { position: "absolute", bottom: 96, left: 0, right: 0, alignItems: "center" },
  swipeBar: { width: 144, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,.9)", marginTop: 8 },
  swipe: {
    color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "700", letterSpacing: 2,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  row: {
    position: "absolute", bottom: 40, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 28,
  },
  round: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
});
