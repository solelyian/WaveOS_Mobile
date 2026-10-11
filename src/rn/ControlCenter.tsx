// ControlCenter.tsx — HarmonyOS layout: media card + WiFi/BT pills,
// Nyne Link / Zen pills beside tinted horizontal sliders, 4xN labeled dot grid.
import * as React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { useSys, set } from "./sys";
import { cur } from "../system/media";
import { Icon } from "./Icon";
import { glassStyle, domOf, lg } from "./fx";
import type { SysState } from "../system/state";

function Tile({ children, style, r = 26, onPress }: { children: React.ReactNode; style?: object; r?: number; onPress?: () => void }) {
  const inner = <View {...lg} style={[st.tile, { borderRadius: r }, {backgroundColor:"rgba(16,22,40,.48)"} as object, style]}>{children}</View>;
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
}

function Pill({ k, icon, offIcon, name, sub, tint, onPress }: {
  k?: keyof SysState; icon: string; offIcon?: string; name: string; sub?: string; tint: string; onPress?: () => void;
}) {
  const s = useSys();
  const on = k ? !!s[k] : true;
  const piColor = on ? tint : "rgba(255,255,255,.08)";
  const icColor = on ? "#fff" : "rgba(255,255,255,.55)";
  return (
    <Tile style={st.pill} r={26} onPress={onPress ?? (k ? () => set(k, !s[k] as never) : undefined)}>
      <View style={[st.pi, { backgroundColor: piColor }]}>
        <Icon name={!on && offIcon ? offIcon : icon} size={18} color={icColor} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={2} style={st.pillNm}>{name}</Text>
        {sub ? <Text numberOfLines={1} style={st.pillSub}>{sub}</Text> : null}
      </View>
    </Tile>
  );
}

function HSlider({ icon, k, tint }: { icon: string; k: "brightness" | "volume"; tint: string }) {
  const s = useSys();
  const ref = React.useRef<View>(null);
  const setFromX = (pageX: number) => {
    const el = domOf(ref); if (!el) return;
    const r = el.getBoundingClientRect();
    set(k, Math.max(0, Math.min(100, Math.round(((pageX - r.left) / r.width) * 100))));
  };
  return (
    <Tile style={{ flex: 1, overflow: "hidden" }} r={26}>
      <View
        ref={ref}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => setFromX(e.nativeEvent.pageX)}
        onResponderMove={(e) => setFromX(e.nativeEvent.pageX)}
      >
        <View style={[st.fill, { width: `${s[k]}%`, backgroundColor: tint }, tint === "#22c55e" ? st.glowG : st.glowO]} />
        <View style={st.icWrap}><View style={st.icCap}><Icon name={icon} size={18} color="#fff" /></View></View>
      </View>
    </Tile>
  );
}

function MediaCard() {
  const s = useSys();
  const tr = cur();
  return (
    <Tile style={{ flex: 1, padding: 14, justifyContent: "center" }}>
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
        <View style={{ gap: 14 }}>
          <View style={{ position: "absolute", top: 12, right: 12, width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(0,0,0,.25)", alignItems: "center", justifyContent: "center" }}><Icon name="airplay" size={14} color="rgba(255,255,255,.75)" /></View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingRight: 36 }}>
            <View style={st.art}><Icon name="music" size={22} /></View>
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600", opacity: .8 }}>Not playing</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-evenly" }}>
            <View style={st.tb}><Icon name="skipBack" size={16} /></View>
            <View style={st.tb}><Icon name="play" size={18} /></View>
            <View style={st.tb}><Icon name="skipForward" size={16} /></View>
          </View>
        </View>
      )}
    </Tile>
  );
}

const GRID: [keyof SysState, string, string, string][] = [
  ["cellular", "signal", "Mobile data", "#3b82f6"],
  ["orientationLock", "rotateCcw", "Orientation lock", ""],
  ["recorder", "video", "Screen recorder", ""],
  ["flashlight", "flashlight", "Flashlight", "#22c55e"],
  ["nfc", "nfc", "NFC", ""],
  ["share", "share", "Nyne Share", "#3b82f6"],
  ["hotspot", "globe", "Personal hotspot", "#3b82f6"],
  ["nearlink", "zap", "NearLink", "#ef4444"],
  ["screencast", "screenShare", "ScreenCast", "#22c55e"],
  ["sound", "bell", "Sound", "#3b82f6"],
  ["location", "mapPin", "Location", "#3b82f6"],
  ["darkMode", "moonStar", "Dark mode", "#3b82f6"],
  ["airplane", "plane", "Airplane mode", "#3b82f6"],
  ["screenshot", "scissors", "Screenshot", ""],
  ["scan", "scanLine", "Scan", ""],
  ["remote", "tv", "Smart Remote", ""],
];

