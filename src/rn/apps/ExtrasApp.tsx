// ExtrasApp.tsx — Notes, Files, Clock, Arcade : apps installables via l'App Store.
import React from "react";
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet } from "react-native";
import { Icon } from "../Icon";
import { GlassHeader, FloatingTabBar } from "./ui";
import { host } from "../host";
import { domOf } from "../fx";
import { fmtTime } from "../../system/state";

/* ============================== NOTES ============================== */
interface Note { id: number; title: string; body: string; ts: number }
const NOTE_KEY = "waveos.notes";
const seedNotes = (): Note[] => [
  { id: 1, title: "WaveOS ideas", body: "Spring-driven everything. Pill physics feel right — keep mass under 1 for UI, heavier for sheets.\n\nTry: stiffness 400 / damping 30 for the island.", ts: Date.now() - 86400000 },
  { id: 2, title: "Groceries", body: "Coffee, oats, eggs, basil, dark chocolate.", ts: Date.now() - 3600000 },
];
function loadNotes(): Note[] {
  try { return JSON.parse(localStorage.getItem(NOTE_KEY) || "null") ?? seedNotes(); }
  catch { return seedNotes(); }
}

export function NotesApp() {
  const [notes, setNotes] = React.useState<Note[]>(loadNotes);
  const [open, setOpen] = React.useState<Note | null>(null);
  const save = (ns: Note[]) => { setNotes([...ns]); localStorage.setItem(NOTE_KEY, JSON.stringify(ns)); };

  if (open) {
    const n = open;
    return (
      <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: 52 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12 }}>
          <Pressable onPress={() => setOpen(null)} style={{ padding: 8 }}>
            <Icon n="chevronLeft" size={22} color="#eab308" />
          </Pressable>
          <Pressable onPress={() => { save(notes.filter((x) => x.id !== n.id)); setOpen(null); }} style={{ padding: 8 }}>
            <Icon n="trash2" size={18} color="#ef4444" />
          </Pressable>
        </View>
        <TextInput style={ex.noteTitle} value={n.title} placeholder="Title" placeholderTextColor="#d1d5db"
          onChangeText={(t) => { n.title = t; n.ts = Date.now(); save(notes); }} />
        <TextInput style={ex.noteBody} value={n.body} placeholder="Start writing…" placeholderTextColor="#d1d5db" multiline
          onChangeText={(t) => { n.body = t; n.ts = Date.now(); save(notes); }} />
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: "#fafaf7" }}>
      <GlassHeader title="Notes" large />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }} nativeID="app-scroll">
        {notes.map((n) => (
          <Pressable key={n.id} style={ex.noteCard} onPress={() => setOpen(n)}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#111" }}>{n.title || "New Note"}</Text>
              <Text style={{ fontSize: 11, color: "#9ca3af", fontWeight: "600" }}>
                {new Date(n.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Text>
            </View>
            <Text numberOfLines={1} style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{n.body.split("\n")[0] || "No additional text"}</Text>
          </Pressable>
        ))}
        {!notes.length && (
          <View style={{ alignItems: "center", paddingVertical: 80 }}>
            <Icon n="list" size={40} color="#9ca3af" />
            <Text style={{ marginTop: 8, fontWeight: "600", color: "#9ca3af" }}>No Notes</Text>
          </View>
        )}
      </ScrollView>
      <Pressable style={ex.fab} onPress={() => {
        const n: Note = { id: Date.now(), title: "", body: "", ts: Date.now() };
        save([n, ...notes]); setOpen(n);
      }}>
        <Icon n="squarePen" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}

/* ============================== FILES ============================== */
interface FNode { name: string; dir?: boolean; size?: string; kids?: FNode[] }
const FS: FNode = {
  name: "Nyne Drive", dir: true, kids: [
    { name: "Design", dir: true, kids: [{ name: "sillage-tokens.json", size: "12 KB" }, { name: "icons.sketch", size: "8.4 MB" }, { name: "wallpapers", dir: true, kids: [{ name: "rubans.psd", size: "44 MB" }, { name: "yosemite.heic", size: "6.1 MB" }] }] },
    { name: "Documents", dir: true, kids: [{ name: "roadmap-2027.pdf", size: "1.2 MB" }, { name: "pitch.key", size: "18 MB" }] },
    { name: "Photos", dir: true, kids: [{ name: "yosemite-trip", dir: true, kids: [{ name: "IMG_0041.heic", size: "3.2 MB" }, { name: "IMG_0042.heic", size: "2.9 MB" }] }] },
    { name: "notes.txt", size: "2 KB" },
    { name: "waveos-spec.md", size: "48 KB" },
  ],
};

export function FilesApp() {
  const [depth, setDepth] = React.useState(0);
  const [path, setPath] = React.useState<FNode[]>([FS]);
  const goto = (i: number) => { setPath((p) => p.slice(0, i + 1)); setDepth(i); };
  const cwd = path[path.length - 1];
  const kids = [...(cwd.kids ?? [])].sort((a, b) => +!!b.dir - +!!a.dir || a.name.localeCompare(b.name));

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f2f7" }}>
      <GlassHeader title="Files" large />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: "center", paddingHorizontal: 20, paddingBottom: 0 }}>
        {path.map((n, i) => (
          <Pressable key={i} onPress={() => goto(i)} style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 13, fontWeight: i === path.length - 1 ? "700" : "500", color: i === path.length - 1 ? "#111" : "#3b82f6" }}>{n.name}</Text>
            {i < path.length - 1 && <Text style={{ color: "#d1d5db", marginHorizontal: 4 }}>›</Text>}
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 }} nativeID="app-scroll">
        {kids.map((n) => (
          <Pressable key={n.name} style={ex.frow} onPress={() => { if (n.dir) { setPath((p) => [...p, n]); setDepth((d) => d + 1); } }}>
            <View style={[ex.fic, { backgroundColor: n.dir ? "#3b82f6" : "#9ca3af" }]}>
              <Icon n={n.dir ? "folderOpen" : "file"} size={16} color="#fff" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "600", color: "#111" }}>{n.name}</Text>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>{n.dir ? `${n.kids!.length} items` : n.size}</Text>
            </View>
            {n.dir && <Icon n="chevronRight" size={16} color="#d1d5db" />}
          </Pressable>
        ))}
        {!kids.length && <Text style={{ textAlign: "center", paddingVertical: 60, color: "#9ca3af", fontWeight: "500" }}>Empty Folder</Text>}
      </ScrollView>
    </View>
  );
}

