// SuperDevice.tsx — panneau « Nyne Link » : appareils en orbite autour du
// téléphone ; glisser vers le centre connecte, puis actions par type.
import * as React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Icon } from "./Icon";
import type { IconName } from "../core/lucide";
import { domOf, tween } from "./fx";

type DevKind = "screen" | "audio" | "companion";
const DEVICES: { id: string; name: string; icon: IconName; kind: DevKind }[] = [
  { id: "mbp", name: "MacBook Pro", icon: "laptop", kind: "screen" },
  { id: "ipad", name: "iPad Air", icon: "tablet", kind: "screen" },
  { id: "tv", name: "Living Room TV", icon: "tv", kind: "screen" },
  { id: "buds", name: "Nyne Buds", icon: "headphones", kind: "audio" },
  { id: "watch", name: "Nyne Watch", icon: "watch", kind: "companion" },
];
const R_OUT = 130, R_IN = 60, BUB = 62, CX = 200, CY = 300;
const home = (i: number, n: number) => {
  const a = (-90 + (i * 360) / n) * Math.PI / 180;
  return { x: CX + R_OUT * Math.cos(a) - BUB / 2, y: CY + R_OUT * Math.sin(a) - BUB / 2 };
};

export function SuperDevice() {
  const [docked, setDocked] = React.useState<string[]>([]);
  const [actions, setActions] = React.useState<typeof DEVICES[number] | null>(null);
  const [hot, setHot] = React.useState(false);
  const refs = React.useRef<Record<string, View | null>>({});

  const flyTo = (id: string, tx: number, ty: number, done?: () => void) => {
    const el = domOf({ current: refs.current[id] } as React.RefObject<View>);
    if (!el) { done?.(); return; }
    const ox = parseFloat(el.dataset.ox ?? "0"), oy = parseFloat(el.dataset.oy ?? "0");
    const cur = /translate\((-?\d+\.?\d*)px,\s*(-?\d+\.?\d*)px\)/.exec(el.style.transform);
    const fromX = ox + (cur ? +cur[1] : 0), fromY = oy + (cur ? +cur[2] : 0);
    tween(300, (v) => {
      el.style.transform = `translate(${(fromX + (tx - fromX) * v - ox).toFixed(1)}px,${(fromY + (ty - fromY) * v - oy).toFixed(1)}px)`;
    }, done);
  };

  const bind = (d: typeof DEVICES[number], i: number) => (e: React.SyntheticEvent) => {
    const el = domOf({ current: refs.current[d.id] } as React.RefObject<View>);
    if (!el) return;
    e.preventDefault();
    const { x: ox, y: oy } = home(i, DEVICES.length);
    el.dataset.ox = String(ox); el.dataset.oy = String(oy);
    const ne = e.nativeEvent as unknown as { clientX?: number; clientY?: number; pageX?: number; pageY?: number };
    let sx = ne.clientX ?? ne.pageX ?? 0, sy = ne.clientY ?? ne.pageY ?? 0;
    let seeded = sx !== 0 || sy !== 0;
    const mv = (ev: PointerEvent) => {
      if (!seeded) { sx = ev.clientX; sy = ev.clientY; seeded = true; }
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      el.style.transform = `translate(${dx}px,${dy}px)`;
      setHot(Math.hypot(ox + dx + BUB / 2 - CX, oy + dy + BUB / 2 - CY) < 78 && !docked.includes(d.id));
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      setHot(false);
      const near = Math.hypot(ox + dx + BUB / 2 - CX, oy + dy + BUB / 2 - CY) < 78;
      if (!docked.includes(d.id) && near) {
        const a = (-90 + docked.length * 72) * Math.PI / 180;
        const tx = CX + R_IN * Math.cos(a) - BUB / 2, ty = CY + R_IN * Math.sin(a) - BUB / 2;
        el.dataset.ox = String(tx); el.dataset.oy = String(ty);
        setDocked((p) => [...p, d.id]);
        flyTo(d.id, tx, ty);
        setActions(d);
      } else {
        const h = home(i, DEVICES.length);
        el.dataset.ox = String(h.x); el.dataset.oy = String(h.y);
        flyTo(d.id, h.x, h.y);
      }
    };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
  };

  const disconnect = (d: typeof DEVICES[number], i: number) => {
    setDocked((p) => p.filter((x) => x !== d.id));
    const h = home(i, DEVICES.length);
    const el = domOf({ current: refs.current[d.id] } as React.RefObject<View>);
    if (el) { el.dataset.ox = String(h.x); el.dataset.oy = String(h.y); }
    flyTo(d.id, h.x, h.y);
    setActions(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ alignItems: "center", paddingTop: 84 }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: "#fff" }}>Nyne Link</Text>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,.6)", marginTop: 4 }}>Drag a device to the center to connect</Text>
      </View>
      <View style={sd.stage}>
        <View style={sd.ring} pointerEvents="none" />
        {DEVICES.map((d, i) => {
          const h = home(i, DEVICES.length);
          const on = docked.includes(d.id);
          return (
            <Pressable key={d.id} ref={(r) => { refs.current[d.id] = r; }}
              onPressIn={bind(d, i)}
              style={[sd.dev, { left: h.x, top: h.y }, on && sd.devOn]}>
              <Icon name={d.icon} size={24} color="#fff" />
              <Text style={sd.lbl}>{d.name}</Text>
            </Pressable>
          );
        })}
        <View style={[sd.dev, sd.phone, { left: CX - BUB / 2, top: CY - BUB / 2 }, (hot || docked.length > 0) && sd.devOn]}>
          <Icon name="phone" size={26} color="#fff" />
          <Text style={sd.lbl}>WaveOS</Text>
        </View>
      </View>
      {actions && <Actions dev={actions} onDisconnect={() => disconnect(actions, DEVICES.indexOf(actions))} />}
      <View style={sd.handle}><View style={sd.handleI} /></View>
    </View>
  );
}

