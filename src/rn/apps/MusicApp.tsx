// MusicApp.tsx — bibliothèque + lecteur complet : file de pistes, seek,
// shuffle/repeat, genres, radio, Up Next / Nyne Cast / actions — progression
// câblée sur le ticker partagé (system/media).
import React from "react";
import { View, Text, Pressable, Image, ScrollView, TextInput, StyleSheet } from "react-native";
import { Icon } from "../Icon";
import { sys, set } from "../../system/state";
import { useSys } from "../sys";
import { TRACKS, cur, next, prev, liked, fmtPos, mode } from "../../system/media";
import { toast } from "../host";
import { GlassHeader, FloatingTabBar, GBtn, PageBlank } from "./ui";
import { domOf, onFrame } from "../fx";

const GENRES: [string, string, number[]][] = [
  ["New Music", "linear-gradient(135deg,#f472b6,#be185d)", [0, 1, 4, 2, 3]],
  ["Charts", "linear-gradient(135deg,#60a5fa,#1d4ed8)", [1, 3, 0, 4, 2]],
  ["Moods", "linear-gradient(135deg,#a78bfa,#5b21b6)", [4, 2, 1, 0, 3]],
  ["Classics", "linear-gradient(135deg,#fbbf24,#b45309)", [2, 0, 3, 1, 4]],
  ["Workout", "linear-gradient(135deg,#34d399,#065f46)", [3, 1, 4, 0, 2]],
  ["Jazz", "linear-gradient(135deg,#f87171,#7f1d1d)", [4, 0, 2, 3, 1]],
];
const STATIONS: [string, string, number, boolean][] = [
  ["Wave One", "Pop hits & exclusives", 0, true],
  ["Chill Station", "Downtempo all day", 4, false],
  ["Night Drive FM", "Synthwave & beyond", 3, false],
];

type Pane = { kind: "player" } | { kind: "queue" } | { kind: "airplay" } | { kind: "genre"; name: string; order: number[] };

const listCard: object = {
  backgroundColor: "rgba(255,255,255,.05)", borderRadius: 24, paddingVertical: 4, paddingHorizontal: 14,
  borderWidth: 1, borderColor: "rgba(255,255,255,.08)",
};

function SubHdr({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={mu.thdr}>
      <GBtn icon="chevronLeft" color="#fff" onPress={onBack} />
      <Text style={{ fontWeight: "700", fontSize: 17, color: "#fff" }}>{title}</Text>
    </View>
  );
}

function Grad({ color, style, children }: { color: string; style?: object; children?: React.ReactNode }) {
  const r = React.useRef<View>(null);
  React.useEffect(() => { const el = domOf(r); if (el) el.style.background = color; }, [color]);
  return <View ref={r} style={style}>{children}</View>;
}

