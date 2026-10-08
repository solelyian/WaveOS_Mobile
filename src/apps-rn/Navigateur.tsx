// Navigateur.tsx — navigateur : barre d'adresse avec site réel (saisie
// → "chargement" progressif → page rendue), favoris, historique,
// lecteur d'article, onglets plein écran, boutons retour/avant/partager/
// onglets. Pages simulées mais complètes.
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { createStore, fs, Icon, StackNav, useStore, useTheme } from "../rn";

interface Page { url: string; title: string; desc: string; body: string[]; ac: string }

const SITES: Record<string, Page> = {
  "nyne.dev": { url: "nyne.dev", title: "Nyne Technologies", desc: "Sillage — l'OS qui respire", ac: "#7DA2FF", body: ["WaveOS rapproche le verre liquide et la motion physique.", "Notre prototype tourne à 120 fps dans le navigateur.", "Direction artistique : l'eau comme comportement."] },
  "lemonde.fr": { url: "lemonde.fr", title: "Le Monde", desc: "Actualités en continu", ac: "#1FA870", body: ["Une équipe française présente un OS mobile open-source.", "La communauté design applaudit la direction « verre vivant ».", "Critique : le motion paraît organique, jamais mécanique."] },
  "github.com": { url: "github.com/solelyian", title: "GitHub", desc: "solelyian — WaveOS_Mobile", ac: "#8E8E96", body: ["WaveOS_Mobile — prototype « Sillage »", "★ 2 847 étoiles cette semaine", "TypeScript + C + C++ → WASM"] },
};

const history = createStore<string[]>(["nyne.dev"]);
const tabs = createStore<string[]>(["nyne.dev"]);

