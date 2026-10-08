// Store.tsx — Wave Store : onglets Aujourd'hui / Apps / Jeux, cartes
// éditoriales (app du jour, collection), liste avec icônes dégradé,
// notes, boutons OBTENIR→Installation…→OUVRIR (état réel), recherche,
// fiche app (captures, avis).
import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { createStore, fs, Icon, Nav, SecTitle, Search, StackNav, TabBar, useStack, useStore, useTheme } from "../rn";

interface App { id: number; name: string; dev: string; desc: string; c0: string; c1: string; ic: string; rating: string; nb: string; price: string }

const APPS: App[] = [
  { id: 1, name: "Flux", dev: "Studio Meridian", desc: "Éditeur d'images pro", c0: "#8FB0FF", c1: "#5570D6", ic: "aperture", rating: "4,9", nb: "12k", price: "Gratuit" },
  { id: 2, name: "Tide", dev: "Abysses Lab", desc: "Méditation & sons d'eau", c0: "#7BE0C0", c1: "#1FA870", ic: "waves", rating: "4,7", nb: "8k", price: "Gratuit" },
  { id: 3, name: "Solstice", dev: "Nordic Bits", desc: "Météo augmentée", c0: "#FFC46B", c1: "#E87E1E", ic: "sun", rating: "4,8", nb: "31k", price: "4,99 €" },
  { id: 4, name: "Cadence", dev: "Voss Audio", desc: "Lecteur audio spatial", c0: "#FF9FB4", c1: "#E8446B", ic: "music", rating: "4,6", nb: "5k", price: "Gratuit" },
  { id: 5, name: "Parsec", dev: "Orbit Soft", desc: "Client terminal", c0: "#B48EF2", c1: "#6B3FD4", ic: "command", rating: "4,5", nb: "3k", price: "9,99 €" },
  { id: 6, name: "Halo", dev: "Meridian", desc: "Suivi du sommeil", c0: "#9FB9F5", c1: "#4A6CC9", ic: "moon", rating: "4,4", nb: "19k", price: "Gratuit" },
];

const installs = createStore<Record<number, "get" | "inst" | "open">>({});

function GetButton({ id, price }: { id: number; price: string }): ReactNode {
  const p = useTheme();
  const st = useStore(installs)[id] ?? "get";
  return (
    <Pressable onPress={() => {
      if (st === "get") { installs.set(s => ({ ...s, [id]: "inst" })); setTimeout(() => installs.set(s => ({ ...s, [id]: "open" })), 1400); }
    }} style={{
      paddingVertical: 6, paddingHorizontal: 17, borderRadius: 15,
      backgroundColor: st === "open" ? "transparent" : p.field,
      borderWidth: st === "open" ? 0 : 0,
    }}>
      <Text style={{
        fontSize: fs(13, p), fontWeight: "700", letterSpacing: 0.3,
        color: st === "open" ? p.tint : p.tint,
      }}>
        {st === "get" ? (price === "Gratuit" ? "OBTENIR" : price) : st === "inst" ? "…" : "OUVRIR"}
      </Text>
    </Pressable>
  );
}

function AppIcon({ a, size = 52 }: { a: App; size?: number }): ReactNode {
  return (
    <View style={{
      width: size, height: size, borderRadius: size * 0.26,
      background: `linear-gradient(145deg,${a.c0},${a.c1})`,
      alignItems: "center", justifyContent: "center",
      shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    } as object}>
      <Icon name={a.ic} size={size * 0.48} color="#fff" sw={2} />
    </View>
  );
}

function Fiche({ a }: { a: App }): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav onBack={pop} back="Store" right={<Icon name="share-2" size={18} color={p.tint} sw={2.2} />} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}>
        <View style={{ flexDirection: "row", gap: 13, alignItems: "center" }}>
          <AppIcon a={a} size={72} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fs(20, p), fontWeight: "700", color: p.text }}>{a.name}</Text>
            <Text style={{ fontSize: fs(13, p), color: p.sub }}>{a.desc}</Text>
            <Text style={{ fontSize: fs(12, p), color: p.faint }}>{a.dev}</Text>
          </View>
          <GetButton id={a.id} price={a.price} />
        </View>
        {/* stats */}
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: 18, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: p.sep, paddingVertical: 12 }}>
          {[[a.rating, `${a.nb} notes`, "star"], ["#2", "Graphiques", "chart-bar"], ["12+", "ans", "user-round"]].map(([v, l, ic]) => (
            <View key={l} style={{ alignItems: "center", gap: 3 }}>
              <Icon name={ic as string} size={14} color={p.faint} sw={2.2} />
              <Text style={{ fontSize: fs(15, p), fontWeight: "700", color: p.text }}>{v}</Text>
              <Text style={{ fontSize: fs(10.5, p), color: p.faint }}>{l}</Text>
            </View>
          ))}
        </View>
        {/* captures */}
        <Text style={{ fontSize: fs(16, p), fontWeight: "700", color: p.text, marginBottom: 9 }}>Aperçu</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {[0, 1, 2].map(i => (
            <View key={i} style={{
              width: 190, height: 320, borderRadius: 18,
              background: `linear-gradient(160deg,${a.c0}cc,${a.c1})`,
              alignItems: "center", justifyContent: "center",
            } as object}>
              <Icon name={a.ic} size={42} color="rgba(255,255,255,.9)" sw={1.8} />
            </View>
          ))}
        </ScrollView>
        <Text style={{ fontSize: fs(16, p), fontWeight: "700", color: p.text, marginTop: 20, marginBottom: 7 }}>Description</Text>
        <Text style={{ fontSize: fs(13.5, p), color: p.sub, lineHeight: 20 }}>
          {a.desc} — pensée pour WaveOS. Interface verre, ressorts physiques, zéro tracking. {a.name} exploite le moteur Sillage pour des transitions fluides à 120 fps.
        </Text>
      </ScrollView>
    </View>
  );
}

