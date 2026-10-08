// Photos.tsx — photothèque : grille par mois (vignettes procédurales — ciels,
// couchers, pluie — générées par scène), onglets Photos/Albums, visionneuse
// plein écran poussée sur la stack avec barre d'actions (partager, favoris,
// infos, supprimer). 100 % React Native.
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Empty, fs, Icon, Nav, StackNav, TabBar, useStack, useTheme } from "../rn";

/* ---------- vignettes procédurales ---------- */
// Chaque photo = une mini-scène CSS déterministe (ciel dégradé + astre +
// ligne d'horizon) — identité visuelle cohérente, zéro asset externe.

// Familles de scènes — une pellicule réaliste mélange couchers, nuits,
// pluies, forêts, neiges. Chaque photo picore une famille + variantes.
type Kind = "sunset" | "night" | "rain" | "forest" | "snow" | "city";
interface Photo { id: string; kind: Kind; v: number; sunX: number; sunY: number; fav: boolean; day: string }

const KINDS: Record<Kind, { sky: string[]; sat: string }> = {
  sunset: { sky: ["linear-gradient(165deg,#1c2a6e 0%,#7a3b8f 42%,#e8703a 78%,#f5a04a 100%)", "linear-gradient(160deg,#25306e 0%,#9c4a7a 50%,#ff7a45 88%)"], sat: "warm" },
  night: { sky: ["linear-gradient(170deg,#060a24 0%,#101a44 55%,#1d2f66 100%)", "linear-gradient(175deg,#0a1030 0%,#16225a 60%,#2a3a7d 100%)"], sat: "cool" },
  rain: { sky: ["linear-gradient(165deg,#2e4a5e 0%,#3f6070 55%,#5a7d8a 100%)", "linear-gradient(160deg,#35455c 0%,#4a6478 55%,#647f92 100%)"], sat: "gray" },
  forest: { sky: ["linear-gradient(160deg,#b8d8b0 0%,#5d8f62 45%,#2e5238 100%)", "linear-gradient(165deg,#c8e0c0 0%,#6fa06e 50%,#3a5c40 100%)"], sat: "green" },
  snow: { sky: ["linear-gradient(168deg,#a8c4de 0%,#d8e4f0 60%,#eef2f8 100%)", "linear-gradient(165deg,#93aec9 0%,#c9d8ea 55%,#e8eef6 100%)"], sat: "pale" },
  city: { sky: ["linear-gradient(170deg,#3a2a5e 0%,#7a4a7d 55%,#c86a5a 100%)", "linear-gradient(165deg,#2a3a6e 0%,#8a5a6d 60%,#d88a6a 100%)"], sat: "dusk" },
};

const SCENES = (() => {
  const photos: Photo[] = [];
  let id = 0;
  const rnd = (seed: number) => { let x = (seed * 2654435761) >>> 0; return () => ((x = (Math.imul(x, 1103515245) + 12345) >>> 0) / 4294967296); };
  const days = ["12 oct.", "8 oct.", "30 sept.", "22 sept.", "15 sept.", "3 sept.", "28 août", "19 août", "11 août", "2 août", "25 juil.", "18 juil."];
  const kinds: Kind[] = ["sunset", "night", "rain", "forest", "snow", "city"];
  for (const day of days) {
    const r = rnd(day.length * 7 + id);
    const n = 3 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      photos.push({
        id: `p${id++}`, day,
        kind: kinds[Math.floor(r() * kinds.length)],
        v: Math.floor(r() * 2),
        sunX: 15 + r() * 70, sunY: 12 + r() * 40,
        fav: r() > 0.8,
      });
    }
  }
  return photos;
})();

const ALBUMS = [
  { name: "Récents", n: SCENES.length, ic: "image" },
  { name: "Favoris", n: SCENES.filter(p => p.fav).length, ic: "heart" },
  { name: "Ciels", n: 14, ic: "cloud" },
  { name: "Voyages", n: 32, ic: "map-pin" },
  { name: "Captures", n: 9, ic: "smartphone" },
  { name: "Supprimés", n: 2, ic: "trash-2" },
];

