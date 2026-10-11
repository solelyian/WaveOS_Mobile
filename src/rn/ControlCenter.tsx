// ControlCenter.tsx — toggles 2×2, sliders verticaux brightness/volume, carte média,
// Zen/Cast, rangée utilitaires, tuile Nyne Link — métriques identiques à main.
import * as React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { useSys, set } from "./sys";
import { cur } from "../system/media";
import { Icon } from "./Icon";
import { glassStyle, domOf } from "./fx";
import type { SysState } from "../system/state";

function Tile({ children, style, r = 28, onPress }: { children: React.ReactNode; style?: object; r?: number; onPress?: () => void }) {
  const inner = <View style={[st.tile, { borderRadius: r }, glassStyle(0.18) as object, style]}>{children}</View>;
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
}

function Toggle({ k, on, off }: { k: keyof SysState; on: string; off?: string }) {
  const s = useSys();
  const active = !!s[k];
  const bg = k === "airplane" ? "#f97316" : k === "cellular" ? "#22c55e" : "#3b82f6";
  return (
    <Pressable onPress={() => set(k, !s[k] as never)}>
      <View style={[st.tg, active ? { backgroundColor: bg } : st.tgOff]}>
        <Icon name={active || !off ? on : off} size={22} color="#fff" />
      </View>
    </Pressable>
  );
}

function Slider({ icon, k }: { icon: string; k: "brightness" | "volume" }) {
  const s = useSys();
  const ref = React.useRef<View>(null);
  const setFromY = (pageY: number) => {
    const el = domOf(ref); if (!el) return;
    const r = el.getBoundingClientRect();
    set(k, Math.max(0, Math.min(100, Math.round(100 - ((pageY - r.top) / r.height) * 100))));
  };
  return (
    <Tile style={{ flex: 1, overflow: "hidden" }} r={34}>
      <View
        ref={ref}
        nativeID="cc-slider"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => setFromY(e.nativeEvent.pageY)}
        onResponderMove={(e) => setFromY(e.nativeEvent.pageY)}
      >
        <View style={[st.fill, { height: `${s[k]}%` }]} />
        <View style={st.icWrap}><Icon name={icon} size={22} color="#000" /></View>
      </View>
    </Tile>
  );
}

function MediaCard() {
  const s = useSys();
  const tr = cur();
  return (
    <Tile style={{ flex: 2, padding: 14, justifyContent: "center" }}>
      {s.playing ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 52, height: 52, borderRadius: 12, backgroundImage: `url(${tr.art})`, backgroundSize: "cover" }} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{tr.title}</Text>
              <Text numberOfLines={1} style={{ color: "rgba(255,255,255,.7)", fontSize: 12 }}>{tr.artist}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-evenly", marginTop: 12 }}>
            <Icon name="skipBack" size={22} /><Icon name="pause" size={26} /><Icon name="skipForward" size={22} />
          </View>
        </>
      ) : (
        <View style={{ alignItems: "center", gap: 8, opacity: 0.4 }}>
          <Icon name="music" size={26} />
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 2 }}>NOT PLAYING</Text>
        </View>
      )}
    </Tile>
  );
}

function SquareBtn({ icon, label, onPress, active }: { icon: string; label: string; onPress?: () => void; active?: boolean }) {
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <Pressable onPress={onPress}>
        <View style={[st.sqBtn, glassStyle(active ? 0.4 : 0.18) as object]}>
          <Icon name={icon} size={22} color="#fff" />
        </View>
      </Pressable>
      <Text style={{ color: "rgba(255,255,255,.7)", fontSize: 11 }}>{label}</Text>
    </View>
  );
}

export function ControlCenter() {
  const s = useSys();
  return (
    <View style={st.root}>
      <View style={st.r1}>
        <Tile style={{ flex: 2, padding: 14 }}>
          <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <Toggle k="wifi" on="wifi" off="wifiOff" />
            <Toggle k="bluetooth" on="bluetooth" off="bluetoothOff" />
            <Toggle k="cellular" on="signal" />
            <Toggle k="airplane" on="plane" />
          </View>
        </Tile>
        <View style={{ flex: 1, flexDirection: "row", gap: 16 }}>
          <Slider icon="sun" k="brightness" />
          <Slider icon="volume2" k="volume" />
        </View>
      </View>

      <View style={st.r2}>
        <MediaCard />
        <View style={{ flex: 1, gap: 12, justifyContent: "center" }}>
          <SquareBtn icon="moon" label="Zen" active={s.darkMode} onPress={() => set("darkMode", !s.darkMode)} />
          <SquareBtn icon="screenShare" label="Cast" />
        </View>
      </View>

      <View style={st.r3}>
        {(["flashlight", "clock", "camera", "calculator"] as const).map((ic) => (
          <Tile key={ic} style={{ flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center" }} r={999}>
            <Icon name={ic} size={22} color="#fff" />
          </Tile>
        ))}
      </View>

      <View style={st.sdWrap}>
        <Tile style={st.sd} r={24} onPress={() => set("sheet", "sd")}>
          <View style={st.sdIc}><Icon name="cast" size={18} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Nyne Link</Text>
            <Text style={{ color: "rgba(255,255,255,.6)", fontSize: 12 }}>5 devices nearby</Text>
          </View>
          <Icon name="chevronDown" size={16} color="rgba(255,255,255,.5)" />
        </Tile>
      </View>

      <Tile style={st.home} r={24}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={st.sdIc}><Icon name="home" size={18} color="#fff" /></View>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Home</Text>
        </View>
        <Text style={{ color: "rgba(255,255,255,.6)", fontSize: 12 }}>3 Scenes Active</Text>
      </Tile>
    </View>
  );
}

const st = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, paddingTop: 58, paddingHorizontal: 16, gap: 14 },
  tile: { position: "relative", overflow: "hidden" },
  r1: { flexDirection: "row", gap: 14, height: 168 },
  r2: { flexDirection: "row", gap: 14, height: 150 },
  r3: { flexDirection: "row", gap: 14, height: 72 },
  tg: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  tgOff: { backgroundColor: "rgba(255,255,255,.12)", borderWidth: 1, borderColor: "rgba(255,255,255,.12)" },
  fill: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(255,255,255,.92)",
    boxShadow: "inset 0 1px 0 #fff",
  } as object,
  icWrap: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center", paddingBottom: 14 },
  sqBtn: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  sdWrap: { marginTop: "auto" },
  home: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, marginBottom: 26 },
  sd: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  sdIc: {
    width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(96,165,250,.25)",
  },
});
