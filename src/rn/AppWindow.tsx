// AppWindow.tsx — morph icône→fenêtre : le conteneur coloré grandit depuis la
// tuile (scale compensé par axe), le contenu app crossfade par-dessus ; drag
// vertical vers le haut = résorption vers l'icône, vers le bas = élastique.
import React from "react";
import { View, StyleSheet } from "react-native";
import { Spring, SPRINGS, lerp, clamp, domOf, onFrame } from "./fx";
import { appMeta } from "./apps";
import { renderApp } from "./apps";
import type { AppId } from "../system/state";
import { ToastLayer } from "./apps/ui";
import type { AppRect } from "./host";

const R_ICON = 22, R_SCREEN = 60, W = 400, H = 850;
const CLOSE_TRAVEL = 260, V_COMMIT = 500;

export interface AppWinCtl {
  drag(dy: number): void;
  release(dy: number, vy: number): "close" | "stay";
  close(): void;
}
export const appwinCtl: { current: AppWinCtl | null } = { current: null };

export function AppWindow({ id, from, onClosed }: { id: AppId; from: AppRect; onClosed: () => void }) {
  const win = React.useRef<View>(null);
  const body = React.useRef<View>(null);
  const meta = appMeta(id);
  const st = React.useRef({
    morph: new Spring(0, ...SPRINGS.morph),
    oy: new Spring(0, ...SPRINGS.morph),
    progress: 0,
    closing: false,
    dead: false,
  }).current;

  React.useEffect(() => {
    const el = domOf(win);
    if (el) {
      el.style.transformOrigin = "0 0";
      el.style.background = meta.color;
    }
    const t0 = setTimeout(() => st.morph.to(1), 20);
    appwinCtl.current = {
      drag(dy) {
        if (st.closing) return;
        if (dy < 0) {
          st.progress = Math.min(1, -dy / CLOSE_TRAVEL);
          st.morph.set(1 - st.progress);
          st.oy.set(0);
        } else {
          st.oy.set(dy * 0.35);
        }
      },
      release(_dy, vy) {
        if (st.progress > 0.4 || vy < -V_COMMIT * 0.9 || Math.abs(vy) > V_COMMIT * 1.6) {
          close();
          return "close";
        }
        st.progress = 0;
        st.morph.to(1);
        st.oy.to(0);
        return "stay";
      },
      close,
    };
    function close() {
      if (st.closing) return;
      st.closing = true;
      st.morph.to(0);
      st.oy.to(0);
    }
    const off = onFrame((dt) => {
      const el2 = domOf(win);
      const bd = domOf(body);
      if (!el2 || st.dead) return;
      st.morph.step(dt);
      st.oy.step(dt);
      const t = st.morph.v;
      const sx = lerp(from.w / W, 1, t);
      const sy = lerp(from.h / H, 1, t);
      const tx = lerp(from.x, 0, t);
      const ty = lerp(from.y, 0, t) + st.oy.v;
      el2.style.transform = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
      const r = lerp(R_ICON, R_SCREEN, t);
      el2.style.borderRadius = `${(r / sx).toFixed(1)}px / ${(r / sy).toFixed(1)}px`;
      if (bd) {
        if (!st.closing) {
          const c = clamp((t - 0.15) / 0.45, 0, 1);
          bd.style.opacity = c.toFixed(3);
          bd.style.filter = `blur(${((1 - c) * 10).toFixed(1)}px)`;
          bd.style.transform = `scale(${lerp(0.98, 1, c).toFixed(4)})`;
        } else {
          bd.style.filter = "none";
          bd.style.opacity = Math.max(0, Math.min(1, t * 6)).toFixed(3);
          bd.style.transform = `scale(${lerp(0.98, 1, t).toFixed(4)})`;
        }
      }
      if (st.closing && t <= 0.01 && st.morph.settled && !st.dead) {
        st.dead = true;
        onClosed();
      }
    });
    return () => { clearTimeout(t0); off(); appwinCtl.current = null; };
  }, [id]);

  return (
    <View ref={win} style={stx.win}>
      <View ref={body} style={stx.body} nativeID="app-scroll">
        {renderApp(id)}
      </View>
      <View style={stx.grabber} pointerEvents="none">
        <View style={[stx.grab, meta.theme === "dark" ? stx.grabDark : stx.grabLight]} />
      </View>
      <ToastLayer />
    </View>
  );
}

const stx = StyleSheet.create({
  win: {
    position: "absolute", top: 0, left: 0, width: 400, height: 850,
    overflow: "hidden", zIndex: 30, backgroundColor: "#000",
  } as object,
  body: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0 } as object,
  grabber: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 32,
    alignItems: "center", justifyContent: "center", zIndex: 100,
  } as object,
  grab: { width: 144, height: 6, borderRadius: 3 } as object,
  grabDark: { backgroundColor: "rgba(255,255,255,.8)" } as object,
  grabLight: { backgroundColor: "rgba(0,0,0,.6)" } as object,
});
