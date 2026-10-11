// apps/ui.tsx — kit RN partagé des apps : en-tête verre, lignes Réglages,
// interrupteur iOS, sous-page glissée, toasts, pill de recherche.
import React from "react";
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from "react-native";
import { Icon } from "../Icon";
import type { IconName } from "../../core/lucide";
import { Spring, SPRINGS, domOf, onFrame } from "../fx";
import { host, onToasts, toasts } from "../host";

/* ---------- GlassHeader : rangée back/action + titre (large ou compact) ---------- */
export function GlassHeader({ title, large, action, onAction, onBack, color = "#111" }: {
  title: string; large?: boolean; action?: IconName; onAction?: () => void; onBack?: () => void; color?: string;
}) {
  return (
    <View style={uh.hdr} nativeID="ghdr">
      <View style={uh.hdrRow}>
        <Pressable style={uh.gbtn} onPress={() => (onBack ?? host.closeApp)()}>
          <Icon n="chevronLeft" size={18} color={color} />
        </Pressable>
        {action ? (
          <Pressable style={uh.gbtn} onPress={onAction}>
            <Icon n={action} size={18} color={color} />
          </Pressable>
        ) : <View style={{ width: 34 }} />}
      </View>
      {large ? <Text style={[uh.h1, { color }]}>{title}</Text> : null}
      {!large ? <Text style={[uh.ttlSm, { color }]}>{title}</Text> : null}
    </View>
  );
}

/* ---------- iOS switch ---------- */
export function IOSSwitch({ on, onFlip }: { on: boolean; onFlip: (v: boolean) => void }) {
  const [v, setV] = React.useState(on);
  return (
    <Pressable
      style={[uh.sw, v && uh.swOn]}
      onPress={() => { const nv = !v; setV(nv); onFlip(nv); }}
      accessibilityRole="switch"
    >
      <View style={[uh.knob, v && { transform: [{ translateX: 20 }] }]} />
    </Pressable>
  );
}

/* ---------- SetRow : ligne de liste Réglages ---------- */
export function SetRow({ icon, bg, label, value, onPress, end }: {
  icon: IconName; bg: string; label: string; value?: string;
  onPress?: () => void; end?: React.ReactNode;
}) {
  return (
    <Pressable style={uh.row} onPress={onPress} disabled={!onPress}>
      <View style={[uh.ic, { backgroundColor: bg }]}>
        <Icon n={icon} size={17} color="#fff" />
      </View>
      <Text style={uh.lbl} numberOfLines={1}>{label}</Text>
      {value ? <Text style={uh.val} numberOfLines={1}>{value}</Text> : null}
      {end ?? (onPress ? <Icon n="chevronRight" size={16} color="#c7c7cc" /> : null)}
    </Pressable>
  );
}
export function ToggleRow({ icon, bg, label, on, onFlip }: {
  icon: IconName; bg: string; label: string; on: boolean; onFlip: (v: boolean) => void;
}) {
  return <SetRow icon={icon} bg={bg} label={label} end={<IOSSwitch on={on} onFlip={onFlip} />} />;
}

/* ---------- Groupes / légendes ---------- */
export function Group({ children }: { children: React.ReactNode }) {
  return <View style={uh.group}>{children}</View>;
}
export function Cap({ children }: { children: string }) {
  return <Text style={uh.cap}>{children}</Text>;
}
export function Bar({ frac, color, h = 8 }: { frac: number; color: string; h?: number }) {
  return (
    <View style={{ height: h, borderRadius: h / 2, backgroundColor: "rgba(0,0,0,.08)", overflow: "hidden" }}>
      <View style={{ height: "100%" as unknown as number, width: `${Math.round(frac * 100)}%` as unknown as number, borderRadius: h / 2, backgroundColor: color }} />
    </View>
  );
}

/* ---------- Sous-page : panneau glissant depuis la droite ---------- */
export function PageSlide({ title, children, onClose }: {
  title: string; children: React.ReactNode; onClose: () => void;
}) {
  const el = React.useRef<View>(null);
  React.useEffect(() => {
    const node = domOf(el);
    const sp = new Spring(400, ...SPRINGS.snap);
    if (node) node.style.transform = "translateX(400px)";
    requestAnimationFrame(() => sp.to(0));
    const off = onFrame((dt) => {
      sp.step(dt);
      const n = domOf(el);
      if (n) n.style.transform = `translateX(${sp.v.toFixed(1)}px)`;
    });
    return () => { off(); };
  }, []);
  return (
    <View ref={el} style={uh.pane}>
      <View style={uh.paneHdr}>
        <Pressable style={uh.gbtn} onPress={onClose}>
          <Icon n="chevronLeft" size={18} color="#111" />
        </Pressable>
        <Text style={uh.paneTitle}>{title}</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {children}
      </ScrollView>
    </View>
  );
}