function Aujourdhui(): ReactNode {
  const p = useTheme();
  const { push } = useStack();
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
      {/* carte éditoriale */}
      <Pressable onPress={() => push(<Fiche a={APPS[0]} />)} style={{
        borderRadius: 20, overflow: "hidden", height: 300, marginBottom: 18,
        background: "linear-gradient(160deg,#2a3670,#5570D6)",
      } as object}>
        <View style={{ flex: 1, padding: 16, justifyContent: "flex-end" }}>
          <Text style={{ fontSize: fs(10.5, p), fontWeight: "700", color: "rgba(255,255,255,.7)", letterSpacing: 1.2 }}>APP DU JOUR</Text>
          <Text style={{ fontSize: fs(24, p), fontWeight: "800", color: "#fff", marginTop: 4 }}>Flux</Text>
          <Text style={{ fontSize: fs(13, p), color: "rgba(255,255,255,.75)" }}>L'éditeur d'images qui respecte votre rythme</Text>
        </View>
        <View style={{ position: "absolute", top: 14, right: 14 }}>
          <AppIcon a={APPS[0]} size={64} />
        </View>
      </Pressable>
      <SecTitle>Essentiels Sillage</SecTitle>
      <View style={{ backgroundColor: p.card, borderRadius: 18, overflow: "hidden", borderWidth: 0.5, borderColor: p.sep }}>
        {APPS.slice(1).map((a, i) => (
          <Pressable key={a.id} onPress={() => push(<Fiche a={a} />)} style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 13, paddingVertical: 10,
            borderBottomWidth: i === APPS.length - 2 ? 0 : 0.5, borderBottomColor: p.sep,
            backgroundColor: pressed ? p.card2 : "transparent",
          })}>
            <AppIcon a={a} size={46} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fs(15, p), fontWeight: "600", color: p.text }}>{a.name}</Text>
              <Text style={{ fontSize: fs(11.5, p), color: p.faint }} numberOfLines={1}>{a.desc} · {a.dev}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 }}>
                <Icon name="star" size={10} color={p.ambre} sw={2.6} />
                <Text style={{ fontSize: fs(11, p), color: p.faint }}>{a.rating} ({a.nb})</Text>
              </View>
            </View>
            <GetButton id={a.id} price={a.price} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function Classement({ genre }: { genre: string }): ReactNode {
  const p = useTheme();
  const { push } = useStack();
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
      <SecTitle>{`${genre} — top charts`}</SecTitle>
      <View style={{ backgroundColor: p.card, borderRadius: 18, overflow: "hidden", borderWidth: 0.5, borderColor: p.sep }}>
        {APPS.map((a, i) => (
          <Pressable key={a.id} onPress={() => push(<Fiche a={a} />)} style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 13, paddingVertical: 10,
            borderBottomWidth: i === APPS.length - 1 ? 0 : 0.5, borderBottomColor: p.sep,
            backgroundColor: pressed ? p.card2 : "transparent",
          })}>
            <Text style={{ width: 22, fontSize: fs(17, p), fontWeight: "700", color: p.faint, textAlign: "center" }}>{i + 1}</Text>
            <AppIcon a={a} size={46} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fs(15, p), fontWeight: "600", color: p.text }}>{a.name}</Text>
              <Text style={{ fontSize: fs(11.5, p), color: p.faint }} numberOfLines={1}>{a.desc}</Text>
            </View>
            <GetButton id={a.id} price={a.price} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

export function StoreApp(): ReactNode {
  return <StackNav root={<StoreHome />} />;
}

function StoreHome(): ReactNode {
  const p = useTheme();
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState("");
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav large="Store" />
      <Search value={q} onChange={setQ} ph="Apps, jeux, développeurs…" />
      <View style={{ flex: 1 }}>
        {tab === 0 ? <Aujourdhui /> : <Classement genre={tab === 1 ? "Apps" : "Jeux"} />}
      </View>
      <TabBar items={[
        { icon: "star", label: "Aujourd'hui" },
        { icon: "layout-grid", label: "Apps" },
        { icon: "gamepad-2", label: "Jeux" },
      ]} idx={tab} onChange={setTab} />
    </View>
  );
}
