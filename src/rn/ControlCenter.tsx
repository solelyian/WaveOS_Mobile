// ControlCenter.tsx — commandes en verre, curseurs neutres et grille 4×4.
import * as React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { useSys, set } from "./sys";
import { cur, next, prev } from "../system/media";
import { Icon } from "./Icon";
import { domOf, lg } from "./fx";
import { sys, type SysState } from "../system/state";

const sliderGlass: Record<string, unknown> = { dataSet: { lg: "", lgKind: "slider" } };
const roundGlass: Record<string, unknown> = { dataSet: { lg: "", lgShape: "circle" } };
const cornerGlass: Record<string, unknown> = { dataSet: { lg: "", lgShape: "corner" } };

function Tile({ children, style, r = 30, onPress, label, pressed, slider = false }: {
  children: React.ReactNode; style?: object; r?: number; onPress?: () => void;
  label?: string; pressed?: boolean; slider?: boolean;
}) {
  const inner = <View {...(slider ? sliderGlass : lg)} style={[st.tile, { borderRadius: r }, slider ? st.sliderGlass : null, style]}>{children}</View>;
  return onPress ? <Pressable style={{ flex: 1, minWidth: 0 }} accessibilityRole="button" accessibilityLabel={label} aria-pressed={pressed} onPress={onPress}>{inner}</Pressable>
    : <View style={{ flex: 1, minWidth: 0 }}>{inner}</View>;
}

function Pill({ k, icon, offIcon, name, tint = "transparent", label = name, onPress }: {
  k?: keyof SysState; icon: string; offIcon?: string; name: string; tint?: string; label?: string; onPress?: () => void;
}) {
  const s = useSys();
  const on = k ? !!s[k] : true;
  const piColor = k === "focus" ? `rgba(255,255,255,${on ? ".16" : ".06"})` : on ? tint : "rgba(255,255,255,.06)";
  const icColor = !on && k !== "focus" ? "rgba(255,255,255,.55)" : "rgba(255,255,255,.90)";
  return (
    <Tile style={on && (k === "wifi" || k === "bluetooth") ? [st.pill, st.activeTile] : st.pill}
      r={33} label={label} pressed={k ? on : undefined} onPress={onPress ?? (k ? () => set(k, !s[k] as never) : undefined)}>
      <View style={[st.pi, { backgroundColor: piColor }]}>
        <Icon name={!on && offIcon ? offIcon : icon} size={26} color={icColor} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={2} style={st.pillNm}>{name}</Text>
      </View>
    </Tile>
  );
}

function HSlider({ icon, k }: { icon: string; k: "brightness" | "volume" }) {
  const s = useSys();
  const ref = React.useRef<View>(null);
  React.useEffect(() => {
    const el = domOf(ref); if (!el) return;
    let pointer: number | null = null;
    const setFromX = (clientX: number) => {
      const r = el.getBoundingClientRect();
      set(k, Math.max(0, Math.min(100, Math.round(((clientX - r.left) / r.width) * 100))));
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || pointer !== null) return;
      e.stopPropagation();
      pointer = e.pointerId;
      el.focus();
      el.setPointerCapture(e.pointerId);
      setFromX(e.clientX);
    };
    const move = (e: PointerEvent) => { if (e.pointerId === pointer) setFromX(e.clientX); };
    const release = (e: PointerEvent) => { if (e.pointerId === pointer) pointer = null; };
    const keydown = (e: KeyboardEvent) => {
      const delta = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key];
      if (delta === undefined && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      set(k, e.key === "Home" ? 0 : e.key === "End" ? 100 : Math.max(0, Math.min(100, sys[k] + delta!)));
    };
    el.tabIndex = 0;
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    el.addEventListener("lostpointercapture", release);
    el.addEventListener("keydown", keydown);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", release);
      el.removeEventListener("pointercancel", release);
      el.removeEventListener("lostpointercapture", release);
      el.removeEventListener("keydown", keydown);
    };
  }, [k]);
  return (
    <Tile slider style={{ flex: 1 }} r={33}>
      <View
        ref={ref}
        nativeID={`cc-${k}`}
        role="slider"
        tabIndex={0}
        aria-label={k === "brightness" ? "Brightness" : "Volume"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={s[k]}
        aria-valuetext={`${s[k]}%`}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <View style={st.track} pointerEvents="none"><View style={[st.fill, { width: `${s[k]}%` }]} /></View>
        <View style={st.icWrap} pointerEvents="none"><Icon name={icon} size={24} color="rgba(255,255,255,.90)" /></View>
      </View>
    </Tile>
  );
}

