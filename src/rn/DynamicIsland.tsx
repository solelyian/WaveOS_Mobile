// DynamicIsland.tsx — capsule noire (120×36) → étendue media (360×180), spring island.
import * as React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSys, set } from "./sys";
import { cur } from "../system/media";
import { Spring, SPRINGS, lerp, onFrame, domOf, clamp } from "./fx";
import { Icon } from "./Icon";

// (w, h, r) pour les trois états : idle, mini-player, étendu — calque DK du moteur.
const DK = [
  { w: 120, h: 36, r: 20 },
  { w: 200, h: 36, r: 20 },
  { w: 360, h: 180, r: 44 },
];

function EqBars({ n = 4, h = 12 }: { n?: number; h?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: h }}>
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={{ width: 3, height: 3 + ((i * 37) % (h - 3)), borderRadius: 1.5, backgroundColor: "#22c55e" }} />
      ))}
    </View>
  );
}

export function DynamicIsland() {
  const s = useSys();
  const cap = React.useRef<View>(null);
  const big = React.useRef<View>(null);
  const sp = React.useMemo(() => new Spring(0, SPRINGS.island[0], SPRINGS.island[1]), []);
  const [expanded, setExpanded] = React.useState(false);
  const target = expanded ? 2 : s.playing ? 1 : 0;
  React.useEffect(() => { sp.to(target); }, [target, sp]);
  const tr = cur();

  React.useEffect(() => { const off = onFrame((dt) => {
    const el = domOf(cap), bg = domOf(big);
    if (!el) return;
    sp.step(dt);
    const v = sp.v;
    const i = v <= 1 ? 0 : 1, t = v <= 1 ? v : v - 1;
    const a = DK[i], b = DK[i + 1];
    el.style.width = `${lerp(a.w, b.w, t)}px`;
    el.style.height = `${lerp(a.h, b.h, t)}px`;
    el.style.borderRadius = `${lerp(a.r, b.r, t)}px`;
    if (bg) {
      const e = clamp((v - 1.4) / 0.4);
      bg.style.opacity = `${e}`;
      bg.style.pointerEvents = e > 0.5 ? "auto" : "none";
    }
  }); return () => { off(); }; }, [sp]);

  return (
    <View style={st.di} pointerEvents="box-none">
      <Pressable onPress={() => setExpanded(!expanded)}>
        <View ref={cap} style={st.cap}>
          {/* contenu étendu */}
          <View ref={big} style={[st.big, { opacity: 0 }]}>
            {s.playing ? (
              <>
                <View style={st.bRow}>
                  <View style={[st.bArt, { backgroundImage: `url(${tr.art})` }]} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={st.bTt}>{tr.title}</Text>
                    <Text numberOfLines={1} style={st.bAr}>{tr.artist}</Text>
                  </View>
                  <EqBars />
                </View>
                <View style={st.prog}><View style={[st.progFill, { width: `${Math.min(100, (s.position / tr.dur) * 100)}%` }]} /></View>
                <View style={st.bCtrl}>
                  <Pressable onPress={() => {}}><Icon name="skipBack" size={22} /></Pressable>
                  <Pressable onPress={() => set("playing", !s.playing)}><Icon name={s.playing ? "pause" : "play"} size={26} /></Pressable>
                  <Pressable onPress={() => {}}><Icon name="skipForward" size={22} /></Pressable>
                </View>
              </>
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "rgba(255,255,255,.5)", fontSize: 13, fontWeight: "600", letterSpacing: 1.5 }}>NO MEDIA PLAYING</Text>
              </View>
            )}
          </View>
          {/* contenu compact */}
          {s.playing && !expanded && (
            <View style={st.mini} pointerEvents="none">
              <View style={[st.mArt, { backgroundImage: `url(${tr.art})` }]} />
              <EqBars />
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  di: { position: "absolute", top: 12, left: 0, right: 0, alignItems: "center", zIndex: 95 },
  cap: { backgroundColor: "#000", overflow: "hidden", width: 120, height: 36, borderRadius: 20 },
  mini: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8,
  },
  mArt: { width: 22, height: 22, borderRadius: 11, backgroundSize: "cover" },
  big: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, padding: 18 },
  bRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  bArt: { width: 64, height: 64, borderRadius: 12, backgroundSize: "cover" },
  bTt: { color: "#fff", fontSize: 16, fontWeight: "700" },
  bAr: { color: "rgba(255,255,255,.7)", fontSize: 13, marginTop: 2 },
  prog: { marginTop: 14, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,.15)", overflow: "hidden" },
  progFill: { height: 4, borderRadius: 2, backgroundColor: "#fff" },
  bCtrl: { marginTop: 10, flexDirection: "row", justifyContent: "space-evenly", alignItems: "center" },
});
