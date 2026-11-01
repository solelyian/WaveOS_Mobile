// PhotosApp.tsx — souvenir Yosemite, périodes, grille 30 + visionneuse,
// Library / For You / Albums / Search.
import React from "react";
import { View, Text, Pressable, Image, ScrollView, StyleSheet } from "react-native";
import { Icon } from "../Icon";
import { GlassHeader, FloatingTabBar, SearchPill } from "./ui";
import { domOf } from "../fx";

const COUNT = 30;
const range = (a: number, b: number) => Array.from({ length: b - a }, (_, i) => a + i);
const ALL = range(0, COUNT);
const ALBUMS: [string, number[], string][] = [
  ["Recents", ALL, "/img/photos/ph-0.jpg"],
  ["Favorites", range(2, 14), "/img/photos/ph-4.jpg"],
  ["Trips", range(8, 18), "/img/photos/ph-9.jpg"],
  ["Portraits", range(16, 24), "/img/photos/ph-16.jpg"],
];
const CHIPS: [string, string, number[]][] = [
  ["all", "All", ALL],
  ["people", "People", range(0, 10)],
  ["places", "Places", range(10, 20)],
  ["shots", "Screenshots", range(20, 30)],
];

export function PhotosApp() {
  const [tab, setTab] = React.useState("library");
  const [period, setPeriod] = React.useState("all");
  const [album, setAlbum] = React.useState<[string, number[]] | null>(null);
  const [chip, setChip] = React.useState("all");
  const [viewer, setViewer] = React.useState<number | null>(null);

  const cell = (i: number) => {
    const big = i % 12 === 0;
    return (
      <Pressable key={i} onPress={() => setViewer(i)}
        style={big ? ph.cellBig : ph.cell}>
        <Image source={{ uri: `/img/photos/ph-${i}.jpg` }} style={{ width: "100%" as unknown as number, height: "100%" as unknown as number }} resizeMode="cover" />
      </Pressable>
    );
  };
  const grid = (indices: number[]) => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4 }}>{indices.map(cell)}</View>
  );
  const section = (label: string, indices: number[]) => (
    <View key={label}>
      <Text style={ph.secT}>{label}</Text>
      {grid(indices)}
    </View>
  );
  const memoryCard = (title: string, sub: string, src: string, hgt = 192) => (
    <Pressable style={{ width: "100%" as unknown as number, height: hgt, borderRadius: 32, overflow: "hidden", marginBottom: 20 }} onPress={() => setViewer(0)}>
      <Image source={{ uri: src }} style={StyleSheet.absoluteFill as object} resizeMode="cover" />
      <View style={ph.memVeil}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 24 }}>{title}</Text>
        <Text style={{ color: "rgba(255,255,255,.8)", fontSize: 14, fontWeight: "500" }}>{sub}</Text>
      </View>
    </Pressable>
  );
  const pills = (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 16 }}>
      {["Years", "Months", "Days", "All"].map((t) => {
        const id = t.toLowerCase(), on = period === id;
        return (
          <Pressable key={t} onPress={() => setPeriod(id)}
            style={[ph.pill, on ? { backgroundColor: "#fff" } : { backgroundColor: "rgba(255,255,255,.4)" }]}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: on ? "#000" : "rgba(0,0,0,.4)" }}>{t}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {tab === "library" && <GlassHeader title="Photos" large action="search" onAction={() => setTab("search")} />}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 96 }} nativeID="app-scroll">
        {tab === "library" && (
          <>
            <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
              <Text style={ph.caption}>Memories</Text>
              {memoryCard("Yosemite Trip", "October 12", "/img/memory.jpg")}
            </View>
            {pills}
            {period === "all" && grid(ALL)}
            {period === "days" && <>{section("Today", range(0, 6))}{section("Yesterday", range(6, 12))}{section("Last Week", range(12, 30))}</>}
            {period === "months" && <>{section("October", range(0, 18))}{section("September", range(18, 30))}</>}
            {period === "years" && <>{section("2026", range(0, 20))}{section("2025", range(20, 30))}</>}
          </>
        )}
        {tab === "foryou" && (
          <View style={{ paddingTop: 64, paddingHorizontal: 24 }}>
            <Text style={{ fontSize: 30, fontWeight: "700", marginBottom: 24 }}>For You</Text>
            <Text style={ph.caption}>Memories</Text>
            {memoryCard("Yosemite Trip", "October 12 · 18 photos", "/img/memory.jpg")}
            {memoryCard("Best of 2026", "Curated highlights", "/img/photos/ph-15.jpg")}
            {memoryCard("On This Day", "1 year ago", "/img/photos/ph-22.jpg", 148)}
          </View>
        )}
        {tab === "albums" && (album ? (
          <View style={{ paddingTop: 64 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingBottom: 18 }}>
              <Pressable onPress={() => setAlbum(null)} style={{ flexDirection: "row", alignItems: "center" }}>
                <Icon n="chevronLeft" size={20} color="#3b82f6" />
                <Text style={{ color: "#3b82f6", fontSize: 17, fontWeight: "600" }}>Albums</Text>
              </Pressable>
              <Text style={{ fontSize: 28, fontWeight: "700", marginLeft: 4 }}>{album[0]}</Text>
            </View>
            {grid(album[1])}
          </View>
        ) : (
          <View style={{ paddingTop: 64, paddingHorizontal: 24 }}>
            <Text style={{ fontSize: 30, fontWeight: "700", marginBottom: 24 }}>Albums</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>
              {ALBUMS.map(([name, idx, cover]) => (
                <Pressable key={name} style={{ width: "47%" as unknown as number, gap: 8 }} onPress={() => setAlbum([name, idx])}>
                  <View style={{ aspectRatio: 1, borderRadius: 20, overflow: "hidden", backgroundColor: "#e5e7eb" }}>
                    <Image source={{ uri: cover }} style={{ width: "100%" as unknown as number, height: "100%" as unknown as number }} resizeMode="cover" />
                  </View>
                  <View>
                    <Text style={{ fontWeight: "700", fontSize: 15, color: "rgba(0,0,0,.9)" }}>{name}</Text>
                    <Text style={{ fontSize: 13, color: "rgba(0,0,0,.5)" }}>{idx.length}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        {tab === "search" && (
          <View style={{ paddingTop: 64, paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 30, fontWeight: "700", marginBottom: 8 }}>Search</Text>
            <SearchPill value="" onChange={() => {}} placeholder="Search photos, people, places" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 14 }}>
              {CHIPS.map(([id, label]) => {
                const on = chip === id;
                return (
                  <Pressable key={id} onPress={() => setChip(id)}
                    style={[ph.chip, on ? { backgroundColor: "#000" } : { backgroundColor: "rgba(255,255,255,.5)" }]}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: on ? "#fff" : "rgba(0,0,0,.55)" }}>{label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={{ paddingTop: 4, paddingBottom: 10, fontSize: 13, fontWeight: "600", color: "rgba(0,0,0,.45)" }}>
              {CHIPS.find(([id]) => id === chip)![2].length} items
            </Text>
            {grid(CHIPS.find(([id]) => id === chip)![2])}
          </View>
        )}
      </ScrollView>
      <FloatingTabBar active={tab} onTab={(id) => { setTab(id); setAlbum(null); }} tabs={[
        { id: "library", icon: "images", label: "Library" },
        { id: "foryou", icon: "heart", label: "For You" },
        { id: "albums", icon: "squareStack", label: "Albums" },
        { id: "search", icon: "search", label: "Search" },
      ]} />
      {viewer !== null && <Viewer start={viewer} onClose={() => setViewer(null)} />}
    </View>
  );
}

function Viewer({ start, onClose }: { start: number; onClose: () => void }) {
  const [cur, setCur] = React.useState(start);
  const [like, setLike] = React.useState(false);
  const ref = React.useRef<View>(null);
  React.useEffect(() => {
    const el = domOf(ref);
    if (el) { el.style.transition = "opacity .2s"; el.style.opacity = "0"; requestAnimationFrame(() => { el.style.opacity = "1"; }); }
  }, []);
  const step = (d: number) => setCur((v) => (v + d + COUNT) % COUNT);
  const nav = (d: number) => (
    <Pressable key={d} onPress={(e) => { (e as unknown as { stopPropagation: () => void }).stopPropagation?.(); step(d); }}
      style={[ph.navBtn, d < 0 ? { left: 8 } : { right: 8 }]}>
      <Icon n={d < 0 ? "chevronLeft" : "chevronRight"} size={20} color="#fff" />
    </Pressable>
  );
  return (
    <Pressable style={ph.viewer} onPress={onClose}>
      <View ref={ref} style={StyleSheet.absoluteFill as object}>
        <Image key={cur} source={{ uri: `/img/photos/ph-${cur}.jpg` }} style={{ width: "100%" as unknown as number, height: "100%" as unknown as number }} resizeMode="contain" />
      </View>
      <Text style={ph.counter}>{cur + 1} / {COUNT}</Text>
      {nav(-1)}{nav(1)}
      <View style={ph.vbar}>
        <Pressable onPress={(e) => { (e as unknown as { stopPropagation: () => void }).stopPropagation?.(); setLike((v) => !v); }}>
          <Icon n="heart" size={22} color={like ? "#ef4444" : "#fff"} />
        </Pressable>
        <Icon n="share" size={22} color="#fff" />
        <Pressable onPress={onClose}><Icon n="trash2" size={22} color="#fff" /></Pressable>
      </View>
    </Pressable>
  );
}

const ph = StyleSheet.create({
  cell: { width: "33.33%" as unknown as number, aspectRatio: 1, backgroundColor: "#e5e7eb", overflow: "hidden", padding: 1 } as object,
  cellBig: { width: "100%" as unknown as number, aspectRatio: 16 / 9, borderRadius: 16, marginBottom: 4, backgroundColor: "#e5e7eb", overflow: "hidden" } as object,
  secT: { paddingTop: 18, paddingBottom: 10, paddingHorizontal: 20, fontSize: 17, fontWeight: "700", color: "rgba(0,0,0,.85)" },
  caption: { fontSize: 14, fontWeight: "700", color: "rgba(0,0,0,.3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  pill: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: "#f3f4f6" } as object,
  chip: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: "#f3f4f6" } as object,
  memVeil: { flex: 1, justifyContent: "flex-end", padding: 24, backgroundColor: "rgba(0,0,0,.25)" } as object,
  viewer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,.9)", zIndex: 100, alignItems: "center", justifyContent: "center" } as object,
  counter: { position: "absolute", top: 72, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,.8)", fontSize: 13, fontWeight: "600" },
  navBtn: {
    position: "absolute", top: "50%" as unknown as number, marginTop: -20, width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,.15)", alignItems: "center", justifyContent: "center", zIndex: 5,
  } as object,
  vbar: { position: "absolute", bottom: 28, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 28 } as object,
});