/** La scène d'une photo — ciel dégradé par famille + silhouette
 *  caractéristique (soleil couchant, étoiles, buildings, collines). */
function Scene({ ph, size }: { ph: Photo; size: number }): ReactNode {
  const k = ph.kind;
  const s = (v: number) => v * size;
  return (
    <View style={{ width: size, height: size, overflow: "hidden", position: "relative", background: KINDS[k].sky[ph.v] }}>
      {k === "sunset" && (<>
        <View style={{ position: "absolute", left: `${ph.sunX}%`, top: `${55 + ph.sunY * 0.4}%`, width: s(0.22), height: s(0.22), borderRadius: s(0.11), background: "radial-gradient(circle,#fff5d8,#ffab5e 70%)", boxShadow: `0 0 ${s(0.12)}px #ff9a4e` }} />
        <View style={{ position: "absolute", left: "-10%", right: "-10%", bottom: "-4%", height: "24%", background: "#14081f", borderTopLeftRadius: "60% 100%", borderTopRightRadius: "40% 100%" }} />
        <View style={{ position: "absolute", left: `${ph.sunX - 20}%`, bottom: 0, width: "60%", height: "6%", background: "linear-gradient(90deg,transparent,rgba(255,150,80,.5),transparent)" }} />
      </>)}
      {k === "night" && (<>
        {[{ l: 12, t: 10, d: 2.4 }, { l: 30, t: 22, d: 1.8 }, { l: 52, t: 12, d: 2 }, { l: 68, t: 30, d: 1.6 }, { l: 82, t: 16, d: 2.2 }, { l: 44, t: 36, d: 1.5 }].map((st, i) => (
          <View key={i} style={{ position: "absolute", left: `${st.l}%`, top: `${st.t}%`, width: s(st.d / 100 + 0.012), height: s(st.d / 100 + 0.012), borderRadius: 4, backgroundColor: "#e8ecff", opacity: 0.9 }} />
        ))}
        <View style={{ position: "absolute", left: `${ph.sunX}%`, top: `${ph.sunY * 0.6}%`, width: s(0.13), height: s(0.13), borderRadius: s(0.065), background: "radial-gradient(circle at 35% 35%,#f4f0e4,#c9c2ac 75%)", boxShadow: `0 0 ${s(0.09)}px rgba(240,235,215,.8)` }} />
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "26%", flexDirection: "row", alignItems: "flex-end" }}>
          {[0.34, 0.5, 0.28, 0.44, 0.6, 0.38, 0.52].map((h, i) => (
            <View key={i} style={{ flex: 1, height: `${h * 100}%`, backgroundColor: "#05070f" }} />
          ))}
        </View>
      </>)}
      {k === "rain" && (<>
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <View key={i} style={{ position: "absolute", left: `${8 + i * 13}%`, top: `${(i * 17) % 45}%`, width: 1.4, height: s(0.12), backgroundColor: "rgba(200,225,240,.55)", transform: [{ rotate: "18deg" }] }} />
        ))}
        <View style={{ position: "absolute", left: "-8%", right: "-8%", top: "-6%", height: "34%", background: "linear-gradient(180deg,#2a3844 30%,transparent)", borderBottomLeftRadius: "50% 60%", borderBottomRightRadius: "50% 60%" }} />
        <View style={{ position: "absolute", left: "-5%", right: "-5%", bottom: "-2%", height: "30%", background: "linear-gradient(180deg,#3a5566,#1e3038)" }} />
      </>)}
      {k === "forest" && (<>
        <View style={{ position: "absolute", left: "-12%", bottom: "-6%", width: "80%", height: "44%", backgroundColor: "#1f3d28", borderTopLeftRadius: "80% 90%", borderTopRightRadius: "20% 20%" }} />
        <View style={{ position: "absolute", right: "-15%", bottom: "-4%", width: "75%", height: "36%", backgroundColor: "#16291c", borderTopLeftRadius: "30% 30%", borderTopRightRadius: "85% 95%" }} />
        <View style={{ position: "absolute", left: `${ph.sunX}%`, top: `${ph.sunY * 0.5}%`, width: s(0.1), height: s(0.1), borderRadius: s(0.05), background: "radial-gradient(circle,#fffde8,#e8d88a 80%)", opacity: 0.85 }} />
      </>)}
      {k === "snow" && (<>
        {[{ l: 15, t: 14 }, { l: 38, t: 26 }, { l: 60, t: 10 }, { l: 78, t: 32 }, { l: 28, t: 42 }, { l: 88, t: 18 }].map((st, i) => (
          <View key={i} style={{ position: "absolute", left: `${st.l}%`, top: `${st.t}%`, width: s(0.025), height: s(0.025), borderRadius: s(0.0125), backgroundColor: "#fff", opacity: 0.95 }} />
        ))}
        <View style={{ position: "absolute", left: "-10%", right: "-10%", bottom: "-8%", height: "42%", background: "linear-gradient(180deg,#f4f8fc,#dce8f4)", borderTopLeftRadius: "50% 80%", borderTopRightRadius: "50% 80%" }} />
        <View style={{ position: "absolute", left: "18%", bottom: "22%", width: "22%", height: "8%", backgroundColor: "rgba(255,255,255,.7)", borderRadius: 8 }} />
      </>)}
      {k === "city" && (<>
        <View style={{ position: "absolute", left: `${ph.sunX}%`, top: `${ph.sunY * 0.7}%`, width: s(0.15), height: s(0.15), borderRadius: s(0.075), background: "radial-gradient(circle,#ffe8c0,#e89050 75%)", boxShadow: `0 0 ${s(0.1)}px #f5a060` }} />
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "38%", flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
          {[0.5, 0.85, 0.62, 1, 0.72, 0.9, 0.55].map((h, i) => (
            <View key={i} style={{ flex: 1, height: `${h * 100}%`, backgroundColor: "#12081e" }}>
              {i % 2 === 0 ? <View style={{ marginTop: s(0.02), marginLeft: s(0.015), width: s(0.03), height: s(0.03), backgroundColor: "#f5c86a" }} /> : null}
            </View>
          ))}
        </View>
      </>)}
    </View>
  );
}