/* ============================== CLOCK ============================== */
const fmt = (ms: number) => {
  const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60, c = Math.floor(ms / 10) % 100;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(c).padStart(2, "0")}`;
};

export function ClockApp() {
  const [tab, setTab] = React.useState("world");
  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0f" }}>
      <View style={{ height: 56 }} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 112 }} nativeID="app-scroll">
        <Text style={{ fontSize: 34, fontWeight: "800", color: "#fff", marginBottom: 20, marginHorizontal: 4 }}>
          {{ world: "World Clock", alarms: "Alarms", stopwatch: "Stopwatch", timer: "Timer" }[tab]}
        </Text>
        {tab === "world" && <World />}
        {tab === "alarms" && <Alarms />}
        {tab === "stopwatch" && <Stopwatch />}
        {tab === "timer" && <Timer />}
      </ScrollView>
      <FloatingTabBar dark active={tab} onTab={setTab} tabs={[
        { id: "world", icon: "globe", label: "World" },
        { id: "alarms", icon: "bell", label: "Alarms" },
        { id: "stopwatch", icon: "clock", label: "Stopwatch" },
        { id: "timer", icon: "list", label: "Timer" },
      ]} />
    </View>
  );
}

function World() {
  const cities: [string, number][] = [["San Francisco", -7], ["New York", -4], ["London", 1], ["Paris", 2], ["Tokyo", 9]];
  const now = new Date();
  return (
    <View style={{ gap: 10 }}>
      {cities.map(([name, off]) => {
        const d = new Date(now.getTime() + off * 3600000 - now.getTimezoneOffset() * 60000);
        return (
          <View key={name} style={ex.darkCard}>
            <View>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,.5)", fontWeight: "600" }}>Today</Text>
              <Text style={{ fontSize: 20, fontWeight: "600", color: "#fff" }}>{name}</Text>
            </View>
            <Text style={{ fontSize: 30, fontWeight: "200", letterSpacing: -0.6, color: "#fff" }}>{fmtTime(d)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function Alarms() {
  const [on, setOn] = React.useState([true, true, false]);
  const rows: [string, string][] = [["7:00 AM", "Wake up"], ["8:30 AM", "Standup"], ["10:00 PM", "Wind down"]];
  return (
    <View style={{ gap: 10 }}>
      {rows.map(([t, l], i) => (
        <View key={t} style={ex.darkCard}>
          <View>
            <Text style={{ fontSize: 34, fontWeight: "200", color: "#fff" }}>{t}</Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,.5)" }}>{l}</Text>
          </View>
          <Pressable onPress={() => setOn((o) => o.map((v, j) => (j === i ? !v : v)))}
            style={[ex.tog, { backgroundColor: on[i] ? "#22c55e" : "rgba(255,255,255,.15)" }]}>
            <View style={[ex.togK, { alignSelf: on[i] ? "flex-end" : "flex-start" }]} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function Stopwatch() {
  const [disp, setDisp] = React.useState("00:00.00");
  const [running, setRunning] = React.useState(false);
  const [laps, setLaps] = React.useState<number[]>([]);
  const st = React.useRef({ t0: 0, acc: 0 });
  React.useEffect(() => {
    if (!running) return;
    let raf = 0;
    const loop = () => { setDisp(fmt(st.current.acc + performance.now() - st.current.t0)); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  const cur = () => st.current.acc + (running ? performance.now() - st.current.t0 : 0);
  return (
    <View>
      <Text style={ex.chrono}>{disp}</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16 }}>
        <Pressable style={[ex.swBtn, { backgroundColor: "rgba(255,255,255,.12)" }]}
          onPress={() => { if (running) setLaps((l) => [cur(), ...l]); else { st.current.acc = 0; setLaps([]); setDisp("00:00.00"); } }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>{running ? "Lap" : "Reset"}</Text>
        </Pressable>
        <Pressable style={[ex.swBtn, { backgroundColor: running ? "rgba(239,68,68,.15)" : "rgba(34,197,94,.15)" }]}
          onPress={() => { if (running) { st.current.acc += performance.now() - st.current.t0; } else { st.current.t0 = performance.now(); } setRunning(!running); }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: running ? "#f87171" : "#4ade80" }}>{running ? "Stop" : "Start"}</Text>
        </Pressable>
      </View>
      <View style={{ marginTop: 24 }}>
        {laps.map((l, i) => (
          <View key={i} style={ex.lap}>
            <Text style={{ color: "rgba(255,255,255,.5)", fontVariant: "tabular-nums" }}>Lap {laps.length - i}</Text>
            <Text style={{ color: "#fff", fontVariant: "tabular-nums" }}>{fmt(l)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Timer() {
  const [left, setLeft] = React.useState(300);
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setLeft((v) => { if (v <= 1) { setOn(false); return 0; } return v - 1; }), 1000);
    return () => clearInterval(id);
  }, [on]);
  return (
    <View>
      <Text style={ex.chrono}>{`${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}</Text>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 16 }}>
        {([[60, "+1m"], [300, "+5m"], [600, "+10m"]] as [number, string][]).map(([s, l]) => (
          <Pressable key={l} style={ex.tBtn} onPress={() => setLeft((v) => v + s)}>
            <Text style={{ fontWeight: "600", color: "#fff" }}>{l}</Text>
          </Pressable>
        ))}
        <Pressable style={[ex.tBtn, { backgroundColor: on ? "#f97316" : "#22c55e" }]} onPress={() => setOn(!on)}>
          <Text style={{ fontWeight: "700", color: "#fff" }}>{on ? "Pause" : "Start"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ============================== ARCADE — « Ripple » ============================== */
interface Ring { id: number; x: number; y: number; size: number }
export function ArcadeApp() {
  const [score, setScore] = React.useState(0);
  const [lives, setLives] = React.useState(3);
  const [best, setBest] = React.useState(() => +(localStorage.getItem("waveos.ripple-best") || "0"));
  const [playing, setPlaying] = React.useState(false);
  const [rings, setRings] = React.useState<Ring[]>([]);
  const state = React.useRef({ score: 0, lives: 3, playing: false, seq: 0 });
  const bgRef = React.useRef<View>(null);
  const ovRef = React.useRef<View>(null);
  React.useEffect(() => {
    const b = domOf(bgRef);
    if (b) b.style.background = "radial-gradient(120% 90% at 50% 0%, #312e81 0%, #0a0a1a 60%)";
    const o = domOf(ovRef);
    if (o) { o.style.backdropFilter = "blur(8px)"; (o.style as unknown as Record<string, string>).WebkitBackdropFilter = "blur(8px)"; }
  }, []);

  const killRing = React.useCallback((id: number, hit: boolean) => {
    setRings((rs) => rs.filter((r) => r.id !== id));
    if (hit) { state.current.score += 10; setScore(state.current.score); }
    else {
      state.current.lives -= 1; setLives(state.current.lives);
      if (state.current.lives <= 0) {
        state.current.playing = false; setPlaying(false);
        const b = Math.max(best, state.current.score);
        setBest(b); localStorage.setItem("waveos.ripple-best", String(b));
      }
    }
  }, [best]);

  React.useEffect(() => {
    if (!playing) return;
    let alive = true, t = 0;
    const spawn = () => {
      if (!alive || !state.current.playing) return;
      const size = 56 + Math.random() * 40;
      const ring: Ring = {
        id: ++state.current.seq,
        x: 20 + Math.random() * (300 - size),
        y: 140 + Math.random() * (480 - size),
        size,
      };
      const life = Math.max(650, 1600 - state.current.score * 22);
      setRings((rs) => [...rs, ring]);
      setTimeout(() => { if (alive) killRing(ring.id, false); }, life);
      t = window.setTimeout(spawn, Math.max(420, 900 - state.current.score * 6));
    };
    spawn();
    return () => { alive = false; clearTimeout(t); };
  }, [playing, killRing]);

  const start = () => {
    state.current = { score: 0, lives: 3, playing: true, seq: state.current.seq };
    setScore(0); setLives(3); setRings([]); setPlaying(true);
  };

  return (
    <View style={{ flex: 1, overflow: "hidden", backgroundColor: "#0a0a1a" }}>
      <View ref={bgRef} style={StyleSheet.absoluteFill as object} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 64, paddingHorizontal: 24, zIndex: 5 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Score  {score}</Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {[0, 1, 2].map((i) => <Icon key={i} n="heart" size={18} color={i < lives ? "#f87171" : "rgba(255,255,255,.15)"} />)}
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#a5b4fc" }}>Best  {best}</Text>
      </View>
      {rings.map((r) => (
        <Pressable key={r.id} onPress={() => killRing(r.id, true)}
          style={[ex.ring, { left: r.x, top: r.y, width: r.size, height: r.size, borderRadius: r.size / 2 }]} />
      ))}
      <Pressable style={ex.arcadeX} onPress={() => host.closeApp()}>
        <Icon n="x" size={16} color="#fff" />
      </Pressable>
      {!playing && (
        <View ref={ovRef} style={ex.overlay}>
          <Text style={{ fontSize: 14, fontWeight: "800", letterSpacing: 2, color: "#a5b4fc" }}>WAVEOS ARCADE</Text>
          {lives <= 0 && state.current.score > 0
            ? <><Text style={{ fontSize: 36, fontWeight: "800", color: "#fff" }}>Game Over</Text>
              <Text style={{ fontSize: 18, color: "rgba(255,255,255,.7)" }}>Score {score} — Best {best}</Text></>
            : <><Text style={{ fontSize: 44, fontWeight: "800", color: "#fff" }}>Ripple</Text>
              <Text style={{ fontSize: 15, color: "rgba(255,255,255,.6)", textAlign: "center", paddingHorizontal: 40 }}>Tap the rings before they fade. Miss three and it's over.</Text></>}
          <Pressable onPress={start} style={ex.playBtn}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#fff" }}>{state.current.score > 0 ? "Play Again" : "Play"}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const ex = StyleSheet.create({
  noteCard: { backgroundColor: "#fff", borderRadius: 20, padding: 16, paddingHorizontal: 18, marginBottom: 10, borderWidth: 1, borderColor: "#f3f4f6" } as object,
  noteTitle: { fontSize: 24, fontWeight: "700", color: "#111", paddingHorizontal: 20, paddingTop: 16, outlineStyle: "none" } as object,
  noteBody: { flex: 1, fontSize: 16, lineHeight: 25, color: "#1f2937", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, outlineStyle: "none" } as object,
  fab: {
    position: "absolute", bottom: 36, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#eab308", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#fde047", zIndex: 30,
  } as object,
  frow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 18, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#f3f4f6" } as object,
  fic: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" } as object,
  darkCard: {
    padding: 18, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "rgba(255,255,255,.06)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,.1)",
  } as object,
  tog: { width: 52, height: 32, borderRadius: 16, padding: 3, justifyContent: "center" } as object,
  togK: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#fff" } as object,
  chrono: { fontSize: 64, fontWeight: "200", textAlign: "center", color: "#fff", fontVariant: "tabular-nums", marginVertical: 40 } as object,
  swBtn: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" } as object,
  lap: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,.08)" } as object,
  tBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999, backgroundColor: "rgba(255,255,255,.1)" } as object,
  ring: { position: "absolute", borderWidth: 4, borderColor: "#818cf8", backgroundColor: "rgba(129,140,248,.15)" } as object,
  arcadeX: {
    position: "absolute", top: 60, right: 20, padding: 10, borderRadius: 999, zIndex: 20,
    backgroundColor: "rgba(255,255,255,.12)",
  } as object,
  overlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10,
    alignItems: "center", justifyContent: "center", gap: 16, backgroundColor: "rgba(5,5,20,.6)",
  } as object,
  playBtn: { paddingVertical: 16, paddingHorizontal: 40, borderRadius: 999, backgroundColor: "#7c3aed", borderWidth: 1, borderColor: "rgba(255,255,255,.3)" } as object,
});