function Cell({ k, icon, label, tint }: { k: keyof SysState; icon: string; label: string; tint: string }) {
  const s = useSys();
  const on = !!s[k];
  return (
    <Pressable style={st.cell} onPress={() => set(k, !s[k] as never)}>
      <View {...lg} style={[st.dot, on ? { backgroundColor: tint || "rgba(255,255,255,.07)", boxShadow: tint ? `0 4px 18px ${tint}73` : "none" } : st.dotOff]}>
        <Icon name={icon} size={20} color={on && tint ? "#fff" : "rgba(255,255,255,.6)"} />
      </View>
      <Text numberOfLines={2} style={st.lb}>{label}</Text>
    </Pressable>
  );
}

export function ControlCenter() {
  const s = useSys();
  return (
    <View style={st.root}>
      <View style={st.top}>
        <Pressable><View {...lg} style={[st.corner, {backgroundColor:"rgba(16,22,40,.48)"} as object]}><Icon name="squarePen" size={16} color="rgba(255,255,255,.85)" /></View></Pressable>
        <Pressable><View {...lg} style={[st.corner, {backgroundColor:"rgba(16,22,40,.48)"} as object]}><Icon name="settings" size={16} color="rgba(255,255,255,.85)" /></View></Pressable>
      </View>

      <View style={st.r1}>
        <MediaCard />
        <View style={st.conn}>
          <Pill k="wifi" icon="wifi" offIcon="wifiOff" name="WiFi" sub="WAVE-5G" tint="#3b82f6" />
          <Pill k="bluetooth" icon="bluetooth" offIcon="bluetoothOff" name="Bluetooth" sub="Nyne Watch" tint="#3b82f6" />
        </View>
      </View>

      <View style={st.r2}>
        <Pill icon="link" name="Nyne Link" sub="5 devices nearby" tint="rgba(255,255,255,.08)" onPress={() => set("sheet", "sd")} />
        <HSlider icon="sun" k="brightness" tint="#22c55e" />
      </View>

      <View style={st.r2}>
        <Pill k="focus" icon="moon" name="Zen Mode" tint="#6366f1" />
        <HSlider icon="volume2" k="volume" tint="#f97316" />
      </View>

      <View style={st.grid}>
        {GRID.map(([k, icon, label, tint]) => <Cell key={k} k={k} icon={icon} label={label} tint={tint} />)}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, paddingTop: 56, paddingHorizontal: 16, gap: 14, backgroundColor: "rgba(6,9,18,.38)" },
  tile: { position: "relative", overflow: "hidden" },
  top: { flexDirection: "row", justifyContent: "space-between", marginBottom: -4 },
  corner: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  r1: { flexDirection: "row", gap: 14, height: 168 },
  conn: { flex: 1, gap: 14 },
  pill: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14 },
  pi: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  pillNm: { color: "#fff", fontSize: 14, fontWeight: "600", lineHeight: 16 },
  pillSub: { color: "rgba(255,255,255,.55)", fontSize: 11 },
  r2: { flexDirection: "row", gap: 14, height: 64 },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0 } as object,
  glowG: { boxShadow: "0 0 24px rgba(34,197,94,.45)" } as object,
  glowO: { boxShadow: "0 0 24px rgba(249,115,22,.45)" } as object,
  icCap: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,.28)", alignItems: "center", justifyContent: "center" },
  icWrap: { position: "absolute", left: 10, top: 0, bottom: 0, justifyContent: "center", width: 44 },
  tb: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,.07)", alignItems: "center", justifyContent: "center" },
  art: { width: 56, height: 56, borderRadius: 14, backgroundColor: "rgba(255,255,255,.08)", alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 16, paddingHorizontal: 2, marginTop: 4 },
  cell: { width: "25%", alignItems: "center", gap: 7 },
  dot: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  dotOff: { backgroundColor: "rgba(16,22,40,.55)" },
  lb: { color: "rgba(255,255,255,.75)", fontSize: 10.5, lineHeight: 12, textAlign: "center", maxWidth: 74 },
});
