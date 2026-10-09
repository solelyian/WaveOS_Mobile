// Photos.tsx — photothèque : grille par mois avec de vraies photos
// (public/img/ph*.jpg), onglets Photos/Albums, visionneuse plein écran
// poussée sur la stack avec barre d'actions (partager, favoris, infos,
// supprimer). 100 % React Native.
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Empty, fs, Icon, Nav, StackNav, TabBar, useStack, useTheme } from "../rn";

interface Photo { id: string; src: string; day: string; fav: boolean; loc: string }

const SCENES: Photo[] = [
  { id: "p1",  src: "/img/ph10.jpg", day: "12 oct.",  fav: true,  loc: "Portofino, Italie" },
  { id: "p2",  src: "/img/ph5.jpg",  day: "12 oct.",  fav: false, loc: "Vieille ville" },
  { id: "p3",  src: "/img/ph9.jpg",  day: "12 oct.",  fav: true,  loc: "Quartier des lumières" },
  { id: "p4",  src: "/img/ph6.jpg",  day: "8 oct.",   fav: false, loc: "Café Marbre" },
  { id: "p5",  src: "/img/ph13.jpg", day: "8 oct.",   fav: false, loc: "Ruelle aux fleurs" },
  { id: "p6",  src: "/img/ph3.jpg",  day: "8 oct.",   fav: true,  loc: "Café Marbre" },
  { id: "p7",  src: "/img/ph11.jpg", day: "30 sept.", fav: true,  loc: "Domicile" },
  { id: "p8",  src: "/img/ph7.jpg",  day: "30 sept.", fav: true,  loc: "Parc des Buttes" },
  { id: "p9",  src: "/img/ph12.jpg", day: "22 sept.", fav: false, loc: "Vol NY-204" },
  { id: "p10", src: "/img/ph4.jpg",  day: "22 sept.", fav: false, loc: "Côte ouest" },
  { id: "p11", src: "/img/ph2.jpg",  day: "22 sept.", fav: true,  loc: "Lac Moraine" },
  { id: "p12", src: "/img/ph1.jpg",  day: "15 sept.", fav: false, loc: "Lyon, quais de Saône" },
  { id: "p13", src: "/img/ph8.jpg",  day: "15 sept.", fav: false, loc: "Quartier affaires" },
];

const ALBUMS: { name: string; n: number; cover: string }[] = [
  { name: "Récents", n: SCENES.length, cover: "/img/ph9.jpg" },
  { name: "Favoris", n: SCENES.filter(p => p.fav).length, cover: "/img/ph4.jpg" },
  { name: "Voyages", n: 6, cover: "/img/ph2.jpg" },
  { name: "Portrait", n: 3, cover: "/img/ph3.jpg" },
  { name: "Animaux", n: 2, cover: "/img/ph7.jpg" },
  { name: "Nourriture", n: 2, cover: "/img/ph6.jpg" },
];

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
                <View style={{ aspectRatio: 1, overflow: "hidden", borderRadius: 2 }}>
                  <Image source={{ uri: ph.src }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                </View>
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
  const [favs, setFavs] = useState(() => new Set(photos.filter(ph => ph.fav).map(ph => ph.id)));
  const ph = photos[i];
  const fav = favs.has(ph.id);
  const go = (d: number) => { const n = i + d; if (n >= 0 && n < photos.length) setI(n); };
  const toggleFav = () => setFavs(s => { const n = new Set(s); n.has(ph.id) ? n.delete(ph.id) : n.add(ph.id); return n; });
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Nav
        transparent
        onBack={pop} back=""
        right={<Text style={{ fontSize: fs(13, p), color: "#fff", fontWeight: "600" }}>{i + 1} / {photos.length}</Text>}
      />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View style={{ position: "relative", width: "100%", aspectRatio: 1 }}>
          <Image source={{ uri: ph.src }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          <Pressable onPress={() => go(-1)} style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "30%" }} />
          <Pressable onPress={() => go(1)} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "30%" }} />
        </View>
        <Text style={{ fontSize: fs(15, p), color: "#fff", fontWeight: "600", marginTop: 14 }}>{ph.day} · {ph.loc}</Text>
        <Text style={{ fontSize: fs(12, p), color: "rgba(255,255,255,.55)", marginTop: 2 }}>Capturé sur WaveOS</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-around", paddingVertical: 16, paddingBottom: 30 }}>
        <Pressable style={{ alignItems: "center", gap: 3 }}><Icon name="share-2" size={20} color="#fff" sw={1.9} /><Text style={{ fontSize: fs(10, p), color: "rgba(255,255,255,.7)" }}>Partager</Text></Pressable>
        <Pressable onPress={toggleFav} style={{ alignItems: "center", gap: 3 }}>
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
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20, flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
      {ALBUMS.map(a => (
        <Pressable key={a.name} onPress={() => openGrid(a.name)} style={({ pressed }) => ({ width: "47.5%", opacity: pressed ? 0.75 : 1 })}>
          <View style={{ width: "100%", height: 120, borderRadius: 16, marginBottom: 6, overflow: "hidden", backgroundColor: p.card }}>
            <Image source={{ uri: a.cover }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
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
