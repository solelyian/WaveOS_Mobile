// ui.tsx — kit UI Sillage pour les apps React Native.
// Primitives partagées : écran, barre de navigation (petit titre + grand
// titre), groupes de listes, lignes, champs de recherche, tabs, avatar,
// badge, segmented, switch (RN natif), boutons, sparkline, anneaux.
// Tout lit la palette du ThemeRoot — sombre/clair automatique.
import type { ReactNode } from "react";
import { useState } from "react";
import { Pressable, ScrollView, Switch as RNSwitch, Text, TextInput, View } from "react-native";
import { fs, useTheme, type Palette } from "./theme";
import { Icon } from "./icons";

/* ---------- base ---------- */

export function Scr({ children, pad = 0, scroll = true, bottomPad = 24 }: {
  children: ReactNode; pad?: number; scroll?: boolean; bottomPad?: number;
}): ReactNode {
  const p = useTheme();
  const inner = (
    <View style={{ paddingHorizontal: pad, paddingBottom: bottomPad, flexGrow: 1 }}>
      {children}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      {scroll
        ? <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>{inner}</ScrollView>
        : inner}
    </View>
  );
}

export function Nav({ title, large, left, right, back, onBack, transparent }: {
  title?: string; large?: string; left?: ReactNode; right?: ReactNode;
  back?: string; onBack?: () => void; transparent?: boolean;
}): ReactNode {
  const p = useTheme();
  return (
    <View style={{
      paddingTop: 54, paddingHorizontal: 16, paddingBottom: 8,
      backgroundColor: transparent ? "transparent" : p.bg, zIndex: 5,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", minHeight: 40, gap: 8 }}>
        {onBack !== undefined && (
          <Pressable onPress={onBack} style={{ flexDirection: "row", alignItems: "center", marginLeft: -6, paddingRight: 2 }}>
            <Icon name="chevron-left" size={24} color={p.tint} sw={2.4} />
            {back ? <Text style={{ fontSize: fs(16, p), color: p.tint, marginLeft: -3 }}>{back}</Text> : null}
          </Pressable>
        )}
        {left}
        {title ? (
          <Text style={{ flex: 1, textAlign: "center", fontSize: fs(16, p), fontWeight: "600", color: p.text }} numberOfLines={1}>{title}</Text>
        ) : <View style={{ flex: 1 }} />}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>{right}</View>
      </View>
      {large ? (
        <Text style={{ fontSize: fs(31, p), fontWeight: "700", letterSpacing: -0.5, color: p.text, marginTop: 4, marginBottom: 6 }}>
          {large}
        </Text>
      ) : null}
    </View>
  );
}

/* ---------- listes ---------- */

export function Group({ children, style }: { children: ReactNode; style?: object }): ReactNode {
  const p = useTheme();
  return (
    <View style={[{
      backgroundColor: p.card, borderRadius: 18, overflow: "hidden",
      borderWidth: 0.5, borderColor: p.sep, marginBottom: 14,
    }, style]}>
      {children}
    </View>
  );
}

export function Row({ icon, iconBg, title, sub, right, onPress, last, center }: {
  icon?: string; iconBg?: string; title: string; sub?: string;
  right?: ReactNode; onPress?: () => void; last?: boolean; center?: boolean;
}): ReactNode {
  const p = useTheme();
  const [hov, setHov] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onPress ? () => setHov(true) : undefined}
      onHoverOut={onPress ? () => setHov(false) : undefined}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: "row", alignItems: center ? "center" : "center",
        gap: 11, paddingVertical: 11, paddingHorizontal: 14, minHeight: 48,
        borderBottomWidth: last ? 0 : 0.5, borderBottomColor: p.sep,
        backgroundColor: pressed || hov ? p.card2 : "transparent",
        cursor: onPress ? "pointer" : "default",
      })}
    >
      {icon ? (
        <View style={{
          width: 30, height: 30, borderRadius: 8, backgroundColor: iconBg ?? p.tint,
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon name={icon} size={17} color="#fff" sw={2.1} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: fs(15, p), fontWeight: "500", color: p.text }} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={{ fontSize: fs(12, p), color: p.sub, marginTop: 1 }} numberOfLines={2}>{sub}</Text> : null}
      </View>
      {right}
      {onPress ? <Icon name="chevron-right" size={16} color={p.faint} sw={2.4} /> : null}
    </Pressable>
  );
}