function MediaCard() {
  const s = useSys();
  const tr = cur();
  return (
    <Tile style={{ flex: 1, padding: 12 }}>
      <Pressable style={st.cast} accessibilityRole="button" accessibilityLabel="Audio devices" onPress={() => set("sheet", "sd")}>
        <Icon name="airplay" size={18} color="rgba(255,255,255,.80)" />
      </Pressable>
      <View style={[st.art, s.playing ? { backgroundImage: `url(${tr.art})`, backgroundSize: "cover" } : undefined]}>
        {!s.playing && <Icon name="music" size={22} color="rgba(255,255,255,.35)" />}
      </View>
      <Text numberOfLines={1} style={st.mediaTitle}>{s.playing ? tr.title : "Not playing"}</Text>
      <View style={st.transport}>
        <Pressable style={st.tb} accessibilityRole="button" accessibilityLabel="Previous track" onPress={prev}>
          <Icon name="skipBack" size={22} color="rgba(255,255,255,.40)" />
        </Pressable>
        <Pressable style={st.tb} accessibilityRole="button" accessibilityLabel="Play / Pause" aria-pressed={s.playing} onPress={() => set("playing", !s.playing)}>
          <Icon name={s.playing ? "pause" : "play"} size={26} color="rgba(255,255,255,.90)" filled />
        </Pressable>
        <Pressable style={st.tb} accessibilityRole="button" accessibilityLabel="Next track" onPress={next}>
          <Icon name="skipForward" size={22} color="rgba(255,255,255,.40)" />
        </Pressable>
      </View>
    </Tile>
  );
}

const GRID: [keyof SysState, string, string][] = [
  ["cellular", "signal", "Mobile data"],
  ["orientationLock", "rotateCcw", "Orientation lock"],
  ["recorder", "video", "Screen recorder"],
  ["flashlight", "flashlight", "Flashlight"],
  ["nfc", "nfc", "NFC"],
  ["share", "share", "Nyne Share"],
  ["hotspot", "globe", "Personal hotspot"],
  ["nearlink", "zap", "NearLink"],
  ["screencast", "screenShare", "ScreenCast"],
  ["sound", "bell", "Sound"],
  ["location", "mapPin", "Location"],
  ["darkMode", "moonStar", "Dark mode"],
  ["airplane", "plane", "Airplane mode"],
  ["screenshot", "scissors", "Screenshot"],
  ["scan", "scanLine", "Scan"],
  ["remote", "tv", "Smart Remote"],
];
const GRID_ROWS = Array.from({ length: Math.ceil(GRID.length / 4) }, (_, i) => GRID.slice(i * 4, i * 4 + 4));

function Cell({ k, icon, label }: { k: keyof SysState; icon: string; label: string }) {
  const s = useSys();
  const on = !!s[k];
  return (
    <Pressable style={st.cell} accessibilityRole="button" accessibilityLabel={label} aria-pressed={on} onPress={() => set(k, !s[k] as never)}>
      <View {...roundGlass} style={[st.dot, on ? st.dotOn : st.dotOff]}>
        <Icon name={icon} size={30} color="#fff" />
      </View>
      <Text numberOfLines={2} style={st.lb}>{label}</Text>
    </Pressable>
  );
}

