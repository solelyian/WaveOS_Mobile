// Musique.tsx — lecteur complet : bibliothèque (albums + morceaux),
// écran lecture (pochette, scrubber temps réel, play/pause, navigation
// piste, volume, shuffle/repeat avec états actifs), mini-lecteur persistant.
// 100 % React Native — l'avancement utilise un timer tick par tick.
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { fs, Group, Icon, Nav, Row, SecTitle, StackNav, useStack, useTheme } from "../rn";

interface Track { t: string; d: number }
interface Album { name: string; artist: string; hue: number; year: number; tracks: Track[] }

const ALBUMS: Album[] = [
  { name: "Sillage", artist: "Nyne Ensemble", hue: 230, year: 2026, tracks: [
    { t: "Rubans", d: 214 }, { t: "Marée basse", d: 187 }, { t: "Écume", d: 242 },
    { t: "Abysses", d: 301 }, { t: "Reflet", d: 178 }, { t: "Ressac", d: 226 }] },
  { name: "Nocturnes Électriques", artist: "Léa Voss", hue: 330, year: 2025, tracks: [
    { t: "Aube synthétique", d: 234 }, { t: "Néon froid", d: 196 }, { t: "Polarité", d: 265 }, { t: "Dernier métro", d: 288 }] },
  { name: "Granite & Bruine", artist: "Arctique", hue: 190, year: 2024, tracks: [
    { t: "Fjord", d: 254 }, { t: "Mousse", d: 202 }, { t: "Phare", d: 219 }, { t: "Dérive", d: 275 }, { t: "Grève", d: 188 }] },
  { name: "Papier de verre", artist: "Studio Opale", hue: 20, year: 2026, tracks: [
    { t: "Grain", d: 167 }, { t: "Polissage", d: 223 }, { t: "Nuance", d: 241 }] },
  { name: "Haute mer", artist: "Nyne Ensemble", hue: 260, year: 2023, tracks: [
    { t: "Houle", d: 243 }, { t: "Brassée", d: 198 }, { t: "Amer", d: 312 }, { t: "Nerf de boeuf", d: 176 }, { t: "Ivresse", d: 267 }] },
];

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function Cover({ a, size }: { a: Album; size: number }): ReactNode {
  return (
    <View style={{
      width: size, height: size, borderRadius: size * 0.14, overflow: "hidden",
      background: `linear-gradient(145deg, hsl(${a.hue} 55% 46%), hsl(${a.hue + 45} 60% 22%))`,
      alignItems: "center", justifyContent: "center",
      boxShadow: "0 8px 22px rgba(0,0,0,.35)",
    }}>
      <Icon name="waves" size={size * 0.34} color="rgba(255,255,255,.85)" sw={1.6} />
      <View style={{ position: "absolute", bottom: size * 0.08, left: size * 0.09 }}>
        <Text style={{ fontSize: size * 0.075, fontWeight: "700", color: "#fff" }}>{a.name}</Text>
        <Text style={{ fontSize: size * 0.058, color: "rgba(255,255,255,.7)" }}>{a.artist}</Text>
      </View>
    </View>
  );
}

/* ---------- écran lecture ---------- */