export function SecTitle({ children }: { children: string }): ReactNode {
  const p = useTheme();
  return (
    <Text style={{
      fontSize: fs(12, p), fontWeight: "600", color: p.sub, textTransform: "uppercase",
      letterSpacing: 0.5, marginLeft: 18, marginBottom: 6, marginTop: 6,
    }}>{children}</Text>
  );
}

export function Search({ value, onChange, ph = "Rechercher" }: {
  value: string; onChange: (v: string) => void; ph?: string;
}): ReactNode {
  const p = useTheme();
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 7, marginHorizontal: 16,
      marginBottom: 10, paddingHorizontal: 10, height: 36, borderRadius: 11,
      backgroundColor: p.field,
    }}>
      <Icon name="search" size={15} color={p.faint} sw={2.4} />
      <TextInput
        value={value} onChangeText={onChange} placeholder={ph}
        placeholderTextColor={p.faint}
        style={{ flex: 1, fontSize: fs(15, p), color: p.text, outlineStyle: "none" } as object}
      />
      {value ? (
        <Pressable onPress={() => onChange("")} style={{ padding: 2 }}>
          <Icon name="x" size={13} color={p.faint} sw={3} />
        </Pressable>
      ) : null}
    </View>
  );
}

/* ---------- contrôles ---------- */