/* ---------- grille + visionneuse ---------- */

function Grid({ photos, onOpen }: { photos: Photo[]; onOpen: (i: number) => void }): ReactNode {
  const p = useTheme();
  const byDay = useMemo(() => {
    const m = new Map<string, Photo[]>();
    photos.forEach(ph => { const l = m.get(ph.day) ?? []; l.push(ph); m.set(ph.day, l); });
    return [...m.entries()];
  }, [photos]);
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
      {byDay.map(([day, arr]) => (
        <View key={day}>
          <Text style={{ fontSize: fs(15.5, p), fontWeight: "700", color: p.text, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 8 }}>{day}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 2 }}>
            {arr.map(ph => (
              <Pressable key={ph.id} onPress={() => onOpen(photos.indexOf(ph))} style={{ width: "33.333%", padding: 1.5 }}>
                <Scene ph={ph} size={118} />
                {ph.fav ? (
                  <View style={{ position: "absolute", right: 6, bottom: 6 }}>
                    <Icon name="heart" size={11} color="#fff" sw={2.6} />
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function Viewer({ photos, idx }: { photos: Photo[]; idx: number }): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  const [i, setI] = useState(idx);
  const [fav, setFav] = useState(photos[idx].fav);
  const ph = photos[i];
  const go = (d: number) => { const n = i + d; if (n >= 0 && n < photos.length) { setI(n); setFav(photos[n].fav); } };
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Nav
        transparent
        onBack={pop} back=""
        left={undefined}
        right={<Text style={{ fontSize: fs(13, p), color: "#fff", fontWeight: "600" }}>{i + 1} / {photos.length}</Text>}
      />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 }}>
        <View style={{ position: "relative" }}>
          <Scene ph={ph} size={330} />
          <Pressable onPress={() => go(-1)} style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "30%" }} />
          <Pressable onPress={() => go(1)} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "30%" }} />
        </View>
        <Text style={{ fontSize: fs(13, p), color: "rgba(255,255,255,.7)", marginTop: 12 }}>{ph.day} · capturé sur WaveOS</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-around", paddingVertical: 16, paddingBottom: 30 }}>
        <Pressable style={{ alignItems: "center", gap: 3 }}><Icon name="share-2" size={20} color="#fff" sw={1.9} /><Text style={{ fontSize: fs(10, p), color: "rgba(255,255,255,.7)" }}>Partager</Text></Pressable>
        <Pressable onPress={() => setFav(f => !f)} style={{ alignItems: "center", gap: 3 }}>
          <Icon name="heart" size={20} color={fav ? "#FF375F" : "#fff"} sw={fav ? 0 : 1.9} />
          <Text style={{ fontSize: fs(10, p), color: "rgba(255,255,255,.7)" }}>{fav ? "Favori" : "Aimer"}</Text>
        </Pressable>
        <Pressable style={{ alignItems: "center", gap: 3 }}><Icon name="info" size={20} color="#fff" sw={1.9} /><Text style={{ fontSize: fs(10, p), color: "rgba(255,255,255,.7)" }}>Infos</Text></Pressable>
        <Pressable style={{ alignItems: "center", gap: 3 }}><Icon name="trash-2" size={20} color="#FF453A" sw={1.9} /><Text style={{ fontSize: fs(10, p), color: "rgba(255,255,255,.7)" }}>Suppr.</Text></Pressable>
      </View>
    </View>
  );
}

