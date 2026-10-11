// LockScreen.tsx — lock glyph, date, horloge verre, SWIPE UP, boutons lampe/caméra.
// Monté par le shell ; le swipe est routé par le gesture router du shell.
import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fmtDate, fmtTime } from "../system/state";
import { Icon } from "./Icon";
import { glassStyle, domOf, lg } from "./fx";

const clkMask = (t: string, w: number, h: number, fs: number, ls: number, stroke: boolean) => {
  const cv = document.createElement("canvas");
  const dpr = 2;
  cv.width = w * dpr; cv.height = h * dpr;
  const c = cv.getContext("2d")!;
  c.scale(dpr, dpr);
  c.font = `700 ${fs}px 'Avenir Next', 'Helvetica Neue', Arial, sans-serif`;
  (c as unknown as { letterSpacing: string }).letterSpacing = `${ls.toFixed(1)}px`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  if (stroke) { c.lineWidth = 1.6; c.strokeStyle = "#fff"; c.strokeText(t, w / 2, h / 2); }
  else { c.fillStyle = "#fff"; c.fillText(t, w / 2, h / 2); }
  return `url("${cv.toDataURL()}")`;
};

export function GlassClock({ size = 96 }: { size?: number }) {
  // horloge « verre liquide » : les glyphes sont découpés par masque canvas au-
  // dessus d'un backdrop-filter (wallpaper réfracté) + liseré spéculaire.
  const ref = React.useRef<View>(null);
  const t = fmtTime();
  React.useEffect(() => {
    const el = domOf(ref);
    if (!el) return;
    const pad = 12;
    const w = el.offsetWidth + pad * 2, hh = el.offsetHeight + pad * 2;
    if (w < pad * 3) return;
    let g = el.querySelector<HTMLElement>(".clk-g"), e = el.querySelector<HTMLElement>(".clk-e");
    if (!g) {
      g = document.createElement("i"); g.className = "clk-g";
      e = document.createElement("i"); e.className = "clk-e";
      el.append(g, e);
      for (const n of [g, e] as HTMLElement[]) {
        n.style.cssText = "position:absolute;top:-12px;left:-12px;right:-12px;bottom:-12px;display:block;pointer-events:none;-webkit-mask-repeat:no-repeat;-webkit-mask-position:center;-webkit-mask-size:100% 100%;mask-repeat:no-repeat;mask-position:center;mask-size:100% 100%";
      }
      g.style.background = "linear-gradient(178deg, rgba(255,255,255,.62), rgba(255,255,255,.30) 45%, rgba(255,255,255,.20) 62%, rgba(255,255,255,.42))";
      g.style.backdropFilter = "blur(10px) brightness(1.65) saturate(165%)";
      (g.style as unknown as Record<string, string>).WebkitBackdropFilter = "blur(10px) brightness(1.65) saturate(165%)";
      g.style.filter = "drop-shadow(0 4px 14px rgba(0,0,0,.28)) drop-shadow(0 0 10px rgba(255,255,255,.18))";
      e.style.background = "rgba(255,255,255,.85)";
      e.style.filter = "blur(.6px) drop-shadow(0 0 5px rgba(255,255,255,.55))";
    }
    const ls = size * -0.04;
    g.style.maskImage = (g.style as unknown as Record<string, string>).webkitMaskImage = clkMask(t, w, hh, size, ls, false);
    e!.style.maskImage = (e!.style as unknown as Record<string, string>).webkitMaskImage = clkMask(t, w, hh, size, ls, true);
  }, [t, size]);
  return (
    <View ref={ref} style={{ position: "relative" }}>
      <Text style={{
        fontSize: size, fontWeight: "700", letterSpacing: -size * 0.045,
        color: "transparent", lineHeight: size,
        fontFamily: "'Avenir Next','Helvetica Neue',Arial,sans-serif",
      } as object}>
        {t}
      </Text>
    </View>
  );
}

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
      <Icon name="lock" size={16} color="rgba(255,255,255,.85)" style={{ marginTop: 56, alignSelf: "center" }} />
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
  clockWrap: { marginTop: 30, alignItems: "center", gap: 4 },
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