export function Seg({ items, idx, onChange }: {
  items: string[]; idx: number; onChange: (i: number) => void;
}): ReactNode {
  const p = useTheme();
  return (
    <View style={{
      flexDirection: "row", marginHorizontal: 16, marginBottom: 12,
      backgroundColor: p.field, borderRadius: 10, padding: 2,
    }}>
      {items.map((it, i) => (
        <Pressable key={it} onPress={() => onChange(i)} style={{
          flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: "center",
          backgroundColor: i === idx ? p.card2 : "transparent",
        }}>
          <Text style={{
            fontSize: fs(12.5, p), fontWeight: i === idx ? "600" : "400",
            color: i === idx ? p.text : p.sub,
          }}>{it}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Tg({ v, onChange }: { v: boolean; onChange: (v: boolean) => void }): ReactNode {
  const p = useTheme();
  return (
    <RNSwitch
      value={v} onValueChange={onChange}
      trackColor={{ false: p.field, true: p.jade }}
      thumbColor="#fff"
      style={{ transform: [{ scale: 0.82 }] } as object}
    />
  );
}

export function Avatar({ name, hue = 215, size = 38, tint }: {
  name: string; hue?: number; size?: number; tint?: string;
}): ReactNode {
  const p = useTheme();
  const initials = name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const bg = tint
    ? `linear-gradient(140deg, ${tint}, ${tint}cc)`
    : `linear-gradient(140deg, hsl(${hue} 60% 58%), hsl(${hue + 26} 55% 40%))`;
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2, flexShrink: 0,
      alignItems: "center", justifyContent: "center",
      background: bg, backgroundColor: p.card2,
    }}>
      <Text style={{ fontSize: size * 0.36, fontWeight: "650", color: "#fff" }}>{initials}</Text>
    </View>
  );
}

export function Badge({ n, tint }: { n: number; tint?: string }): ReactNode {
  const p = useTheme();
  if (!n) return null;
  return (
    <View style={{
      minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5,
      backgroundColor: tint ?? p.corail, alignItems: "center", justifyContent: "center",
    }}>
      <Text style={{ fontSize: fs(11.5, p), fontWeight: "700", color: "#fff" }}>{n}</Text>
    </View>
  );
}

export function TabBar({ items, idx, onChange }: {
  items: { icon: string; label: string }[]; idx: number; onChange: (i: number) => void;
}): ReactNode {
  const p = useTheme();
  return (
    <View style={{
      flexDirection: "row", borderTopWidth: 0.5, borderTopColor: p.sep,
      backgroundColor: p.dark ? "rgba(11,15,34,.85)" : "rgba(239,236,230,.85)",
      paddingTop: 6, paddingBottom: 16,
      backdropFilter: "blur(18px) saturate(1.6)", WebkitBackdropFilter: "blur(18px) saturate(1.6)",
    }}>
      {items.map((it, i) => (
        <Pressable key={it.label} onPress={() => onChange(i)} style={{ flex: 1, alignItems: "center", gap: 2, paddingVertical: 3 }}>
          <Icon name={it.icon} size={21} color={i === idx ? p.tint : p.faint} sw={i === idx ? 2.2 : 1.9} />
          <Text style={{ fontSize: fs(9.5, p), color: i === idx ? p.tint : p.faint, fontWeight: i === idx ? "600" : "400" }}>{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Empty({ icon, title, sub }: { icon: string; title: string; sub?: string }): ReactNode {
  const p = useTheme();
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 56, gap: 10 }}>
      <Icon name={icon} size={40} color={p.faint} sw={1.6} />
      <Text style={{ fontSize: fs(15, p), fontWeight: "600", color: p.sub }}>{title}</Text>
      {sub ? <Text style={{ fontSize: fs(12.5, p), color: p.faint, textAlign: "center", paddingHorizontal: 40 }}>{sub}</Text> : null}
    </View>
  );
}

/* ---------- divers ---------- */

export function Pill({ label, onPress, tint, icon, filled }: {
  label: string; onPress?: () => void; tint?: string; icon?: string; filled?: boolean;
}): ReactNode {
  const p = useTheme();
  const c = tint ?? p.tint;
  return (
    <Pressable onPress={onPress} style={{
      flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6,
      paddingHorizontal: 12, borderRadius: 15,
      backgroundColor: filled ? c : p.field,
    }}>
      {icon ? <Icon name={icon} size={13} color={filled ? "#fff" : c} sw={2.4} /> : null}
      <Text style={{ fontSize: fs(12.5, p), fontWeight: "600", color: filled ? "#fff" : c }}>{label}</Text>
    </Pressable>
  );
}

/** Mini-courbe SVG pour Bourse/Santé. */
export function Spark({ pts, w = 64, h = 22, color }: { pts: number[]; w?: number; h?: number; color: string }): ReactNode {
  const min = Math.min(...pts), max = Math.max(...pts), rg = max - min || 1;
  const d = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1) * w).toFixed(1)},${(h - 3 - (v - min) / rg * (h - 6)).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Grande courbe avec remplissage dégradé (détail Bourse). */
export function AreaChart({ pts, w = 361, h = 150, color }: { pts: number[]; w?: number; h?: number; color: string }): ReactNode {
  const min = Math.min(...pts), max = Math.max(...pts), rg = max - min || 1;
  const xs = pts.map((v, i) => [i / (pts.length - 1) * w, h - 8 - (v - min) / rg * (h - 16)] as const);
  const d = xs.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = xs[xs.length - 1];
  return (
    <svg width={w} height={h + 14} viewBox={`0 0 ${w} ${h + 14}`} aria-hidden="true">
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".3" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h + 14} L0,${h + 14} Z`} fill="url(#ag)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3.4" fill={color} stroke="#fff" strokeWidth="1.4" />
    </svg>
  );
}

/** Anneaux d'activité (Santé / widget). */
export function Rings({ size = 92, values = [0.72, 0.55, 0.85] }: { size?: number; values?: number[] }): ReactNode {
  const cols = ["#FF5F7A", "#9FE870", "#5AC8FA"];
  const r0 = size / 2 - 7, th = 9;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {values.map((v, i) => {
        const r = r0 - i * (th + 4), c = 2 * Math.PI * r;
        return (
          <g key={i}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={cols[i]} strokeOpacity=".18" strokeWidth={th} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={cols[i]} strokeWidth={th}
              strokeLinecap="round" strokeDasharray={`${c * v} ${c}`}
              transform={`rotate(-90 ${size / 2} ${size / 2})`} />
          </g>
        );
      })}
    </svg>
  );
}

export { fs, useTheme, type Palette };