/* ---------- Pill de recherche ---------- */
export function SearchPill({ value, onChange, placeholder = "Search" }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <View style={uh.search}>
      <Icon n="search" size={15} color="#9ca3af" />
      <TextInput
        style={uh.searchIn} value={value} onChangeText={onChange}
        placeholder={placeholder} placeholderTextColor="#9ca3af"
      />
    </View>
  );
}

/* ---------- GBtn : bouton rond en verre ---------- */
export function GBtn({ icon, onPress, color = "#111", size = 34 }: {
  icon: IconName; onPress: () => void; color?: string; size?: number;
}) {
  return (
    <Pressable style={[uh.gbtn, { width: size, height: size, borderRadius: size / 2 }]} onPress={onPress}>
      <Icon n={icon} size={Math.round(size * 0.52)} color={color} />
    </Pressable>
  );
}

/* ---------- PageBlank : panneau glissant sans en-tête imposé ---------- */
export function PageBlank({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  const el = React.useRef<View>(null);
  React.useEffect(() => {
    const node = domOf(el);
    const sp = new Spring(400, ...SPRINGS.snap);
    if (node) node.style.transform = "translateX(400px)";
    requestAnimationFrame(() => sp.to(0));
    const off = onFrame((dt) => {
      sp.step(dt);
      const n = domOf(el);
      if (n) n.style.transform = `translateX(${sp.v.toFixed(1)}px)`;
    });
    return () => { off(); };
  }, []);
  return <View ref={el} style={uh.pane}>{children}</View>;
}

/* ---------- FloatingTabBar : pill + dot portés par un spring ---------- */
export function FloatingTabBar({ tabs, active, onTab, dark }: {
  tabs: { id: string; icon: IconName; label: string }[];
  active: string; onTab: (id: string) => void; dark?: boolean;
}) {
  const inRef = React.useRef<View>(null);
  const pillRef = React.useRef<View>(null);
  const dotRef = React.useRef<View>(null);
  const w = React.useRef(0);
  const sx = React.useRef(new Spring(0, ...SPRINGS.snap)).current;
  const idx = Math.max(0, tabs.findIndex((t) => t.id === active));
  React.useEffect(() => {
    const el = domOf(inRef);
    if (el) {
      w.current = el.getBoundingClientRect().width;
      el.style.backdropFilter = "blur(22px) saturate(160%)";
      (el.style as unknown as Record<string, string>).WebkitBackdropFilter = "blur(22px) saturate(160%)";
    }
    const c = (idx + 0.5) * (w.current / tabs.length);
    sx.to(c);
    const off = onFrame((dt) => {
      sx.step(dt);
      const p = domOf(pillRef), d = domOf(dotRef);
      if (p) p.style.transform = `translateX(${sx.v - 24}px)`;
      if (d) d.style.transform = `translateX(${sx.v - 2}px)`;
    });
    return () => { off(); };
  }, [idx, tabs.length]);
  return (
    <View style={uh.tabbar}>
      <View ref={inRef} style={[uh.tabIn, dark ? uh.tabInDark : uh.tabInLight]}>
        {tabs.map((t) => (
          <Pressable key={t.id} style={uh.tabBtn} onPress={() => onTab(t.id)}>
            <Icon n={t.icon} size={24}
              color={t.id === active ? (dark ? "#fff" : "#2563eb") : dark ? "rgba(255,255,255,.6)" : "rgba(0,0,0,.6)"}
              style={t.id === active ? { transform: "scale(1.1)" } : undefined} />
          </Pressable>
        ))}
        <View ref={pillRef} style={[uh.tabPill, dark ? uh.pillDark : uh.pillLight]} pointerEvents="none" />
        <View ref={dotRef} style={[uh.tabDot, dark ? uh.dotDark : uh.dotLight]} pointerEvents="none" />
      </View>
    </View>
  );
}

/* ---------- Slider horizontal (réglages Luminosité / Volume) ---------- */
export function HSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const track = React.useRef<View>(null);
  const set = (x: number) => {
    const el = domOf(track);
    if (!el) return;
    const r = el.getBoundingClientRect();
    onChange(Math.max(0, Math.min(100, Math.round(((x - r.left) / r.width) * 100))));
  };
  return (
    <View
      ref={track}
      style={uh.htrack}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e: { nativeEvent: { pageX: number } }) => set(e.nativeEvent.pageX)}
      onResponderMove={(e: { nativeEvent: { pageX: number } }) => set(e.nativeEvent.pageX)}
    >
      <View style={[uh.hfill, { width: `${value}%` as unknown as number }]} />
      <View style={[uh.hknob, { left: `${value}%` as unknown as number }]} />
    </View>
  );
}

