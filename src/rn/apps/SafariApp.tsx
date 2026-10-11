// SafariApp.tsx — Surf : Start Page, favoris ouvrables, Privacy Report,
// barre d'URL fonctionnelle (page lecteur mockée en fondu).
import React from "react";
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet } from "react-native";
import { Icon } from "../Icon";
import { GBtn } from "./ui";
import { domOf } from "../fx";

const SITES = [
  { name: "Nyne", icon: "🍎", color: "#000" },
  { name: "Google", icon: "G", color: "#ef4444" },
  { name: "Twitter", icon: "X", color: "#000" },
  { name: "News", icon: "📰", color: "#ec4899" },
  { name: "Reddit", icon: "👾", color: "#f97316" },
  { name: "YouTube", icon: "▶️", color: "#dc2626" },
];

export function SafariApp() {
  const [page, setPage] = React.useState<string | null>(null);
  const [url, setUrl] = React.useState("nyne.com");
  const barRef = React.useRef<View>(null);
  React.useEffect(() => {
    const el = domOf(barRef);
    if (el) { el.style.backdropFilter = "blur(20px) saturate(150%)"; (el.style as unknown as Record<string, string>).WebkitBackdropFilter = "blur(20px) saturate(150%)"; }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 64, paddingHorizontal: 24, paddingBottom: 96 }} nativeID="app-scroll">
        <Text style={{ fontSize: 30, fontWeight: "700", marginBottom: 32 }}>Start Page</Text>
        <Text style={sf.caption}>Favorites</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 24 }}>
          {SITES.map((s) => (
            <Pressable key={s.name} style={{ width: "25%", alignItems: "center", gap: 8 }}
              onPress={() => { setUrl(`${s.name.toLowerCase()}.com`); setPage(s.name); }}>
              <View style={[sf.tile, { backgroundColor: s.color }]}>
                <Text style={{ fontSize: 24, color: "#fff" }}>{s.icon}</Text>
              </View>
              <Text style={{ fontSize: 12, color: "rgba(0,0,0,.6)", fontWeight: "500" }}>{s.name}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[sf.caption, { marginTop: 40 }]}>Privacy Report</Text>
        <View style={sf.card}>
          <Icon n="shield" size={40} color="#3b82f6" />
          <View>
            <Text style={{ fontWeight: "700", fontSize: 18, color: "rgba(0,0,0,.9)" }}>24 Trackers Prevented</Text>
            <Text style={{ fontSize: 12, color: "rgba(0,0,0,.5)", fontWeight: "500" }}>In the last 24 hours</Text>
          </View>
        </View>
      </ScrollView>
      <View ref={barRef} style={sf.bar}>
        <Icon n="shield" size={16} color="rgba(0,0,0,.5)" />
        <TextInput style={sf.url} value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false}
          onSubmitEditing={() => setPage(url.trim().replace(/\.com$/, "") || "nyne")} />
        <Pressable onPress={() => setPage(url.trim().replace(/\.com$/, "") || "nyne")}>
          <Icon n="layoutGrid" size={18} color="#3b82f6" />
        </Pressable>
      </View>
      {page && <ReaderPage name={page} onBack={() => setPage(null)} />}
    </View>
  );
}

function ReaderPage({ name, onBack }: { name: string; onBack: () => void }) {
  const ref = React.useRef<View>(null);
  React.useEffect(() => {
    const el = domOf(ref);
    if (el) { el.style.transition = "opacity .2s"; el.style.opacity = "0"; requestAnimationFrame(() => { el.style.opacity = "1"; }); }
  }, []);
  return (
    <View ref={ref} style={sf.reader}>
      <View style={sf.rhdr}>
        <Pressable onPress={onBack}><Icon n="chevronLeft" size={20} color="#3b82f6" /></Pressable>
        <Text style={{ fontWeight: "700", fontSize: 15 }}>{name}</Text>
        <View style={{ flex: 1 }} />
        <Icon n="share" size={18} color="#9ca3af" />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }} nativeID="app-scroll">
        <View style={sf.ricon}><Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>{name[0].toUpperCase()}</Text></View>
        <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 12 }}>Welcome to {name}</Text>
        {["This is a placeholder page rendered by WaveOS WebKit. The layout engine draws real content blocks with fluid typography and responsive spacing.",
          "Scroll behaviour, momentum and overscroll are handled by the shared gesture router — the same engine that drives every app in the system.",
          "Reader mode, tab management and private relay are simulated inside the shell sandbox."].map((t) => (
            <Text key={t} style={{ color: "#4b5563", lineHeight: 27, fontSize: 16, marginBottom: 14 }}>{t}</Text>
          ))}
      </ScrollView>
    </View>
  );
}

const sf = StyleSheet.create({
  caption: { fontSize: 14, fontWeight: "700", color: "rgba(0,0,0,.3)", marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.8 },
  tile: {
    width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center",
  } as object,
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 20, flexDirection: "row", alignItems: "center", gap: 16, borderWidth: 1, borderColor: "#f3f4f6" } as object,
  bar: {
    position: "absolute", bottom: 32, left: 16, right: 16, height: 56,
    backgroundColor: "rgba(255,255,255,.4)", borderRadius: 24,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12, zIndex: 20,
  } as object,
  url: { flex: 1, textAlign: "center", fontWeight: "500", fontSize: 14, color: "rgba(0,0,0,.9)", padding: 0, outlineStyle: "none" } as object,
  reader: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 30, backgroundColor: "#fff" } as object,
  rhdr: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" } as object,
  ricon: {
    width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: "#3b82f6", marginBottom: 16,
  } as object,
});
