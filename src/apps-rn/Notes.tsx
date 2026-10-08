// Notes.tsx — bloc-notes complet : dossiers filtrants en bas, liste
// recherchée (titre = première ligne, aperçu, date, épinglés en tête),
// éditeur réel (TextInput multiline, compteur de mots), nouvelle note,
// épinglage, suppression. L'état vit dans un store externe : les écrans
// de la pile se réabonnent et la liste reflète chaque édition.
import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { createStore, Empty, fs, Icon, Nav, Search, StackNav, useStack, useStore, useTheme } from "../rn";

export interface Note { id: number; text: string; date: string; pinned?: boolean; folder: string }

let nextId = 100;
const FOLDERS = [
  { name: "Toutes", ic: "folder" },
  { name: "Idées", ic: "sparkles" },
  { name: "Travail", ic: "list-todo" },
  { name: "Personnel", ic: "user-round" },
];

const notes = createStore<Note[]>([
  { id: 1, folder: "Idées", pinned: true, date: "12 oct.", text: "WaveOS — direction « Sillage »\nL'eau comme comportement, jamais décor.\nRibbons −16°, verre liquide, ressorts à vélocité héritée." },
  { id: 2, folder: "Travail", date: "10 oct.", text: "Revue motion — checklist\n• Springs : tension résiduelle OK\n• Cascade d'ouverture à re-tuner\n• Edge stretch : 340ms pas 280" },
  { id: 3, folder: "Personnel", date: "8 oct.", text: "Courses\nŒufs, café, basilic, papier photo, piles AA" },
  { id: 4, folder: "Travail", date: "5 oct.", text: "Icônes glossy\nVerre translucide + pictogramme dimensionnel. La planche pastel est validée." },
  { id: 5, folder: "Idées", date: "1 oct.", text: "Et si le badge de notif dérivait comme l'écume ?" },
  { id: 6, folder: "Personnel", date: "28 sept.", text: "Resto samedi — réserver 20h pour 4. Table près du hublot." },
]);
const folderOf = createStore("Toutes");

const titleOf = (t: string) => t.split("\n")[0] || "Nouvelle note";
const bodyOf = (t: string) => t.split("\n").slice(1).join(" ").slice(0, 90);
const today = () => new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

function saveNote(id: number, folder: string, text: string): void {
  notes.set(ns => {
    const i = ns.findIndex(n => n.id === id);
    if (i >= 0) { const cp = ns.slice(); cp[i] = { ...cp[i], text, date: today() }; return cp; }
    nextId++;
    return [{ id, text, date: today(), folder: folder === "Toutes" ? "Idées" : folder }, ...ns];
  });
}

function Editor({ note }: { note: Note }): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  const [text, setText] = useState(note.text);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const flush = () => { if (text.trim() || note.text) saveNote(note.id, note.folder, text); };
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav
        onBack={() => { flush(); pop(); }} back="Notes"
        right={<View style={{ flexDirection: "row", gap: 18, alignItems: "center" }}>
          <Pressable onPress={() => notes.set(ns => ns.map(n => n.id === note.id ? { ...n, pinned: !n.pinned } : n))}>
            <Icon name="bookmark" size={18} color={note.pinned ? p.ambre : p.sub} sw={2} />
          </Pressable>
          <Pressable onPress={() => { notes.set(ns => ns.filter(n => n.id !== note.id)); pop(); }}>
            <Icon name="trash-2" size={19} color={p.corail} sw={2} />
          </Pressable>
          <Pressable onPress={() => { flush(); pop(); }}><Icon name="check" size={19} color={p.tint} sw={2.6} /></Pressable>
        </View>}
      />
      <View style={{ flex: 1, paddingHorizontal: 22 }}>
        <TextInput
          value={text} onChangeText={setText} multiline autoFocus={!note.text}
          placeholder="Nouvelle note" placeholderTextColor={p.faint}
          style={{ flex: 1, fontSize: fs(16, p), color: p.text, lineHeight: 24, outlineStyle: "none", textAlignVertical: "top", fontFamily: "inherit" } as object}
        />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 22, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: p.sep }}>
        <Text style={{ fontSize: fs(12, p), color: p.faint }}>{note.date}</Text>
        <Text style={{ fontSize: fs(12, p), color: p.faint }}>{words} mot{words > 1 ? "s" : ""}</Text>
      </View>
    </View>
  );
}