/* ---------- Couche toasts ---------- */
export function ToastLayer() {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => onToasts(force), []);
  const t = toasts[toasts.length - 1];
  if (!t) return null;
  return (
    <View style={uh.toastWrap} pointerEvents="none">
      <View style={uh.toast}><Text style={uh.toastTxt}>{t.text}</Text></View>
    </View>
  );
}

const uh = StyleSheet.create({
  hdr: { paddingTop: 58, paddingHorizontal: 16, paddingBottom: 10, zIndex: 5 },
  hdrRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  gbtn: {
    width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,.55)", borderWidth: 1, borderColor: "rgba(255,255,255,.6)",
  } as object,
  h1: { fontSize: 34, fontWeight: "800", letterSpacing: -0.8, color: "#111", marginTop: 8, marginLeft: 4 },
  ttlSm: { fontSize: 17, fontWeight: "700", color: "#111", textAlign: "center", marginTop: -24 },
  sw: { width: 51, height: 31, borderRadius: 16, backgroundColor: "#d1d1d6", padding: 2, justifyContent: "center" } as object,
  swOn: { backgroundColor: "#34c759" } as object,
  knob: { width: 27, height: 27, borderRadius: 14, backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } } as object,
  row: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, paddingHorizontal: 14,
    backgroundColor: "#fff",
  } as object,
  ic: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  lbl: { flex: 1, fontSize: 15, fontWeight: "500", color: "#111" },
  val: { fontSize: 14, color: "#9ca3af", maxWidth: 140 },
  group: { borderRadius: 16, overflow: "hidden", backgroundColor: "#fff", marginBottom: 14 } as object,
  cap: { fontSize: 12, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.7, marginHorizontal: 4, marginBottom: 6 },
  pane: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#f4f4f5", zIndex: 85,
  } as object,
  paneHdr: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 60, paddingHorizontal: 16, paddingBottom: 10 },
  paneTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  search: {
    flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 10,
    backgroundColor: "rgba(0,0,0,.06)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
  } as object,
  searchIn: { flex: 1, fontSize: 14, color: "#111", padding: 0, margin: 0, outlineStyle: "none" } as object,
  toastWrap: { position: "absolute", left: 0, right: 0, bottom: 60, alignItems: "center", zIndex: 90 } as object,
  toast: { backgroundColor: "rgba(20,20,24,.88)", borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 } as object,
  toastTxt: { color: "#fff", fontSize: 13, fontWeight: "600" },
  htrack: { height: 30, justifyContent: "center" } as object,
  hfill: { position: "absolute", left: 0, height: 6, borderRadius: 3, backgroundColor: "#2563eb" } as object,
  hknob: {
    position: "absolute", width: 26, height: 26, borderRadius: 13, marginLeft: -13,
    backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, borderWidth: 0.5, borderColor: "rgba(0,0,0,.08)",
  } as object,
  tabbar: { position: "absolute", bottom: 32, left: "5%" as unknown as number, width: "90%" as unknown as number, maxWidth: 360, height: 72, zIndex: 50 } as object,
  tabIn: { flex: 1, borderRadius: 36, overflow: "hidden", flexDirection: "row", alignItems: "center", paddingHorizontal: 4 } as object,
  tabInLight: { backgroundColor: "rgba(255,255,255,.55)", borderWidth: 1, borderColor: "rgba(255,255,255,.6)" } as object,
  tabInDark: { backgroundColor: "rgba(20,20,24,.55)", borderWidth: 1, borderColor: "rgba(255,255,255,.14)" } as object,
  tabBtn: { flex: 1, height: "100%" as unknown as number, alignItems: "center", justifyContent: "center", zIndex: 1 } as object,
  tabPill: { position: "absolute", top: 12, left: 0, width: 48, height: 48, borderRadius: 20 } as object,
  pillLight: { backgroundColor: "rgba(255,255,255,.2)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.6)" } as object,
  pillDark: { backgroundColor: "rgba(255,255,255,.1)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.2)" } as object,
  tabDot: { position: "absolute", top: 60, left: 0, width: 4, height: 4, borderRadius: 2 } as object,
  dotLight: { backgroundColor: "#2563eb" } as object,
  dotDark: { backgroundColor: "#fff" } as object,
});