export function MusicApp() {
  const s = useSys();
  const [tab, setTab] = React.useState("listen");
  const [q, setQ] = React.useState("");
  const [panes, setPanes] = React.useState<Pane[]>([]);
  const push = (p: Pane) => setPanes((v) => [...v, p]);
  const pop = () => setPanes((v) => v.slice(0, -1));
  const [, bump] = React.useReducer((x: number) => x + 1, 0);

  const playTrack = (i: number) => { set("track", i); set("playing", true); push({ kind: "player" }); };

  const trackRow = (i: number) => {
    const t = TRACKS[i];
    return (
      <Pressable key={i} style={mu.lrow} onPress={() => playTrack(i)}>
        <Image source={{ uri: t.art }} style={mu.avSq} />
        <View style={{ flex: 1 }}>
          <Text style={[mu.t1, { color: i === s.track && s.playing ? "#22c55e" : "#fff" }]} numberOfLines={1}>{t.title}</Text>
          <Text style={mu.t2}>{t.artist}</Text>
        </View>
        {liked.has(i) ? <Icon n="heart" size={16} color="#fff" /> : <Text style={mu.rt}>{fmtPos(t.dur)}</Text>}
      </Pressable>
    );
  };

  return (
    <View style={mu.root}>
      <GlassHeader title="Music" large color="#fff" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} nativeID="app-scroll">
        {tab === "listen" && (
          <>
            <Pressable style={mu.hero} onPress={() => { set("playing", true); push({ kind: "player" }); }}>
              <Image source={{ uri: cur().art }} style={StyleSheet.absoluteFill as object} resizeMode="cover" />
              <View style={mu.heroVeil} />
              <View style={{ position: "absolute", left: 18, bottom: 16 }}>
                <Text style={mu.heroCap}>NOW PLAYING</Text>
                <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>{cur().title}</Text>
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,.7)" }}>{cur().artist}</Text>
              </View>
            </Pressable>
            <Text style={mu.sec}>Up Next</Text>
            <View style={listCard}>{TRACKS.map((_, i) => trackRow(i))}</View>
            <Text style={[mu.sec, { marginTop: 18 }]}>Top Picks</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {[["Mix One", "/img/mix-1.jpg"], ["Chill Waves", "/img/mix-2.jpg"], ["Deep Focus", "/img/mix-3.jpg"], ["Night Drive", "/img/mix-4.jpg"]].map(([n, src], i) => (
                <Pressable key={n} style={{ width: 140 }} onPress={() => push({ kind: "genre", name: n, order: TRACKS.map((_, k) => (k + i) % TRACKS.length) })}>
                  <Image source={{ uri: src }} style={{ width: 140, height: 140, borderRadius: 20 }} resizeMode="cover" />
                  <Text style={{ fontSize: 13, fontWeight: "600", marginTop: 6, color: "#fff" }}>{n}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
        {tab === "browse" && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {GENRES.map(([n, bg, order]) => (
              <Grad key={n} color={bg} style={mu.genre}>
                <Pressable style={{ flex: 1, justifyContent: "flex-end", padding: 14 }} onPress={() => push({ kind: "genre", name: n, order })}>
                  <Text style={{ fontWeight: "800", fontSize: 17, color: "#fff" }}>{n}</Text>
                </Pressable>
              </Grad>
            ))}
          </View>
        )}
        {tab === "radio" && (
          <>
            <Text style={mu.sec}>Radio</Text>
            <View style={listCard}>
              {STATIONS.map(([n, d, ti, live]) => (
                <Pressable key={n} style={mu.lrow} onPress={() => { playTrack(ti); toast(`Playing ${n}`); }}>
                  <Grad color="linear-gradient(135deg,#ef4444,#7f1d1d)" style={mu.stIc}>
                    <Icon n="music" size={20} color="#fff" />
                  </Grad>
                  <View style={{ flex: 1 }}><Text style={mu.t1}>{n}</Text><Text style={mu.t2}>{d}</Text></View>
                  {live && <Text style={mu.live}>LIVE</Text>}
                </Pressable>
              ))}
            </View>
          </>
        )}
        {tab === "search" && (
          <>
            <View style={mu.search}>
              <Icon n="search" size={15} color="rgba(255,255,255,.5)" />
              <TextInput style={mu.searchIn} value={q} onChangeText={setQ}
                placeholder="Artists, Songs, Lyrics" placeholderTextColor="rgba(255,255,255,.5)" autoFocus />
            </View>
            <View style={listCard}>
              {TRACKS.map((t, i) => i).filter((i) => !q || (TRACKS[i].title + TRACKS[i].artist).toLowerCase().includes(q.toLowerCase())).map(trackRow)}
            </View>
          </>
        )}
      </ScrollView>
      <FloatingTabBar dark active={tab} onTab={setTab} tabs={[
        { id: "listen", icon: "playCircle", label: "Listen Now" },
        { id: "browse", icon: "layoutGrid", label: "Browse" },
        { id: "radio", icon: "radioTower", label: "Radio" },
        { id: "search", icon: "search", label: "Search" },
      ]} />
      {panes.map((p, i) => (
        <PageBlank key={i} onClose={pop}>
          <View style={{ flex: 1, backgroundColor: "#050505" }}>
            {p.kind === "player" && <Player onBack={pop} onQueue={() => push({ kind: "queue" })} onAirplay={() => push({ kind: "airplay" })} bump={bump} />}
            {p.kind === "queue" && <Queue onBack={pop} />}
            {p.kind === "airplay" && <Airplay onBack={pop} />}
            {p.kind === "genre" && <GenrePage name={p.name} order={p.order} onBack={pop} onTrack={playTrack} />}
          </View>
        </PageBlank>
      ))}
    </View>
  );
}

/* ---------------- lecteur ---------------- */
function Player({ onBack, onQueue, onAirplay, bump }: {
  onBack: () => void; onQueue: () => void; onAirplay: () => void; bump: () => void;
}) {
  const s = useSys();
  const fill = React.useRef<View>(null);
  const [pos, setPos] = React.useState(sys.position);
  React.useEffect(() => {
    const off = onFrame(() => setPos(sys.position));
    return () => { off(); };
  }, []);
  const t = cur();
  const like = liked.has(s.track);
  return (
    <View style={{ flex: 1, paddingTop: 60, paddingHorizontal: 28, paddingBottom: 60 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <GBtn icon="chevronLeft" color="#fff" onPress={onBack} />
        <Text style={{ fontSize: 12, fontWeight: "700", letterSpacing: 1.4, color: "rgba(255,255,255,.5)" }}>NOW PLAYING</Text>
        <GBtn icon="ellipsis" color="#fff" onPress={() => toast(`${t.title} — ${t.artist}`)} />
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Image source={{ uri: t.art }} style={{ width: 270, height: 270, borderRadius: 28 }} resizeMode="cover" />
      </View>
      <View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", letterSpacing: -0.4, color: "#fff" }} numberOfLines={1}>{t.title}</Text>
            <Text style={{ fontSize: 15, color: "rgba(255,255,255,.55)", marginTop: 2 }}>{t.artist}</Text>
          </View>
          <Pressable onPress={() => { if (liked.has(s.track)) liked.delete(s.track); else liked.add(s.track); bump(); }}>
            <Icon n="heart" size={22} color={like ? "#ef4444" : "#fff"} />
          </Pressable>
        </View>
        <View ref={fill} style={{ paddingVertical: 10 }}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e: { nativeEvent: { pageX: number } }) => {
            const el = domOf(fill); if (!el) return;
            const r = el.getBoundingClientRect();
            sys.position = Math.min(Math.max((e.nativeEvent.pageX - r.left) / r.width, 0), 1) * cur().dur;
          }}>
          <View style={{ height: 6, backgroundColor: "rgba(255,255,255,.15)", borderRadius: 3, overflow: "hidden" }}>
            <View style={{ height: "100%" as unknown as number, width: `${(pos / t.dur) * 100}%` as unknown as number, backgroundColor: "#fff", borderRadius: 3 }} />
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
          <Text style={mu.tim}>{fmtPos(pos)}</Text>
          <Text style={mu.tim}>-{fmtPos(Math.max(0, t.dur - pos))}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 30, paddingTop: 6 }}>
          <Pressable onPress={() => { mode.shuffle = !mode.shuffle; bump(); toast(mode.shuffle ? "Shuffle on" : "Shuffle off"); }}>
            <Icon n="shuffle" size={20} color={mode.shuffle ? "#22c55e" : "rgba(255,255,255,.5)"} />
          </Pressable>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 26 }}>
            <Pressable onPress={() => prev()}><Icon n="skipBack" size={28} color="#fff" /></Pressable>
            <Pressable onPress={() => set("playing", !s.playing)}><Icon n={s.playing ? "pause" : "play"} size={34} color="#fff" /></Pressable>
            <Pressable onPress={() => next()}><Icon n="skipForward" size={28} color="#fff" /></Pressable>
          </View>
          <Pressable onPress={() => { mode.repeat = ((mode.repeat + 1) % 3) as 0 | 1 | 2; bump(); toast(mode.repeat === 0 ? "Repeat off" : mode.repeat === 1 ? "Repeat all" : "Repeat one"); }}>
            <Icon n={mode.repeat === 2 ? "repeat1" : "repeat"} size={20} color={mode.repeat ? "#22c55e" : "rgba(255,255,255,.5)"} />
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8, paddingTop: 18 }}>
          <Pressable onPress={onAirplay}><Icon n="cast" size={18} color="rgba(255,255,255,.6)" /></Pressable>
          <Pressable onPress={onQueue}><Icon n="list" size={20} color="rgba(255,255,255,.6)" /></Pressable>
          <Pressable onPress={() => toast(`Shared “${t.title}”`)}><Icon n="share" size={18} color="rgba(255,255,255,.6)" /></Pressable>
        </View>
      </View>
    </View>
  );
}