function Actions({ dev, onDisconnect }: { dev: typeof DEVICES[number]; onDisconnect: () => void }) {
  const [st2, setSt2] = React.useState({ mirror: false, prog: 0, progT: "", routed: "", sync: "" });
  const cardRef = React.useRef<View>(null);
  React.useEffect(() => {
    const el = domOf(cardRef);
    if (el) { el.style.backdropFilter = "blur(20px) saturate(140%)"; (el.style as unknown as Record<string, string>).WebkitBackdropFilter = "blur(20px) saturate(140%)"; }
  }, []);
  const Btn = ({ icon, label, fn }: { icon: IconName; label: string; fn: () => void }) => (
    <Pressable style={sd.act} onPress={fn}>
      <Icon name={icon} size={18} color="#fff" />
      <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
  return (
    <View ref={cardRef} style={sd.card}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Icon name={dev.icon} size={20} color="#fff" />
        <Text style={{ color: "#fff", fontWeight: "700" }}>{dev.name}</Text>
        <Text style={{ color: "#4ade80", fontSize: 12, fontWeight: "600" }}>Connected — {dev.name}</Text>
      </View>
      {dev.kind === "screen" && (
        <>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Btn icon="airplay" label="Share screen" fn={() => setSt2((s) => ({ ...s, mirror: !s.mirror }))} />
            <Btn icon="fileUp" label="Send file" fn={() => {
              setSt2((s) => ({ ...s, progT: "Sending…", prog: 0 }));
              tween(2400, (v) => setSt2((s) => ({ ...s, prog: v })), () => setSt2((s) => ({ ...s, progT: "Sent ✓" })));
            }} />
          </View>
          {st2.mirror && (
            <View style={sd.mirror}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={sd.liveDot} /><Text style={{ color: "#f87171", fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>MIRRORING</Text>
              </View>
              <Text style={{ color: "rgba(255,255,255,.5)", fontSize: 12 }}>to {dev.name}</Text>
            </View>
          )}
          {st2.progT !== "" && (
            <View style={sd.prog}><View style={[sd.progI, { width: `${st2.prog * 100}%` as unknown as number }]} /></View>
          )}
          <Text style={{ color: "rgba(255,255,255,.6)", fontSize: 12 }}>{st2.progT}</Text>
        </>
      )}
      {dev.kind === "audio" && (
        <>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Btn icon="volume2" label="Route audio" fn={() => setSt2((s) => ({ ...s, routed: s.routed === `Audio routed to ${dev.name}` ? "" : `Audio routed to ${dev.name}` }))} />
            <Btn icon="music" label="Play on device" fn={() => setSt2((s) => ({ ...s, routed: `Now playing on ${dev.name}` }))} />
          </View>
          <Text style={{ color: "#4ade80", fontSize: 12, fontWeight: "600" }}>{st2.routed}</Text>
        </>
      )}
      {dev.kind === "companion" && (
        <>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Btn icon="rotateCcw" label="Sync now" fn={() => {
              setSt2((s) => ({ ...s, sync: "Syncing…" }));
              tween(1400, () => {}, () => setSt2((s) => ({ ...s, sync: "Synced ✓" })));
            }} />
            <Btn icon="bell" label="Ping device" fn={() => setSt2((s) => ({ ...s, sync: `${dev.name} is ringing` }))} />
          </View>
          <Text style={{ color: "#4ade80", fontSize: 12, fontWeight: "600" }}>{st2.sync}</Text>
        </>
      )}
      <Pressable style={sd.disc} onPress={onDisconnect}>
        <Text style={{ color: "#f87171", fontWeight: "700", fontSize: 14 }}>Disconnect</Text>
      </Pressable>
    </View>
  );
}

const sd = StyleSheet.create({
  ring: { position: "absolute", left: 200 - 130, top: 300 - 130, width: 260, height: 260, borderRadius: 130, borderWidth: 1, borderColor: "rgba(255,255,255,.14)" } as object,
  stage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as object,
  dev: {
    position: "absolute", width: BUB, height: BUB, borderRadius: 31, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,.12)", borderWidth: 1, borderColor: "rgba(255,255,255,.2)", zIndex: 5,
  } as object,
  devOn: { backgroundColor: "rgba(96,165,250,.35)", borderColor: "#60a5fa" } as object,
  phone: { backgroundColor: "rgba(255,255,255,.2)", zIndex: 6 } as object,
  lbl: { fontSize: 8, fontWeight: "600", color: "rgba(255,255,255,.7)", marginTop: 2, textAlign: "center" },
  card: {
    position: "absolute", bottom: 100, left: 20, right: 20, borderRadius: 24, padding: 16,
    backgroundColor: "rgba(24,24,30,.8)", borderWidth: 1, borderColor: "rgba(255,255,255,.15)", zIndex: 10,
  } as object,
  act: {
    flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,.1)", borderRadius: 16,
  } as object,
  mirror: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: "rgba(0,0,0,.4)", gap: 6 } as object,
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" },
  prog: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,.15)", marginTop: 10, overflow: "hidden" } as object,
  progI: { height: 6, backgroundColor: "#60a5fa", borderRadius: 3 } as object,
  disc: { marginTop: 12, alignItems: "center", paddingVertical: 10, borderRadius: 16, backgroundColor: "rgba(255,255,255,.08)" } as object,
  handle: { position: "absolute", bottom: 12, left: 0, right: 0, alignItems: "center" } as object,
  handleI: { width: 120, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,.4)" },
});