function Player({ album, trackIdx }: { album: Album; trackIdx: number }): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  const [ti, setTi] = useState(trackIdx);
  const [pos, setPos] = useState(47);
  const [playing, setPlaying] = useState(true);
  const [vol, setVol] = useState(0.62);
  const [shuf, setShuf] = useState(false);
  const [rep, setRep] = useState(0);
  const tr = album.tracks[ti];
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (playing) {
      timer.current = window.setInterval(() => setPos(s => {
        if (s + 1 >= tr.d) { next(); return 0; }
        return s + 1;
      }), 1000);
    }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, ti]);

  const next = () => { setPos(0); setTi(i => (i + 1) % album.tracks.length); };
  const prev = () => { if (pos > 4) { setPos(0); } else setTi(i => (i - 1 + album.tracks.length) % album.tracks.length); };

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav onBack={pop} back={album.name} title="" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, alignItems: "center", paddingBottom: 20 }}>
        <Cover a={album} size={280} />
        <Text style={{ fontSize: fs(20, p), fontWeight: "700", color: p.text, marginTop: 22, textAlign: "center" }} numberOfLines={1}>{tr.t}</Text>
        <Text style={{ fontSize: fs(15.5, p), color: p.sub, marginTop: 3 }}>{album.artist}</Text>

        {/* scrubber */}
        <View style={{ width: "100%", marginTop: 26 }}>
          <View style={{ height: 5, borderRadius: 3, backgroundColor: p.field, overflow: "hidden" }}>
            <View style={{ height: 5, width: `${(pos / tr.d) * 100}%`, backgroundColor: p.text, borderRadius: 3 }} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
            <Text style={{ fontSize: fs(11.5, p), color: p.faint }}>{fmt(pos)}</Text>
            <Text style={{ fontSize: fs(11.5, p), color: p.faint }}>-{fmt(tr.d - pos)}</Text>
          </View>
        </View>

        {/* transports */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 38, marginTop: 18 }}>
          <Pressable onPress={() => setShuf(s => !s)}><Icon name="shuffle" size={20} color={shuf ? p.tint : p.sub} sw={2} /></Pressable>
          <Pressable onPress={prev}><Icon name="skip-back" size={30} color={p.text} sw={2.1} /></Pressable>
          <Pressable onPress={() => setPlaying(pl => !pl)} style={{
            width: 66, height: 66, borderRadius: 33, backgroundColor: p.text,
            alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={playing ? "pause" : "play"} size={30} color={p.bg} sw={2.4} />
          </Pressable>
          <Pressable onPress={next}><Icon name="skip-forward" size={30} color={p.text} sw={2.1} /></Pressable>
          <Pressable onPress={() => setRep(r => (r + 1) % 3)} style={{ position: "relative" }}>
            <Icon name={rep === 2 ? "repeat-1" : "repeat"} size={20} color={rep ? p.tint : p.sub} sw={2} />
          </Pressable>
        </View>

        {/* volume */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 26, width: "100%", paddingHorizontal: 6 }}>
          <Icon name="volume-x" size={15} color={p.sub} sw={2.2} />
          <Pressable onPress={() => setVol(v => v >= 0.95 ? 0.3 : Math.min(1, v + 0.15))} style={{ flex: 1 }}>
            <View style={{ height: 5, borderRadius: 3, backgroundColor: p.field, overflow: "hidden" }}>
              <View style={{ height: 5, width: `${vol * 100}%`, backgroundColor: p.text, borderRadius: 3 }} />
            </View>
          </Pressable>
          <Icon name="volume-2" size={15} color={p.sub} sw={2.2} />
        </View>

        {/* file d'attente */}
        <View style={{ width: "100%", marginTop: 26 }}>
          <SecTitle>File d'attente</SecTitle>
          <Group>
            {album.tracks.map((t, i) => (
              <Row key={t.t} title={t.t} sub={i === ti ? (playing ? "Lecture en cours" : "En pause") : undefined}
                icon={i === ti ? "pause" : "music"} iconBg={i === ti ? p.tint : p.card2}
                last={i === album.tracks.length - 1}
                right={<Text style={{ fontSize: fs(12.5, p), color: p.faint }}>{fmt(t.d)}</Text>}
                onPress={() => { setTi(i); setPos(0); setPlaying(true); }} />
            ))}
          </Group>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- bibliothèque ---------- */

function Library(): ReactNode {
  const p = useTheme();
  const { push } = useStack();
  const [tab, setTab] = useState(0);
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav large="Musique" right={<Icon name="search" size={19} color={p.tint} sw={2.4} />} />
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 10 }}>
        {["Récents", "Albums", "Artistes"].map((t, i) => (
          <Pressable key={t} onPress={() => setTab(i)} style={{
            paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16,
            backgroundColor: i === tab ? p.tint : p.field,
          }}>
            <Text style={{ fontSize: fs(13, p), fontWeight: "600", color: i === tab ? "#fff" : p.sub }}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        {tab === 0 ? (
          <>
            <SecTitle>Ajoutés récemment</SecTitle>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 2, paddingVertical: 4 }}>
              {ALBUMS.map(a => (
                <Pressable key={a.name} onPress={() => push(<Player album={a} trackIdx={0} />)} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
                  <Cover a={a} size={136} />
                </Pressable>
              ))}
            </ScrollView>
            <SecTitle>Morceaux</SecTitle>
            <Group>
              {ALBUMS.flatMap(a => a.tracks.slice(0, 2).map(t => ({ t, a }))).map(({ t, a }, i, arr) => (
                <Row key={t.t + a.name} title={t.t} sub={a.artist} icon="music" iconBg={`hsl(${a.hue} 55% 46%)`}
                  last={i === arr.length - 1}
                  right={<Text style={{ fontSize: fs(12.5, p), color: p.faint }}>{fmt(t.d)}</Text>}
                  onPress={() => push(<Player album={a} trackIdx={a.tracks.indexOf(t)} />)} />
              ))}
            </Group>
          </>
        ) : tab === 1 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
            {ALBUMS.map(a => (
              <Pressable key={a.name} onPress={() => push(<Player album={a} trackIdx={0} />)} style={({ pressed }) => ({ width: "47%", opacity: pressed ? 0.75 : 1 })}>
                <Cover a={a} size={160} />
                <Text style={{ fontSize: fs(13.5, p), fontWeight: "600", color: p.text, marginTop: 7 }} numberOfLines={1}>{a.name}</Text>
                <Text style={{ fontSize: fs(12, p), color: p.sub }} numberOfLines={1}>{a.artist}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Group>
            {[...new Set(ALBUMS.map(a => a.artist))].map((ar, i, arr) => (
              <Row key={ar} title={ar} sub={`${ALBUMS.filter(a => a.artist === ar).length} album(s)`}
                icon="mic" iconBg={p.violet} last={i === arr.length - 1}
                onPress={() => push(<Player album={ALBUMS.find(a => a.artist === ar)!} trackIdx={0} />)} />
            ))}
          </Group>
        )}
      </ScrollView>
      {/* mini-lecteur */}
      <Pressable onPress={() => push(<Player album={ALBUMS[0]} trackIdx={0} />)} style={{
        flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 12, marginBottom: 8,
        paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14,
        backgroundColor: p.card2, borderWidth: 0.5, borderColor: p.sep,
      }}>
        <Cover a={ALBUMS[0]} size={34} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: fs(13.5, p), fontWeight: "600", color: p.text }} numberOfLines={1}>Rubans</Text>
          <Text style={{ fontSize: fs(11.5, p), color: p.sub }}>Nyne Ensemble</Text>
        </View>
        <Icon name="play" size={20} color={p.text} sw={2.2} />
      </Pressable>
    </View>
  );
}

export function MusiqueApp(): ReactNode {
  return <StackNav root={<Library />} />;
}
