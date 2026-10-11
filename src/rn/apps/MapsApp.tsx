// MapsApp.tsx — Plans : fond raster rendu par le moteur C++ (wavegfx.cpp),
// recherche glass, chips, repère Union Square, carte du bas.
import React from "react";
import { View, Text, Pressable, Image, ScrollView, TextInput, StyleSheet } from "react-native";
import { Icon } from "../Icon";
import { host } from "../host";
import { W, loadWasm } from "../../wasm/bridge";
import { domOf } from "../fx";

let mapData: Uint8ClampedArray | null = null;
const MW = 480, MH = 850;
function ensureMap() {
  if (mapData) return;
  const w = W();
  w.wg_map_size(MW, MH);
  w.wg_map_render();
  const ptr = w.wg_map_ptr();
  mapData = new Uint8ClampedArray(w.memory.buffer, ptr, MW * MH * 4);
}

function MapCanvas({ routed }: { routed: number }) {
  const ref = React.useRef<View>(null);
  const cv = React.useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = React.useState(!!mapData);
  React.useEffect(() => {
    try { ensureMap(); setReady(true); }
    catch { loadWasm().then(() => { try { ensureMap(); } catch { /* */ } setReady(true); }); }
  }, []);
  React.useEffect(() => {
    const el = domOf(ref); if (!el) return;
    if (!cv.current) {
      const c = document.createElement("canvas");
      c.width = MW; c.height = MH;
      c.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;filter:grayscale(.2)";
      el.append(c);
      cv.current = c;
    }
    const ctx = cv.current.getContext("2d");
    if (!ctx) return;
    const restore = () => {
      try { ctx.putImageData(new ImageData(mapData!.slice(), MW, MH), 0, 0); } catch { /* raster indispo */ }
    };
    try { ensureMap(); restore(); } catch { cv.current.style.background = "#e5e3df"; }
    if (routed > 0) {
      ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.setLineDash([16, 12]);
      ctx.beginPath(); ctx.moveTo(56, 780); ctx.bezierCurveTo(90, 640, 360, 660, 300, 470); ctx.quadraticCurveTo(260, 380, 240, 428); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = "#3b82f6";
      ctx.beginPath(); ctx.arc(56, 780, 10, 0, 7); ctx.fill();
    }
  }, [routed, ready]);
  return <View ref={ref} style={StyleSheet.absoluteFill as object} pointerEvents="none" />;
}

export function MapsApp() {
  const [place, setPlace] = React.useState({ name: "Union Square", sub: "Public Plaza • 0.2 mi away", pin: "Union Square" });
  const [routed, setRouted] = React.useState(0);
  const [q, setQ] = React.useState("");
  const barRef = React.useRef<View>(null);
  const cardRef = React.useRef<View>(null);
  const pinRef = React.useRef<View>(null);
  React.useEffect(() => {
    for (const r of [barRef, cardRef]) {
      const el = domOf(r);
      if (el) { el.style.backdropFilter = "blur(20px) saturate(150%)"; (el.style as unknown as Record<string, string>).WebkitBackdropFilter = "blur(20px) saturate(150%)"; }
    }
    const p = domOf(pinRef);
    if (p) { p.style.backdropFilter = "blur(12px)"; (p.style as unknown as Record<string, string>).WebkitBackdropFilter = "blur(12px)"; }
  }, []);

  const chip = (name: string) => setPlace({
    name, pin: name,
    sub: `${4 + Math.floor(Math.random() * 9)} nearby • 0.${1 + Math.floor(Math.random() * 8)} mi away`,
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#e5e3df", overflow: "hidden" }}>
      <MapCanvas routed={routed} />
      <View style={{ position: "absolute", top: 56, left: 16, right: 16, zIndex: 20 }}>
        <View ref={barRef} style={mp.bar}>
          <Pressable style={mp.backBtn} onPress={() => host.closeApp()}>
            <Icon n="chevronLeft" size={16} color="#111" />
          </Pressable>
          <Icon n="search" size={18} color="#111" />
          <TextInput style={mp.input} value={q} onChangeText={setQ} placeholder="Search Maps" placeholderTextColor="rgba(0,0,0,.5)"
            onSubmitEditing={() => { if (q.trim()) setPlace({ name: q.trim(), sub: "Search result • 0.4 mi away", pin: q.trim() }); }} />
          <View style={mp.jd}><Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>JD</Text></View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 12, paddingLeft: 4 }}>
          {["Restaurants", "Gas", "Groceries", "Hotels"].map((c) => (
            <Pressable key={c} onPress={() => chip(c)} style={mp.chip}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#1f2937" }}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View style={mp.pinWrap} pointerEvents="none">
        <View ref={pinRef} style={mp.pinLabel}><Text style={{ fontSize: 12, fontWeight: "700", color: "#111" }}>{place.pin}</Text></View>
        <Icon n="mapPin" size={36} color="#ef4444" />
      </View>
      <View ref={cardRef} style={mp.card}>
        <View style={{ width: 48, height: 4, backgroundColor: "rgba(0,0,0,.2)", borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "rgba(0,0,0,.9)" }}>{place.name}</Text>
            <Text style={{ fontSize: 14, color: "rgba(0,0,0,.6)" }}>{place.sub}</Text>
          </View>
          <Pressable style={mp.routeBtn} onPress={() => { setRouted((v) => v + 1); setPlace((p) => ({ ...p, sub: `Route • ${6 + Math.floor(Math.random() * 20)} min` })); }}>
            <Icon n="navigation" size={20} color="#fff" />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <Image key={i} source={{ uri: `/img/maps-${i}.jpg` }} style={mp.thumb} resizeMode="cover" />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const mp = StyleSheet.create({
  bar: {
    borderRadius: 24, height: 48, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, gap: 12, backgroundColor: "rgba(255,255,255,.4)",
  } as object,
  backBtn: { padding: 4, backgroundColor: "rgba(255,255,255,.6)", borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,.4)" } as object,
  input: { flex: 1, fontSize: 14, fontWeight: "500", color: "#000", padding: 0, outlineStyle: "none" } as object,
  jd: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#3b82f6", alignItems: "center", justifyContent: "center" } as object,
  chip: { paddingVertical: 6, paddingHorizontal: 16, backgroundColor: "rgba(255,255,255,.6)", borderRadius: 999 } as object,
  pinWrap: { position: "absolute", top: "50%" as unknown as number, left: "50%" as unknown as number, marginLeft: -30, marginTop: -50, alignItems: "center", zIndex: 10 } as object,
  pinLabel: {
    backgroundColor: "rgba(255,255,255,.9)", borderWidth: 1, borderColor: "rgba(255,255,255,.5)",
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4,
  } as object,
  card: {
    position: "absolute", bottom: 32, left: 16, right: 16, zIndex: 20,
    backgroundColor: "rgba(255,255,255,.6)", borderRadius: 32, padding: 20, paddingBottom: 32,
  } as object,
  routeBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#3b82f6", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#60a5fa" } as object,
  thumb: { width: 96, height: 96, borderRadius: 16, backgroundColor: "#e5e7eb" },
});
