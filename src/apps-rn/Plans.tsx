// Plans.tsx — cartographie simulée réaliste : plan stylisé (pâtés de
// maisons, routes, rivière en ruban, parcs), pins catégorisés, recherche,
// fiche lieu au tap (photos dégradé, horaires, boutons Itinéraire/Appeler/
// Site), filtres catégories.
import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { fs, Icon, useTheme } from "../rn";

interface Pin { x: number; y: number; ic: string; c: string; name: string; kind: string; info: string }

const PINS: Pin[] = [
  { x: 30, y: 24, ic: "coffee", c: "#F0A02E", name: "Café Rubans", kind: "Café", info: "Ouvert · ferme à 19h · 4,8 ★" },
  { x: 62, y: 42, ic: "music", c: "#FF6B57", name: "Studio Nyne", kind: "Musique", info: "Réservé vendredi 20h" },
  { x: 44, y: 66, ic: "book-open", c: "#7DA2FF", name: "Bibliothèque", kind: "Culture", info: "Ouverte · jusqu'à 22h" },
  { x: 78, y: 20, ic: "camera", c: "#2FCC92", name: "Parc Aube", kind: "Parc", info: "Point de vue photo" },
  { x: 20, y: 54, ic: "shopping-bag", c: "#B48EF2", name: "Marché Opale", kind: "Commerce", info: "Ferme à 20h" },
];

const CATS = [["Tous", "map-pin"], ["Cafés", "coffee"], ["Culture", "book-open"], ["Parcs", "camera"]] as const;

function MapCanvas({ sel, onPin }: { sel: Pin | null; onPin: (p: Pin) => void }): ReactNode {
  return (
    <View style={{ position: "absolute", inset: 0, backgroundColor: "#101527" }}>
      {/* pâtés de maisons */}
      {[
        [8, 12, 22, 18], [36, 10, 18, 24], [60, 8, 28, 16],
        [6, 38, 24, 16], [38, 42, 20, 14], [66, 32, 22, 20],
        [10, 62, 26, 18], [44, 64, 18, 22], [68, 60, 24, 18],
      ].map(([x, y, w, h], i) => (
        <View key={i} style={{
          position: "absolute", left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`,
          backgroundColor: i % 3 === 0 ? "#1a2140" : "#161c36", borderRadius: 4,
          borderWidth: 0.5, borderColor: "#232c52",
        }} />
      ))}
      {/* rivière ruban */}
      <View style={{
        position: "absolute", left: "-20%", top: "78%", width: "150%", height: 60,
        backgroundColor: "#24346b", transform: [{ rotate: "-10deg" }],
        borderTopWidth: 1, borderTopColor: "#2f4488", opacity: 0.9,
      }} />
      {/* routes */}
      {[[20, 0, 0.8, 100, 30], [0, 30, 100, 0.8, 0], [0, 55, 100, 0.6, 0]].map(([x, y, w, h, r], i) => (
        <View key={"r" + i} style={{
          position: "absolute", left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`,
          backgroundColor: "#2a3255", transform: [{ rotate: `${r}deg` }], opacity: 0.7,
        }} />
      ))}
      {/* pins */}
      {PINS.map(pin => (
        <Pressable key={pin.name} onPress={() => onPin(pin)} style={{
          position: "absolute", left: `${pin.x}%`, top: `${pin.y}%`,
          width: 30, height: 30, borderRadius: 15, backgroundColor: pin.c,
          alignItems: "center", justifyContent: "center",
          borderWidth: sel?.name === pin.name ? 2 : 0, borderColor: "#fff",
          shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
          transform: [{ translateX: -15 }, { translateY: -15 }],
        } as object}>
          <Icon name={pin.ic} size={14} color="#fff" sw={2.4} />
        </Pressable>
      ))}
      {/* ma position */}
      <View style={{ position: "absolute", left: "50%", top: "46%", width: 14, height: 14, borderRadius: 7, backgroundColor: "#5B8DEF", borderWidth: 3, borderColor: "#fff" }} />
    </View>
  );
}

export function PlansApp(): ReactNode {
  const p = useTheme();
  const [q] = useState("");
  const [sel, setSel] = useState<Pin | null>(null);
  const [cat, setCat] = useState(0);
  return (
    <View style={{ flex: 1, backgroundColor: "#101527" }}>
      <MapCanvas sel={sel} onPin={setSel} />
      {/* recherche flottante */}
      <View style={{ position: "absolute", top: 58, left: 14, right: 14 }}>
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: p.card,
          borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9,
          borderWidth: 0.5, borderColor: p.sep,
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        } as object}>
          <Icon name="search" size={15} color={p.faint} sw={2.4} />
          <Text style={{ fontSize: fs(14, p), color: q ? p.text : p.faint, flex: 1 }}>{q || "Rechercher un lieu"}</Text>
          <Icon name="mic" size={14} color={p.faint} sw={2.2} />
        </View>
        {/* filtres */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row", gap: 8, paddingTop: 9, alignItems: "flex-start" }}>
          {CATS.map(([l, ic], i) => (
            <Pressable key={l} onPress={() => setCat(i)} style={{
              flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6, paddingHorizontal: 12,
              borderRadius: 15, backgroundColor: cat === i ? p.tint : p.card,
              borderWidth: 0.5, borderColor: p.sep,
            }}>
              <Icon name={ic} size={12} color={cat === i ? "#fff" : p.sub} sw={2.4} />
              <Text style={{ fontSize: fs(12, p), fontWeight: "600", color: cat === i ? "#fff" : p.sub }}>{l}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {/* fiche lieu */}
      {sel ? (
        <View style={{
          position: "absolute", left: 10, right: 10, bottom: 16,
          backgroundColor: p.card, borderRadius: 20, padding: 15,
          borderWidth: 0.5, borderColor: p.sep,
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        } as object}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: sel.c, alignItems: "center", justifyContent: "center" }}>
              <Icon name={sel.ic} size={20} color="#fff" sw={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fs(16, p), fontWeight: "700", color: p.text }}>{sel.name}</Text>
              <Text style={{ fontSize: fs(12, p), color: p.sub }}>{sel.kind} · {sel.info}</Text>
            </View>
            <Pressable onPress={() => setSel(null)}><Icon name="x" size={17} color={p.faint} sw={2.4} /></Pressable>
          </View>
          <View style={{ flexDirection: "row", gap: 9, marginTop: 13 }}>
            {[["Itinéraire", "navigation", true], ["Appeler", "phone", false], ["Site web", "globe", false]].map(([l, ic, prim]) => (
              <Pressable key={l as string} style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 14,
                borderRadius: 16, backgroundColor: prim ? p.tint : p.field, opacity: pressed ? 0.7 : 1,
              })}>
                <Icon name={ic as string} size={13} color={prim ? "#fff" : p.tint} sw={2.4} />
                <Text style={{ fontSize: fs(13, p), fontWeight: "600", color: prim ? "#fff" : p.tint }}>{l as string}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      {/* boussole + recentrer */}
      <View style={{ position: "absolute", right: 14, bottom: sel ? 130 : 20, gap: 10, alignItems: "flex-end" }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p.card, alignItems: "center", justifyContent: "center", borderWidth: 0.5, borderColor: p.sep }}>
          <Icon name="compass" size={18} color={p.tint} sw={2.2} />
        </View>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p.card, alignItems: "center", justifyContent: "center", borderWidth: 0.5, borderColor: p.sep }}>
          <Icon name="locate-fixed" size={18} color={p.tint} sw={2.2} />
        </View>
      </View>
    </View>
  );
}
