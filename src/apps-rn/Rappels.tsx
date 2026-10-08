// Rappels.tsx — listes de rappels réelles : cercles cochables (coché →
// barré + grisé), sections par date, ajout rapide via champ + bouton,
// compteurs Aujourd'hui / Programmé / Tous, liste « Terminés ».
import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { createStore, fs, Icon, Nav, StackNav, useStore, useTheme } from "../rn";

interface Task { id: number; title: string; when: string; list: string; done: boolean; flag?: boolean }

let nid = 50;
const tasks = createStore<Task[]>([
  { id: 1, title: "Envoyer la DA v2 à Camille", when: "Aujourd'hui 16:00", list: "Travail", flag: true, done: false },
  { id: 2, title: "Revue motion — edge stretch", when: "Aujourd'hui 18:30", list: "Travail", done: false },
  { id: 3, title: "Appeler le garage", when: "Aujourd'hui", list: "Perso", done: true },
  { id: 4, title: "Renouveler ordonnance", when: "Demain 09:00", list: "Santé", done: false },
  { id: 5, title: "Réserver resto samedi", when: "Demain", list: "Perso", done: false },
  { id: 6, title: "Cadeau Léa — vinyle Rubans", when: "15 oct.", list: "Perso", flag: true, done: false },
  { id: 7, title: "Push PR vague B RN", when: "16 oct.", list: "Travail", done: false },
  { id: 8, title: "Payer facture élec.", when: "20 oct.", list: "Perso", done: false },
]);

function TaskRow({ t }: { t: Task }): ReactNode {
  const p = useTheme();
  return (
    <Pressable onPress={() => tasks.set(ts => ts.map(x => x.id === t.id ? { ...x, done: !x.done } : x))}
      style={({ pressed }) => ({
        flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 14, paddingVertical: 10.5,
        backgroundColor: pressed ? p.card2 : "transparent",
      })}>
      <View style={{
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 1.6, borderColor: t.done ? p.tint : p.faint,
        backgroundColor: t.done ? p.tint : "transparent",
        alignItems: "center", justifyContent: "center",
      }}>
        {t.done ? <Icon name="check" size={12} color="#fff" sw={3} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: fs(14.5, p), color: t.done ? p.faint : p.text, textDecorationLine: t.done ? "line-through" : "none" }}>{t.title}</Text>
        <Text style={{ fontSize: fs(11.5, p), color: p.faint, marginTop: 1 }}>{t.when}</Text>
      </View>
      {t.flag ? <Icon name="flag" size={13} color={p.ambre} sw={2.4} /> : null}
    </Pressable>
  );
}

function Home(): ReactNode {
  const p = useTheme();
  const list = useStore(tasks);
  const [draft, setDraft] = useState("");
  const today = list.filter(t => !t.done && t.when.startsWith("Aujourd'hui"));
  const upcoming = list.filter(t => !t.done && !t.when.startsWith("Aujourd'hui"));
  const done = list.filter(t => t.done);
  const add = () => {
    if (!draft.trim()) return;
    nid++;
    tasks.set(ts => [{ id: nid, title: draft.trim(), when: "Aujourd'hui", list: "Perso", done: false }, ...ts]);
    setDraft("");
  };
  const cards: [string, number, string, string][] = [
    ["Aujourd'hui", today.length, "calendar", p.tint],
    ["Programmés", upcoming.length, "clock", p.corail],
    ["Signalés", list.filter(t => t.flag && !t.done).length, "flag", p.ambre],
    ["Terminés", done.length, "check", p.faint],
  ];
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav large="Rappels" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}>
        {/* tuiles compteurs */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
          {cards.map(([label, n, ic, c]) => (
            <View key={label} style={{ width: "47.5%", backgroundColor: p.card, borderRadius: 15, padding: 11, borderWidth: 0.5, borderColor: p.sep }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c, alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                <Icon name={ic} size={13} color="#fff" sw={2.4} />
              </View>
              <Text style={{ fontSize: fs(22, p), fontWeight: "700", color: p.text }}>{n}</Text>
              <Text style={{ fontSize: fs(11.5, p), color: p.sub }}>{label}</Text>
            </View>
          ))}
        </View>
        {/* saisie rapide */}
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: p.card,
          borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 0.5, borderColor: p.sep, marginBottom: 16,
        }}>
          <Icon name="plus" size={17} color={p.tint} sw={2.4} />
          <TextInput
            value={draft} onChangeText={setDraft} onSubmitEditing={add}
            placeholder="Nouveau rappel" placeholderTextColor={p.faint}
            style={{ flex: 1, fontSize: fs(14.5, p), color: p.text, paddingVertical: 9, outlineStyle: "none", borderWidth: 0, backgroundColor: "transparent" } as object}
          />
          {draft.trim() ? (
            <Pressable onPress={add}><Text style={{ fontSize: fs(14, p), fontWeight: "600", color: p.tint }}>Ajouter</Text></Pressable>
          ) : null}
        </View>
        {today.length > 0 ? (
          <>
            <Text style={{ fontSize: fs(12.5, p), fontWeight: "700", color: p.sub, marginBottom: 7, letterSpacing: 0.3 }}>AUJOURD'HUI</Text>
            <View style={{ backgroundColor: p.card, borderRadius: 16, overflow: "hidden", borderWidth: 0.5, borderColor: p.sep, marginBottom: 16 }}>
              {today.map((t, i) => (
                <View key={t.id} style={{ borderBottomWidth: i === today.length - 1 ? 0 : 0.5, borderBottomColor: p.sep }}><TaskRow t={t} /></View>
              ))}
            </View>
          </>
        ) : null}
        {upcoming.length > 0 ? (
          <>
            <Text style={{ fontSize: fs(12.5, p), fontWeight: "700", color: p.sub, marginBottom: 7, letterSpacing: 0.3 }}>À VENIR</Text>
            <View style={{ backgroundColor: p.card, borderRadius: 16, overflow: "hidden", borderWidth: 0.5, borderColor: p.sep, marginBottom: 16 }}>
              {upcoming.map((t, i) => (
                <View key={t.id} style={{ borderBottomWidth: i === upcoming.length - 1 ? 0 : 0.5, borderBottomColor: p.sep }}><TaskRow t={t} /></View>
              ))}
            </View>
          </>
        ) : null}
        {done.length > 0 ? (
          <>
            <Text style={{ fontSize: fs(12.5, p), fontWeight: "700", color: p.sub, marginBottom: 7, letterSpacing: 0.3 }}>TERMINÉS</Text>
            <View style={{ backgroundColor: p.card, borderRadius: 16, overflow: "hidden", borderWidth: 0.5, borderColor: p.sep }}>
              {done.map((t, i) => (
                <View key={t.id} style={{ borderBottomWidth: i === done.length - 1 ? 0 : 0.5, borderBottomColor: p.sep }}><TaskRow t={t} /></View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

export function RappelsApp(): ReactNode {
  return <StackNav root={<Home />} />;
}