export function ControlCenter() {
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.getElementById("cc");
    if (root) {
      root.style.backdropFilter = "blur(6px) saturate(115%) brightness(1.18)";
      (root.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter = root.style.backdropFilter;
    }
    const css = document.createElement("style");
    css.textContent = `
      #cc [role="button"] > [data-lg] { transition: transform .12s, background-color .2s; }
      #cc [role="button"]:active > [data-lg] { transform: scale(.97); }
      #cc [aria-pressed]:active > [data-lg][data-lg-shape="circle"] { transform: scale(.93); }
      #cc [role="button"]:active > [data-lg][data-lg-shape="corner"] { transform: scale(.9); }
      #cc [data-lg] svg { filter: drop-shadow(0 1px 2px rgba(0,0,0,.22)); }
      #cc :focus-visible { outline: 2px solid rgba(255,255,255,.85); outline-offset: 3px; }
      @media (prefers-reduced-motion: reduce) { #cc [data-lg] { transition: none; } }
    `;
    document.head.append(css);
    return () => css.remove();
  }, []);
  return (
    <View style={st.root} nativeID="cc">
      <View style={st.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Edit controls"><View {...cornerGlass} style={st.corner}><Icon name="squarePen" size={24} color="#fff" /></View></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Settings"><View {...cornerGlass} style={st.corner}><Icon name="settings" size={24} color="#fff" /></View></Pressable>
      </View>

      <View style={st.r1}>
        <MediaCard />
        <View style={st.conn}>
          <Pill k="wifi" icon="wifi" offIcon="wifiOff" name="WAVE-5G" label="Wi-Fi: WAVE-5G" tint="rgba(0,145,255,.28)" />
          <Pill k="bluetooth" icon="bluetooth" offIcon="bluetoothOff" name="Nyne Watch" label="Bluetooth: Nyne Watch" tint="rgba(0,145,255,.28)" />
        </View>
      </View>

      <View style={st.r2}>
        <Pill icon="link" name="Nyne Link" onPress={() => set("sheet", "sd")} />
        <HSlider icon="sun" k="brightness" />
      </View>

      <View style={st.r2}>
        <Pill k="focus" icon="moon" name="Zen Mode" />
        <HSlider icon="volume2" k="volume" />
      </View>

      <View style={st.grid}>
        {GRID_ROWS.map((row, i) => <View key={i} style={st.gridRow}>
          {row.map(([k, icon, label]) => <Cell key={k} k={k} icon={icon} label={label} />)}
        </View>)}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, paddingTop: 74, paddingHorizontal: 44, paddingBottom: 10, gap: 16,
    backgroundColor: "rgba(18,20,24,.06)" },
  tile: { flex: 1, position: "relative", overflow: "hidden", backgroundColor: "rgba(255,255,255,.07)" },
  sliderGlass: { backgroundColor: "rgba(20,20,20,.16)" },
  activeTile: { backgroundColor: "rgba(0,135,255,.72)" },
  top: { flexDirection: "row", justifyContent: "space-between", height: 40 },
  corner: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,.07)" },
  r1: { flexDirection: "row", gap: 16, height: 148 },
  conn: { flex: 1, gap: 16 },
  pill: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, padding: 8 },
  pi: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  pillNm: { color: "#fff", fontSize: 15, fontWeight: "400", lineHeight: 18 },
  r2: { flexDirection: "row", gap: 16, height: 66 },
  track: { position: "absolute", left: 8, top: 8, right: 8, bottom: 8, borderRadius: 25, overflow: "hidden" },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "rgba(255,255,255,.18)" },
  icWrap: { position: "absolute", left: 8, top: 8, width: 50, height: 50, alignItems: "center", justifyContent: "center" },
  cast: { position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,.04)", alignItems: "center", justifyContent: "center" },
  transport: { position: "absolute", bottom: 10, left: 8, right: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tb: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  art: { width: 50, height: 50, borderRadius: 16, backgroundColor: "rgba(255,255,255,.08)", alignItems: "center", justifyContent: "center" },
  mediaTitle: { marginTop: 8, color: "rgba(255,255,255,.55)", fontSize: 13, fontWeight: "400", lineHeight: 16 },
  grid: { gap: 8 },
  gridRow: { flexDirection: "row", gap: 16 },
  cell: { flex: 1, minWidth: 0, height: 88, alignItems: "center", gap: 6 },
  dot: { width: 64, height: 64, flexShrink: 0, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  dotOn: { backgroundColor: "rgba(0,135,255,.72)", borderWidth: 1, borderColor: "rgba(105,235,255,.75)" },
  dotOff: { backgroundColor: "rgba(255,255,255,.07)" },
  lb: { color: "#fff", fontSize: 11, fontWeight: "400", lineHeight: 12, textAlign: "center", maxWidth: 70,
    textShadowColor: "rgba(0,0,0,.55)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
});