function RowN({ n, last }: { n: Note; last: boolean }): ReactNode {
  const p = useTheme();
  const { push } = useStack();
  return (
    <Pressable onPress={() => push(<Editor note={n} />)}
      style={({ pressed }) => ({
        paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8,
        borderBottomWidth: last ? 0 : 0.5, borderBottomColor: p.sep,
        backgroundColor: pressed ? p.card2 : "transparent",
      })}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: fs(15, p), fontWeight: "600", color: p.text }} numberOfLines={1}>{titleOf(n.text)}</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
          <Text style={{ fontSize: fs(12.5, p), color: p.sub }}>{n.date}</Text>
          <Text style={{ flex: 1, fontSize: fs(12.5, p), color: p.faint }} numberOfLines={1}>{bodyOf(n.text)}</Text>
        </View>
      </View>
      {n.pinned ? <Icon name="bookmark" size={13} color={p.ambre} sw={2.6} /> : null}
    </Pressable>
  );
}

export function NotesApp(): ReactNode {
  return <StackNav root={<Home />} />;
}

function Home(): ReactNode {
  const p = useTheme();
  const all = useStore(notes);
  const folder = useStore(folderOf);
  const [q, setQ] = useState("");
  const { push } = useStack();
  const visible = (folder === "Toutes" ? all : all.filter(n => n.folder === folder))
    .filter(n => !q || n.text.toLowerCase().includes(q.toLowerCase()));
  const pinned = visible.filter(n => n.pinned);
  const rest = visible.filter(n => !n.pinned);
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav large="Notes" right={
        <Pressable onPress={() => push(<Editor note={{ id: nextId, text: "", date: today(), folder: folder === "Toutes" ? "Idées" : folder }} />)}>
          <Icon name="pencil-line" size={19} color={p.tint} sw={2.2} />
        </Pressable>
      } />
      <Search value={q} onChange={setQ} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}>
        {visible.length === 0 ? <Empty icon="notebook-text" title="Aucune note" sub={q ? "Aucun résultat." : "Touchez le crayon pour écrire."} /> : null}
        {pinned.length > 0 && (
          <View style={{ backgroundColor: p.card, borderRadius: 18, overflow: "hidden", borderWidth: 0.5, borderColor: p.sep, marginBottom: 14 }}>
            {pinned.map((n, i) => <RowN key={n.id} n={n} last={i === pinned.length - 1} />)}
          </View>
        )}
        {rest.length > 0 && (
          <View style={{ backgroundColor: p.card, borderRadius: 18, overflow: "hidden", borderWidth: 0.5, borderColor: p.sep }}>
            {rest.map((n, i) => <RowN key={n.id} n={n} last={i === rest.length - 1} />)}
          </View>
        )}
      </ScrollView>
      <View style={{
        flexDirection: "row", borderTopWidth: 0.5, borderTopColor: p.sep,
        paddingTop: 10, paddingBottom: 26, justifyContent: "space-around",
        position: "absolute", bottom: 0, left: 0, right: 0,
        backgroundColor: p.dark ? "rgba(11,15,34,.88)" : "rgba(239,236,230,.88)",
        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      }}>
        {FOLDERS.map(f => (
          <Pressable key={f.name} onPress={() => folderOf.set(() => f.name)} style={{ alignItems: "center", gap: 3 }}>
            <Icon name={f.ic} size={18} color={folder === f.name ? p.tint : p.faint} sw={2} />
            <Text style={{ fontSize: fs(10, p), fontWeight: folder === f.name ? "600" : "400", color: folder === f.name ? p.tint : p.faint }}>{f.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
