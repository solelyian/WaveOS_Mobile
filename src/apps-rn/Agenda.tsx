// Agenda.tsx — calendrier : grille du mois (jours numérotés, points
// d'événements, aujourd'hui cerclé), liste des événements du jour
// (barres colorées), détail poussé sur la pile, nouvel événement.
import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { createStore, fs, Icon, Nav, StackNav, useStack, useStore, useTheme } from "../rn";

interface Ev { id: number; day: number; title: string; time: string; loc?: string; c: string }

const events = createStore<Ev[]>([
  { id: 1, day: 8, title: "Revue design Sillage", time: "10:00 – 11:00", loc: "Studio", c: "#7DA2FF" },
  { id: 2, day: 8, title: "Call Camille — icônes", time: "14:30 – 15:15", c: "#2FCC92" },
  { id: 3, day: 10, title: "Sprint review", time: "09:30 – 11:00", loc: "Visio", c: "#F0A02E" },
  { id: 4, day: 13, title: "Resto avec Léa", time: "20:00", loc: "Le Hublot", c: "#FF6B57" },
  { id: 5, day: 16, title: "Dead-line vague C RN", time: "Toute la journée", c: "#B48EF2" },
  { id: 6, day: 22, title: "Démo direction", time: "15:00 – 16:00", loc: "Salle Conseil", c: "#7DA2FF" },
]);

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTH = "Octobre 2026";
// Octobre 2026 : le 1er est un jeudi (col 3), 31 jours.
const OFFSET = 3;
const NB = 31;
const TODAY = 8;

let eid = 50;

function Detail({ ev }: { ev: Ev }): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav onBack={pop} back="Agenda" right={<Pressable onPress={() => { events.set(e => e.filter(x => x.id !== ev.id)); pop(); }}><Icon name="trash-2" size={18} color={p.corail} sw={2} /></Pressable>} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <View style={{ width: 5, height: 44, borderRadius: 3, backgroundColor: ev.c, marginBottom: 14 }} />
        <Text style={{ fontSize: fs(24, p), fontWeight: "800", color: p.text }}>{ev.title}</Text>
        <Text style={{ fontSize: fs(14, p), color: p.sub, marginTop: 4 }}>{ev.day} {MONTH.split(" ")[0]} · {ev.time}</Text>
        {ev.loc ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14, backgroundColor: p.card, borderRadius: 12, padding: 11, borderWidth: 0.5, borderColor: p.sep }}>
            <Icon name="map-pin" size={15} color={p.tint} sw={2.2} />
            <Text style={{ fontSize: fs(14, p), color: p.text }}>{ev.loc}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: "row", gap: 9, marginTop: 20 }}>
          {[["Modifier", "pencil"], ["Inviter", "user-round"], ["Dupliquer", "plus"]].map(([l, ic]) => (
            <Pressable key={l as string} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, backgroundColor: p.field }}>
              <Icon name={ic as string} size={13} color={p.tint} sw={2.2} />
              <Text style={{ fontSize: fs(13, p), fontWeight: "600", color: p.tint }}>{l}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Home(): ReactNode {
  const p = useTheme();
  const { push } = useStack();
  const evs = useStore(events);
  const [sel, setSel] = useState(TODAY);
  const cells: (number | null)[] = [...Array(OFFSET).fill(null), ...Array.from({ length: NB }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const dayEvs = evs.filter(e => e.day === sel);
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav large="Agenda" right={<Pressable onPress={() => {
        eid++;
        events.set(e => [...e, { id: eid, day: sel, title: "Nouvel événement", time: "12:00 – 13:00", c: "#7DA2FF" }]);
      }}><Icon name="plus" size={20} color={p.tint} sw={2.4} /></Pressable>} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 26 }}>
        {/* en-tête mois */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4, marginBottom: 8 }}>
          <Text style={{ fontSize: fs(19, p), fontWeight: "700", color: p.corail }}>{MONTH}</Text>
          <View style={{ flexDirection: "row", gap: 14 }}>
            <Icon name="chevron-left" size={18} color={p.tint} sw={2.6} />
            <Icon name="chevron-right" size={18} color={p.tint} sw={2.6} />
          </View>
        </View>
        {/* jours */}
        <View style={{ flexDirection: "row", marginBottom: 4 }}>
          {DAYS.map((d, i) => <Text key={i} style={{ flex: 1, textAlign: "center", fontSize: fs(11, p), color: p.faint, fontWeight: "600" }}>{d}</Text>)}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", backgroundColor: p.card, borderRadius: 16, padding: 6, borderWidth: 0.5, borderColor: p.sep }}>
          {cells.map((d, i) => {
            const has = d !== null && evs.some(e => e.day === d);
            return (
              <Pressable key={i} onPress={() => d && setSel(d)} style={{
                width: `${100 / 7}%`, aspectRatio: 1.05, alignItems: "center", justifyContent: "center",
              }}>
                <View style={{
                  width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center",
                  backgroundColor: d === sel ? p.tint : d === TODAY ? "rgba(125,162,255,.16)" : "transparent",
                }}>
                  <Text style={{
                    fontSize: fs(15, p), fontWeight: d === sel || d === TODAY ? "700" : "400",
                    color: d === sel ? "#fff" : p.text,
                  }}>{d ?? ""}</Text>
                  {has ? <View style={{ position: "absolute", bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: d === sel ? "#fff" : p.tint }} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        {/* événements du jour */}
        <Text style={{ fontSize: fs(12.5, p), fontWeight: "700", color: p.sub, marginTop: 16, marginBottom: 8, letterSpacing: 0.3 }}>
          {sel} OCTOBRE
        </Text>
        {dayEvs.length === 0 ? (
          <Text style={{ fontSize: fs(13, p), color: p.faint, paddingHorizontal: 4 }}>Aucun événement ce jour.</Text>
        ) : (
          <View style={{ backgroundColor: p.card, borderRadius: 16, overflow: "hidden", borderWidth: 0.5, borderColor: p.sep }}>
            {dayEvs.map((ev, i) => (
              <Pressable key={ev.id} onPress={() => push(<Detail ev={ev} />)} style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 13, paddingVertical: 11,
                borderBottomWidth: i === dayEvs.length - 1 ? 0 : 0.5, borderBottomColor: p.sep,
                backgroundColor: pressed ? p.card2 : "transparent",
              })}>
                <View style={{ width: 4, height: 34, borderRadius: 2, backgroundColor: ev.c }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fs(15, p), fontWeight: "600", color: p.text }}>{ev.title}</Text>
                  <Text style={{ fontSize: fs(12, p), color: p.faint }}>{ev.time}{ev.loc ? ` · ${ev.loc}` : ""}</Text>
                </View>
                <Icon name="chevron-right" size={14} color={p.faint} sw={2.4} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export function AgendaApp(): ReactNode {
  return <StackNav root={<Home />} />;
}
