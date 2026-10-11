// Spotlight.tsx — recherche style iOS : la capsule de l'accueil se morphe en
// barre de recherche (FLIP), résultats en fondu, referme en inverse.
import * as React from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { Spring, SPRINGS, onFrame, domOf, lerp } from "./fx";
import { Icon } from "./Icon";
import { APPS, EXTRA_APPS, INSTALLED, appMeta } from "../apps/registry";
import type { AppId } from "../system/state";

function Grad({ color, style, children }: { color: string; style?: object; children?: React.ReactNode }) {
  const r = React.useRef<View>(null);
  React.useEffect(() => { const el = domOf(r); if (el) el.style.background = color; }, [color]);
  return <View ref={r} style={style}>{children}</View>;
}

export function Spotlight({ onOpen, onClose }: { onOpen: (id: AppId) => void; onClose: () => void }) {
  const wrap = React.useRef<View>(null);
  const barRef = React.useRef<View>(null);
  const listRef = React.useRef<View>(null);
  const scrimRef = React.useRef<View>(null);
  const ms = React.useMemo(() => new Spring(0, SPRINGS.morph[0], SPRINGS.morph[1]), []);
  const g = React.useRef({ dx: 0, dy: 0, sx: 1, sy: 1 });
  const closing = React.useRef(false);
  const capsule = React.useRef<HTMLElement | null>(null);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    const cap = document.querySelector<HTMLElement>("#search-capsule");
    capsule.current = cap ?? null;
    if (cap) cap.style.opacity = "0";
    const phone = domOf(wrap)?.parentElement;
    const bar = domOf(barRef);
    if (phone && bar && cap) {
      bar.style.transform = "none";
      const pr = phone.getBoundingClientRect();
      const kx = phone.clientWidth / pr.width, ky = phone.clientHeight / pr.height;
      const c = cap.getBoundingClientRect(), b = bar.getBoundingClientRect();
      g.current = {
        dx: (c.left - b.left) * kx, dy: (c.top - b.top) * ky,
        sx: (c.width / b.width) * kx * (pr.width / phone.clientWidth),
        sy: (c.height / b.height) * ky * (pr.height / phone.clientHeight),
      };
    }
    ms.to(1);
    const t = setTimeout(() => { if (!closing.current) document.querySelector<HTMLInputElement>("#spot-input")?.focus(); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const off = onFrame((dt) => {
      ms.step(dt);
      const el = domOf(wrap); if (!el) return;
      const t = ms.v, iv = 1 - t;
      const scrim = domOf(scrimRef), bar = domOf(barRef), list = domOf(listRef);
      if (scrim) scrim.style.opacity = t.toFixed(3);
      el.style.pointerEvents = t > 0.05 ? "auto" : "none";
      if (bar) {
        const dx = g.current.dx * iv, dy = g.current.dy * iv;
        const sx = lerp(g.current.sx, 1, t), sy = lerp(g.current.sy, 1, t);
        bar.style.transformOrigin = "0 0";
        bar.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
        bar.style.opacity = Math.min(1, Math.max(0, t / 0.25)).toFixed(3);
        const r = lerp(17, 28, t);
        bar.style.borderRadius = `${(r / sx).toFixed(1)}px / ${(r / sy).toFixed(1)}px`;
        for (const kid of Array.from(bar.children)) (kid as HTMLElement).style.opacity = Math.min(1, Math.max(0, (t - 0.55) / 0.45)).toFixed(3);
      }
      if (list) {
        list.style.opacity = Math.min(1, Math.max(0, (t - 0.35) / 0.5)).toFixed(3);
        list.style.transform = `translateY(${(iv * 14).toFixed(1)}px)`;
      }
      if (capsule.current) capsule.current.style.opacity = closing.current
        ? Math.min(1, Math.max(0, (0.45 - t) / 0.45)).toFixed(3)
        : Math.min(1, Math.max(0, 1 - t / 0.25)).toFixed(3);
      if (t <= 0.01 && ms.settled) onClose();
    });
    return () => { off(); if (capsule.current) capsule.current.style.opacity = ""; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    ms.to(0);
    (document.activeElement as HTMLElement | null)?.blur?.();
  };

  const searchable = [...APPS, ...EXTRA_APPS.filter((a) => INSTALLED.has(a.id))];
  const matches = searchable.filter((a) => a.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <View ref={wrap} style={st.wrap} nativeID="spot">
      <Pressable ref={scrimRef} style={st.scrim} onPress={close} />
      <View style={st.inner} pointerEvents="box-none">
        <View ref={barRef} style={st.bar}>
          <Icon name="search" size={20} color="#fff" />
          <TextInput nativeID="spot-input" style={st.input} value={q} onChangeText={setQ} placeholder="Search" placeholderTextColor="rgba(255,255,255,.5)" />
          <Pressable style={st.x} onPress={close}><Icon name="x" size={16} color="#fff" /></Pressable>
        </View>
        <View ref={listRef} style={st.list}>
          {matches.map((a) => {
            const m = appMeta(a.id);
            return (
              <Pressable key={a.id} style={st.row} onPress={() => { onOpen(a.id); close(); }}>
                <Grad color={m.color} style={st.tile}><Icon name={m.icon} size={26} color="#fff" /></Grad>
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>{m.name}</Text>
                <View style={{ marginLeft: "auto" }}><Icon name="chevronRight" size={16} color="rgba(255,255,255,.4)" /></View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 60 } as object,
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,.4)" } as object,
  inner: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as object,
  bar: {
    position: "absolute", top: 120, left: 20, right: 20, height: 56, borderRadius: 28,
    backgroundColor: "rgba(30,30,36,.85)", flexDirection: "row", alignItems: "center",
    paddingHorizontal: 18, gap: 12,
  } as object,
  input: { flex: 1, color: "#fff", fontSize: 18, fontWeight: "500", padding: 0, outlineStyle: "none" } as object,
  x: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,.15)", alignItems: "center", justifyContent: "center" } as object,
  list: { position: "absolute", top: 196, left: 20, right: 20, gap: 4 } as object,
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 8, paddingHorizontal: 6 } as object,
  tile: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" } as object,
});
