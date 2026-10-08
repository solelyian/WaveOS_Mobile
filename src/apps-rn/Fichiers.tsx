// Fichiers.tsx — explorateur réel : dossiers navigables sur la pile
// (documents, images, téléchargements…), fichiers typés (icône + taille +
// date), aperçu image/document plein écran, mode grille/liste.
import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { fs, Icon, Nav, StackNav, useStack, useTheme } from "../rn";

interface Fs { name: string; kind: "dir" | "img" | "pdf" | "doc" | "audio" | "zip"; size?: string; date: string; children?: Fs[] }

const TREE: Fs[] = [
  { name: "Documents", kind: "dir", date: "12 oct.", children: [
    { name: "Brief Sillage.pages", kind: "doc", size: "1,8 Mo", date: "12 oct." },
    { name: "Budget Q4.numbers", kind: "doc", size: "640 Ko", date: "10 oct." },
    { name: "Contrat Nyne.pdf", kind: "pdf", size: "2,1 Mo", date: "9 oct." },
    { name: "Notes prototypage.txt", kind: "doc", size: "12 Ko", date: "5 oct." },
  ] },
  { name: "Images", kind: "dir", date: "11 oct.", children: [
    { name: "Planche icons.png", kind: "img", size: "4,7 Mo", date: "11 oct." },
    { name: "Maquette lock.png", kind: "img", size: "2,9 Mo", date: "10 oct." },
    { name: "Capture CC.png", kind: "img", size: "1,1 Mo", date: "8 oct." },
  ] },
  { name: "Musique", kind: "dir", date: "7 oct.", children: [
    { name: "Rubans — master.wav", kind: "audio", size: "48 Mo", date: "7 oct." },
    { name: "Écume — stem.mp3", kind: "audio", size: "9,2 Mo", date: "3 oct." },
  ] },
  { name: "Archives", kind: "dir", date: "2 oct.", children: [
    { name: "protos-egui.zip", kind: "zip", size: "212 Mo", date: "2 oct." },
  ] },
  { name: "mentions-legales.pdf", kind: "pdf", size: "88 Ko", date: "1 oct." },
];

const KIND_ICON: Record<Fs["kind"], [string, string]> = {
  dir: ["folder", "#7DA2FF"], img: ["image", "#2FCC92"], pdf: ["file-text", "#FF6B57"],
  doc: ["file-text", "#7DA2FF"], audio: ["music", "#F0A02E"], zip: ["archive", "#8E8E96"],
};

function Dir({ items, path }: { items: Fs[]; path: string }): ReactNode {
  const p = useTheme();
  const { push, pop, depth } = useStack();
  const [grid, setGrid] = useState(false);
  const crumbs = path.split("/");
  const crumb = crumbs.length > 1 ? crumbs[crumbs.length - 1] : "Fichiers";
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav title={depth === 1 ? undefined : crumb} large={depth === 1 ? "Fichiers" : undefined} onBack={depth > 1 ? () => pop() : undefined}
        back="Retour"
        right={<Pressable onPress={() => setGrid(g => !g)}><Icon name={grid ? "list" : "layout-grid"} size={18} color={p.tint} sw={2} /></Pressable>} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        {grid ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {items.map(f => {
              const [ic, c] = KIND_ICON[f.kind];
              return (
                <Pressable key={f.name} onPress={() => f.kind === "dir" ? push(<Dir items={f.children ?? []} path={`${path}/${f.name}`} />) : push(<Preview f={f} />)}
                  style={({ pressed }) => ({ width: "30.5%", alignItems: "center", gap: 7, opacity: pressed ? 0.6 : 1 })}>
                  <View style={{ width: 62, height: 62, borderRadius: 16, backgroundColor: p.card, borderWidth: 0.5, borderColor: p.sep, alignItems: "center", justifyContent: "center" }}>
                    <Icon name={ic} size={26} color={c} sw={1.8} />
                  </View>
                  <Text style={{ fontSize: fs(11, p), color: p.text, textAlign: "center" }} numberOfLines={2}>{f.name}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={{ backgroundColor: p.card, borderRadius: 18, overflow: "hidden", borderWidth: 0.5, borderColor: p.sep }}>
            {items.map((f, i) => {
              const [ic, c] = KIND_ICON[f.kind];
              return (
                <Pressable key={f.name} onPress={() => f.kind === "dir" ? push(<Dir items={f.children ?? []} path={`${path}/${f.name}`} />) : push(<Preview f={f} />)}
                  style={({ pressed }) => ({
                    flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 14, paddingVertical: 10,
                    borderBottomWidth: i === items.length - 1 ? 0 : 0.5, borderBottomColor: p.sep,
                    backgroundColor: pressed ? p.card2 : "transparent",
                  })}>
                  <Icon name={ic} size={26} color={c} sw={1.7} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fs(15, p), color: p.text }} numberOfLines={1}>{f.name}</Text>
                    <Text style={{ fontSize: fs(11.5, p), color: p.faint, marginTop: 1 }}>
                      {f.kind === "dir" ? `${f.children?.length ?? 0} éléments` : f.size} · {f.date}
                    </Text>
                  </View>
                  {f.kind === "dir" ? <Icon name="chevron-right" size={15} color={p.faint} sw={2.4} /> : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Preview({ f }: { f: Fs }): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  const [ic, c] = KIND_ICON[f.kind];
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav title={f.name} onBack={pop} back="Retour" right={<Icon name="share-2" size={18} color={p.tint} sw={2.2} />} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 60 }}>
        <View style={{ width: 110, height: 110, borderRadius: 28, backgroundColor: p.card, borderWidth: 0.5, borderColor: p.sep, alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <Icon name={ic} size={48} color={c} sw={1.6} />
        </View>
        <Text style={{ fontSize: fs(17, p), fontWeight: "600", color: p.text }}>{f.name}</Text>
        <Text style={{ fontSize: fs(13, p), color: p.sub, marginTop: 4 }}>{f.size} · {f.date}</Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
          {[["Ouvrir", "book-open"], ["Partager", "share-2"], ["Dupliquer", "plus"]].map(([l, icn]) => (
            <Pressable key={l} style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 9, paddingHorizontal: 16,
              borderRadius: 18, backgroundColor: p.card, borderWidth: 0.5, borderColor: p.sep, opacity: pressed ? 0.65 : 1,
            })}>
              <Icon name={icn} size={14} color={p.tint} sw={2.2} />
              <Text style={{ fontSize: fs(13, p), fontWeight: "600", color: p.tint }}>{l}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function Root(): ReactNode {
  return <Dir items={TREE} path="Fichiers" />;
}

export function FichiersApp(): ReactNode {
  return <StackNav root={<Root />} />;
}