/* ---------------- Up Next ---------------- */
function Queue({ onBack }: { onBack: () => void }) {
  const s = useSys();
  const order = TRACKS.map((_, i) => (s.track + i) % TRACKS.length);
  return (
    <View style={{ flex: 1 }}>
      <SubHdr title="Up Next" onBack={onBack} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 6, paddingBottom: 40 }} nativeID="app-scroll">
        <View style={listCard}>
          {order.map((i) => {
            const t = TRACKS[i];
            return (
              <Pressable key={i} style={mu.lrow} onPress={() => set("track", i)} disabled={i === s.track}>
                <Image source={{ uri: t.art }} style={mu.avSq} />
                <View style={{ flex: 1 }}>
                  <Text style={[mu.t1, { color: i === s.track ? "#22c55e" : "#fff" }]}>{t.title}</Text>
                  <Text style={mu.t2}>{t.artist}</Text>
                </View>
                {i === s.track ? <Icon n="music" size={16} color="#22c55e" /> : <Text style={mu.rt}>{fmtPos(t.dur)}</Text>}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------------- Nyne Cast ---------------- */
function Airplay({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <SubHdr title="Nyne Cast" onBack={onBack} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 6, paddingBottom: 40 }} nativeID="app-scroll">
        <Text style={mu.cap}>Speakers & TVs</Text>
        <View style={listCard}>
          {["This Phone", "Living Room Speaker", "Nyne TV", "MacBook Pro"].map((n, i) => (
            <Pressable key={n} style={mu.lrow} onPress={() => { onBack(); toast(i === 0 ? "Playing on this phone" : `Playing on ${n}`); }}>
              <View style={mu.devIc}><Icon n={i === 0 ? "music" : "cast"} size={18} color="#fff" /></View>
              <View style={{ flex: 1 }}><Text style={mu.t1}>{n}</Text></View>
              {i === 0 && <Icon n="check" size={18} color="#fff" />}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------------- page genre ---------------- */
function GenrePage({ name, order, onBack, onTrack }: {
  name: string; order: number[]; onBack: () => void; onTrack: (i: number) => void;
}) {
  const s = useSys();
  return (
    <View style={{ flex: 1 }}>
      <SubHdr title={name} onBack={onBack} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 6, paddingBottom: 40 }} nativeID="app-scroll">
        <View style={listCard}>
          {order.map((i) => {
            const t = TRACKS[i];
            return (
              <Pressable key={i} style={mu.lrow} onPress={() => onTrack(i)}>
                <Image source={{ uri: t.art }} style={mu.avSq} />
                <View style={{ flex: 1 }}>
                  <Text style={[mu.t1, { color: i === s.track && s.playing ? "#22c55e" : "#fff" }]}>{t.title}</Text>
                  <Text style={mu.t2}>{t.artist}</Text>
                </View>
                {liked.has(i) ? <Icon n="heart" size={16} color="#fff" /> : <Text style={mu.rt}>{fmtPos(t.dur)}</Text>}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const mu = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050505" },
  thdr: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 60, paddingHorizontal: 16, paddingBottom: 10 } as object,
  lrow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 } as object,
  avSq: { width: 48, height: 48, borderRadius: 8 },
  t1: { fontSize: 15, fontWeight: "600", color: "#fff" },
  t2: { fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 1 },
  rt: { fontSize: 12, color: "rgba(255,255,255,.5)" },
  tim: { fontSize: 11, color: "rgba(255,255,255,.5)", fontVariant: ["tabular-nums"] },
  sec: { fontSize: 20, fontWeight: "700", letterSpacing: -0.4, color: "#fff", marginTop: 4, marginHorizontal: 2, marginBottom: 6 },
  hero: { height: 220, borderRadius: 28, overflow: "hidden", marginBottom: 18 } as object,
  heroVeil: { position: "absolute", top: "40%" as unknown as number, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,.45)" } as object,
  heroCap: { fontSize: 11, fontWeight: "700", letterSpacing: 1.4, color: "rgba(255,255,255,.7)" },
  genre: { width: "47.5%", height: 90, borderRadius: 22, overflow: "hidden" } as object,
  stIc: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" } as object,
  devIc: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,.08)", alignItems: "center", justifyContent: "center" } as object,
  live: { fontSize: 10, fontWeight: "800", letterSpacing: 1, color: "#ef4444", borderWidth: 1, borderColor: "rgba(239,68,68,.4)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  cap: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8, color: "rgba(255,255,255,.45)", textTransform: "uppercase", margin: 4 },
  search: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,.08)", borderWidth: 1, borderColor: "rgba(255,255,255,.12)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 } as object,
  searchIn: { flex: 1, fontSize: 14, color: "#fff", padding: 0, margin: 0, outlineStyle: "none" } as object,
});