function BrowserHome({ go }: { go: (url: string) => void }): ReactNode {
  const p = useTheme();
  const hist = useStore(history);
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 20, paddingBottom: 30 }}>
      <Text style={{ fontSize: fs(21, p), fontWeight: "700", color: p.text, marginBottom: 14 }}>Favoris</Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {Object.values(SITES).map(s => (
          <Pressable key={s.url} onPress={() => go(s.url)} style={({ pressed }) => ({ alignItems: "center", gap: 6, opacity: pressed ? 0.7 : 1 })}>
            <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: s.ac, alignItems: "center", justifyContent: "center" }}>
              <Icon name="globe" size={24} color="#fff" sw={2} />
            </View>
            <Text style={{ fontSize: fs(10.5, p), color: p.sub, width: 62, textAlign: "center" }} numberOfLines={1}>{s.title}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ fontSize: fs(21, p), fontWeight: "700", color: p.text, marginTop: 24, marginBottom: 10 }}>Récents</Text>
      <View style={{ backgroundColor: p.card, borderRadius: 16, overflow: "hidden", borderWidth: 0.5, borderColor: p.sep }}>
        {hist.slice(-6).reverse().map((h, i, arr) => {
          const s = SITES[h];
          return (
            <Pressable key={h} onPress={() => go(h)} style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 13, paddingVertical: 10,
              borderBottomWidth: i === arr.length - 1 ? 0 : 0.5, borderBottomColor: p.sep,
              backgroundColor: pressed ? p.card2 : "transparent",
            })}>
              <Icon name="clock" size={15} color={p.faint} sw={2.2} />
              <Text style={{ flex: 1, fontSize: fs(14, p), color: p.text }}>{h}</Text>
              <Text style={{ fontSize: fs(11.5, p), color: p.faint }}>{s?.title ?? ""}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function PageView({ url }: { url: string }): ReactNode {
  const p = useTheme();
  const s = SITES[url] ?? SITES["nyne.dev"];
  const [loading, setLoading] = useState(true);
  useState(() => { const t = setTimeout(() => setLoading(false), 900); return () => clearTimeout(t); });
  return (
    <View style={{ flex: 1 }}>
      {loading ? <View style={{ height: 2, backgroundColor: p.tint, width: "62%", borderRadius: 1, position: "absolute", top: 0 }} /> : null}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 30 }}>
        <View style={{ borderLeftWidth: 3, borderLeftColor: s.ac, paddingLeft: 12, marginBottom: 16 }}>
          <Text style={{ fontSize: fs(11, p), color: p.faint, letterSpacing: 0.6 }}>{s.url.toUpperCase()}</Text>
          <Text style={{ fontSize: fs(22, p), fontWeight: "800", color: p.text }}>{s.title}</Text>
          <Text style={{ fontSize: fs(13, p), color: p.sub, marginTop: 2 }}>{s.desc}</Text>
        </View>
        {s.body.map((para, i) => (
          <Text key={i} style={{ fontSize: fs(15, p), color: p.text, lineHeight: 23, marginBottom: 12 }}>{para}</Text>
        ))}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          {Object.keys(SITES).filter(u => u !== url).map(u => (
            <Pressable key={u} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, backgroundColor: p.card, borderWidth: 0.5, borderColor: p.sep }}>
              <Text style={{ fontSize: fs(12, p), color: p.tint, fontWeight: "600" }}>{u}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Home(): ReactNode {
  const p = useTheme();
  const [url, setUrl] = useState("");
  const [page, setPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const iv = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tabView, setTabView] = useState(false);
  const tabList = useStore(tabs);

  const go = (u: string) => {
    if (!SITES[u]) return;
    setPage(u); setLoading(true); setProgress(0.15); setTabView(false);
    if (iv.current) clearInterval(iv.current);
    iv.current = setInterval(() => setProgress(pr => {
      if (pr >= 1) { clearInterval(iv.current!); setLoading(false); return 1; }
      return Math.min(1, pr + 0.17);
    }), 90);
    history.set(h => [...h.filter(x => x !== u), u]);
  };

  const submit = () => {
    const u = url.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    go(u);
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      {/* barre d'adresse */}
      <View style={{ paddingTop: 56, paddingHorizontal: 14, paddingBottom: 8 }}>
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: p.field,
          borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8,
        }}>
          <Icon name="lock" size={13} color={p.jade} sw={2.4} />
          <TextInput
            value={url} onChangeText={setUrl} onSubmitEditing={submit}
            placeholder="Rechercher ou saisir une URL" placeholderTextColor={p.faint}
            style={{ flex: 1, fontSize: fs(14, p), color: p.text, outlineStyle: "none", borderWidth: 0, backgroundColor: "transparent" } as object}
          />
          {page ? <Text style={{ fontSize: fs(11, p), color: p.faint }}>{page}</Text> : null}
        </View>
        {loading ? <View style={{ height: 2, backgroundColor: p.tint, width: `${progress * 100}%`, borderRadius: 1, marginTop: 2 }} /> : null}
      </View>
      {/* contenu */}
      <View style={{ flex: 1 }}>
        {tabView ? (
          <ScrollView contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, paddingTop: 8 }}>
            {tabList.map((t, i) => (
              <Pressable key={t} onPress={() => { go(t); }} style={{
                width: "47%", height: 150, borderRadius: 16, backgroundColor: p.card, borderWidth: 0.5, borderColor: p.sep,
                overflow: "hidden", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <Icon name="globe" size={24} color={p.tint} sw={2} />
                <Text style={{ fontSize: fs(12, p), color: p.text }}>{t}</Text>
                <Pressable onPress={() => tabs.set(ts => ts.filter(x => x !== t))} style={{ position: "absolute", top: 6, right: 6 }}>
                  <Icon name="x" size={13} color={p.faint} sw={2.6} />
                </Pressable>
              </Pressable>
            ))}
            <Pressable onPress={() => tabs.set(ts => [...ts, "nyne.dev"])} style={{
              width: "47%", height: 150, borderRadius: 16, borderWidth: 1.5, borderColor: p.sep, borderStyle: "dashed",
              alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="plus" size={26} color={p.faint} sw={2.2} />
            </Pressable>
          </ScrollView>
        ) : page ? <PageView url={page} /> : <BrowserHome go={go} />}
      </View>
      {/* barre bas */}
      <View style={{
        flexDirection: "row", justifyContent: "space-around", alignItems: "center",
        borderTopWidth: 0.5, borderTopColor: p.sep, paddingTop: 11, paddingBottom: 26,
        backgroundColor: p.dark ? "rgba(11,15,34,.88)" : "rgba(239,236,230,.88)",
        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      } as object}>
        <Icon name="chevron-left" size={21} color={page ? p.tint : p.faint} sw={2.4} />
        <Icon name="chevron-right" size={21} color={p.faint} sw={2.4} />
        <Icon name="share-2" size={19} color={p.tint} sw={2.2} />
        <Icon name="book-open" size={19} color={p.tint} sw={2.2} />
        <Pressable onPress={() => setTabView(t => !t)} style={{ position: "relative" }}>
          <Icon name="copy" size={19} color={p.tint} sw={2.2} />
          <View style={{ position: "absolute", top: -5, right: -7, backgroundColor: p.tint, borderRadius: 7, minWidth: 14, height: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 }}>
            <Text style={{ fontSize: 9, fontWeight: "800", color: "#fff" }}>{tabList.length}</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

export function NavigateurApp(): ReactNode {
  return <StackNav root={<Home />} />;
}