/* ---------- albums ---------- */

function Albums({ openGrid }: { openGrid: (title: string) => void }): ReactNode {
  const p = useTheme();
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
      {ALBUMS.map(a => (
        <Pressable key={a.name} onPress={() => openGrid(a.name)} style={({ pressed }) => ({ width: "47.5%", opacity: pressed ? 0.75 : 1 })}>
          <View style={{
            width: "100%", height: 120, borderRadius: 16, marginBottom: 6,
            background: `linear-gradient(150deg, hsl(${a.name.length * 47 % 360} 55% 48%), hsl(${(a.name.length * 47 + 60) % 360} 60% 30%))`,
            alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={a.ic} size={30} color="rgba(255,255,255,.9)" sw={1.7} />
          </View>
          <Text style={{ fontSize: fs(14, p), fontWeight: "600", color: p.text }}>{a.name}</Text>
          <Text style={{ fontSize: fs(12, p), color: p.sub }}>{a.n}</Text>
        </Pressable>
      ))}
      {ALBUMS.length === 0 ? <Empty icon="image" title="Aucun album" sub="Vos albums apparaîtront ici." /> : null}
    </ScrollView>
  );
}

/* ---------- racine ---------- */

function PhotosRoot(): ReactNode {
  const { push } = useStack();
  const [tab, setTab] = useState(0);
  const [title, setTitle] = useState("Photos");
  return (
    <View style={{ flex: 1 }}>
      <Nav large={title} right={<Icon name="ellipsis" size={19} color="#7DA2FF" sw={2.4} />} />
      {tab === 0
        ? <Grid photos={SCENES} onOpen={i => push(<Viewer photos={SCENES} idx={i} />)} />
        : <Albums openGrid={t => { setTitle(t); setTab(0); }} />}
      <TabBar
        items={[{ icon: "image", label: "Photos" }, { icon: "layout-grid", label: "Albums" }]}
        idx={tab}
        onChange={i => { setTab(i); setTitle(i ? "Albums" : "Photos"); }}
      />
    </View>
  );
}

export function PhotosApp(): ReactNode {
  return <StackNav root={<PhotosRoot />} />;
}
