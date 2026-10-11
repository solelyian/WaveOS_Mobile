// Recents.tsx — switcher façon HarmonyOS/iOS : strip horizontal de cards live
// (l'app rendue en miniature à 61.5%), tap = rouvrir, swipe-up = tuer.
import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Icon } from "./Icon";
import { appMeta, renderApp } from "./apps";
import { sys, set } from "../system/state";
import type { AppId } from "../system/state";
import { killRecent, type AppRect } from "./host";
import { domOf } from "./fx";

function phoneRect(el: HTMLElement | null): AppRect | null {
  const phone = document.getElementById("phone");
  if (!el || !phone) return null;
  const pr = phone.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const sx = 400 / pr.width, sy = 850 / pr.height;
  return { x: (r.left - pr.left) * sx, y: (r.top - pr.top) * sy, w: r.width * sx, h: r.height * sy };
}

function Card({ id, onOpen, onKill }: {
  id: AppId; onOpen: (id: AppId, r: AppRect | null) => void; onKill: (id: AppId) => void;
}) {
  const m = appMeta(id);
  const card = React.useRef<View>(null);
  const appBox = React.useRef<View>(null);
  const drag = React.useRef({ dy: 0, py: 0, vy: 0, ly: 0, lt: 0, on: false }).current;

  const handlers = {
    onStartShouldSetResponder: () => true,
    onResponderGrant: (e: { nativeEvent: { pageY: number } }) => {
      drag.on = true; drag.dy = 0; drag.py = e.nativeEvent.pageY; drag.ly = e.nativeEvent.pageY; drag.lt = performance.now(); drag.vy = 0;
    },
    onResponderMove: (e: { nativeEvent: { pageY: number } }) => {
      if (!drag.on) return;
      const y = e.nativeEvent.pageY;
      const now = performance.now(), dt = now - drag.lt;
      if (dt > 0) drag.vy = 0.7 * drag.vy + 0.3 * ((y - drag.ly) / dt * 1000);
      drag.lt = now; drag.ly = y;
      drag.dy = y - drag.py;
      const el = domOf(card);
      if (el) el.style.transform = `translateY(${Math.min(40, drag.dy)}px) scale(${Math.max(0.92, 1 - Math.abs(drag.dy) / 2400)})`;
    },
    onResponderRelease: () => {
      if (!drag.on) return;
      drag.on = false;
      const el = domOf(card);
      if (drag.dy < -110 || drag.vy < -500) {
        if (el) {
          el.style.transition = "transform .28s cubic-bezier(.4,0,.8,.4), opacity .28s";
          el.style.transform = "translateY(-900px)";
          el.style.opacity = "0";
        }
        setTimeout(() => onKill(id), 290);
      } else {
        if (el) {
          el.style.transition = "transform .25s cubic-bezier(.3,.9,.4,1.2)";
          el.style.transform = "none";
          setTimeout(() => { const e2 = domOf(card); if (e2) e2.style.transition = "none"; }, 260);
        }
        // simple tap (pas de drag) -> rouvrir l'app depuis la card
        if (Math.abs(drag.dy) < 8) onOpen(id, phoneRect(domOf(appBox)));
      }
      drag.dy = 0;
    },
  };

  return (
    <View ref={card} style={rs.card} {...handlers}>
      <View style={rs.name}>
        <View style={[rs.ic, { overflow: "hidden" }]}>
          <View ref={(n) => { const el = n as unknown as HTMLElement | null; if (el) el.style.background = m.color; }} style={StyleSheet.absoluteFill} />
          <Icon n={m.icon} size={16} color="#fff" />
        </View>
        <Text style={rs.nmTxt}>{m.name}</Text>
      </View>
      <View ref={appBox} style={rs.app}>
        <View ref={(n) => { const el = n as unknown as HTMLElement | null; if (el) { el.style.transform = "scale(.615)"; el.style.transformOrigin = "0 0"; } }}
          style={{ width: 400, height: 850 }} pointerEvents="none">
          {renderApp(id)}
        </View>
      </View>
    </View>
  );
}

export function Recents({ onOpen }: { onOpen: (id: AppId, r: AppRect | null) => void }) {
  const strip = React.useRef<View>(null);
  const ids = sys.recents;
  React.useEffect(() => {
    const el = domOf(strip);
    if (!el) return;
    el.style.transform = "translateY(60px)";
    el.style.opacity = "0";
    requestAnimationFrame(() => {
      el.style.transition = "transform .38s cubic-bezier(.2,.8,.3,1), opacity .3s";
      el.style.transform = "none";
      el.style.opacity = "1";
    });
  }, []);
  const close = () => set("switcherOpen", false);
  const clearAll = () => {
    ids.forEach((id, i) => setTimeout(() => killRecent(id), i * 55 + 300));
  };
  return (
    <View style={rs.root}>
      <Pressable style={rs.scrim} onPress={close} />
      {ids.length ? (
        <>
          <ScrollView ref={strip} horizontal style={{ flex: 1 }} contentContainerStyle={rs.strip} showsHorizontalScrollIndicator={false}>
            {ids.map((id) => <Card key={id} id={id} onOpen={onOpen} onKill={killRecent} />)}
          </ScrollView>
          <View style={rs.foot}>
            <Pressable style={rs.clear} onPress={clearAll}>
              <Icon n="trash" size={15} color="#fff" />
              <Text style={rs.clearTxt}>Clear all</Text>
            </Pressable>
            <Text style={rs.hint}>Swipe up to close · tap outside to exit</Text>
          </View>
        </>
      ) : (
        <View style={rs.empty}><Text style={rs.emptyTxt}>No recent apps</Text></View>
      )}
      <Pressable style={rs.homebar} onPress={close}><View style={rs.homebarI} /></Pressable>
    </View>
  );
}

const rs = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 45 } as object,
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(10,14,24,.35)" } as object,
  strip: { alignItems: "center", paddingHorizontal: 75, paddingTop: 30, paddingBottom: 10, gap: 22 } as object,
  card: { width: 246 } as object,
  name: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 10, marginLeft: 4 } as object,
  ic: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", position: "relative" } as object,
  nmTxt: { color: "#fff", fontSize: 15, fontWeight: "600" },
  app: {
    width: 246, height: 530, borderRadius: 26, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,.18)",
    shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: 24 },
  } as object,
  foot: { alignItems: "center", gap: 12, paddingBottom: 4 } as object,
  clear: {
    flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 26, paddingVertical: 11,
    borderRadius: 999, backgroundColor: "rgba(255,255,255,.14)", borderWidth: 1, borderColor: "rgba(255,255,255,.3)",
  } as object,
  clearTxt: { color: "#fff", fontSize: 14, fontWeight: "600" },
  hint: { color: "rgba(255,255,255,.75)", fontSize: 13, fontWeight: "500" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" } as object,
  emptyTxt: { color: "rgba(255,255,255,.7)", fontSize: 16, fontWeight: "600" },
  homebar: { height: 34, alignItems: "center", justifyContent: "center" } as object,
  homebarI: { width: 130, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,.85)" } as object,
});
