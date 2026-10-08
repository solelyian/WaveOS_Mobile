// Messages.tsx — messagerie complète : liste de conversations (recherche,
// badges non-lus, heure), fil de discussion (bulles à queue, séparateurs
// horaires, indicateur de frappe, envoi réel avec réponse simulée).
// 100 % React Native : View/Text/ScrollView/Pressable/TextInput.
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, TextInput, View, type ScrollViewHandle } from "react-native";
import { Avatar, Badge, Empty, fs, Icon, Nav, useStack, useTheme } from "../rn";
import { StackNav } from "../rn";

/* ---------- données ---------- */

interface Msg { me?: boolean; text: string; time: string }
interface Convo {
  name: string; hue: number; preview: string; time: string; unread: number;
  pinned?: boolean; msgs: Msg[];
}

const CONVOS: Convo[] = [
  { name: "Camille Aubry", hue: 330, preview: "On se retrouve à 19h au studio ?", time: "19:02", unread: 2, pinned: true, msgs: [
    { text: "Salut ! Tu as vu la nouvelle maquette Sillage ?", time: "18:44" },
    { me: true, text: "Oui, les rubans rendent vraiment bien. J'ai montré la DA ce matin.", time: "18:47" },
    { text: "Elle a dit quoi ?", time: "18:49" },
    { me: true, text: "Que le verre est enfin là. Reste le pack d'icônes.", time: "18:51" },
    { text: "On se retrouve à 19h au studio ?", time: "19:02" },
    { me: true, text: "Parfait, j'y serai. J'apporte le proto.", time: "19:04" },
  ]},
  { name: "Équipe Nyne", hue: 235, preview: "La build WaveOS 0.9 est prête 🎉", time: "18:55", unread: 0, msgs: [
    { text: "CI verte sur la branche sillage", time: "17:30" },
    { me: true, text: "Top. Je passe la revue motion ce soir.", time: "17:52" },
    { text: "La build WaveOS 0.9 est prête 🎉", time: "18:55" },
  ]},
  { name: "Julien R.", hue: 20, preview: "Je t'envoie les maquettes demain", time: "17:41", unread: 0, msgs: [
    { text: "Les exports Figma sont partis", time: "16:20" },
    { me: true, text: "Reçu. Je regarde les variantes ce soir.", time: "16:33" },
    { text: "Je t'envoie les maquettes demain", time: "17:41" },
  ]},
  { name: "Maman", hue: 280, preview: "Appelle-moi quand tu peux", time: "16:20", unread: 1, msgs: [
    { text: "Coucou, tu passes dimanche ?", time: "15:58" },
    { text: "Appelle-moi quand tu peux", time: "16:20" },
  ]},
  { name: "Léa D.", hue: 160, preview: "Top, à jeudi !", time: "hier", unread: 0, msgs: [
    { me: true, text: "On confirme jeudi pour la démo ?", time: "mer." },
    { text: "Top, à jeudi !", time: "hier" },
  ]},
  { name: "Studio Rubans", hue: 200, preview: "Facture Septembre dispo", time: "hier", unread: 0, msgs: [
    { text: "Facture Septembre dispo sur votre espace", time: "hier" },
  ]},
  { name: "Antoine K.", hue: 40, preview: "Le rendu est bluffant", time: "mer.", unread: 0, msgs: [
    { me: true, text: "Regarde le dernier rendu de l'écran d'accueil", time: "mar." },
    { text: "Le rendu est bluffant", time: "mer." },
  ]},
];

const REPLIES = [
  "Bien reçu !", "On en parle à la review demain.", "Parfait 👍",
  "Je regarde ça ce soir.", "OK, noté.", "Haha, excellent.",
];

/* ---------- liste des conversations ---------- */

function ConvoRow({ c, onPress }: { c: Convo; onPress: () => void }): ReactNode {
  const p = useTheme();
  const [hov, setHov] = useState(false);
  return (
    <Pressable onPress={onPress}
      onHoverIn={() => setHov(true)} onHoverOut={() => setHov(false)}
      style={({ pressed }) => ({
        flexDirection: "row", alignItems: "center", gap: 11,
        paddingVertical: 8, paddingHorizontal: 16,
        backgroundColor: pressed || hov ? p.field : "transparent",
      })}>
      <View>
        <Avatar name={c.name} hue={c.hue} size={46} />
        {c.unread > 0 ? (
          <View style={{ position: "absolute", top: -3, right: -3 }}>
            <Badge n={c.unread} />
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <Text style={{ fontSize: fs(15.5, p), fontWeight: "600", color: p.text }} numberOfLines={1}>{c.name}</Text>
          <Text style={{ fontSize: fs(12, p), color: p.faint }}>{c.time}</Text>
        </View>
        <Text style={{ fontSize: fs(13.5, p), color: p.sub, marginTop: 1 }} numberOfLines={2}>{c.preview}</Text>
      </View>
      <Icon name="chevron-right" size={15} color={p.faint} sw={2.4} />
    </Pressable>
  );
}

function ConvoList(): ReactNode {
  const p = useTheme();
  const { push } = useStack();
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return CONVOS.filter(c => !t || c.name.toLowerCase().includes(t) || c.preview.toLowerCase().includes(t));
  }, [q]);
  const pinned = list.filter(c => c.pinned);
  const rest = list.filter(c => !c.pinned);
  return (
    <View style={{ flex: 1 }}>
      <Nav large="Messages" right={<Icon name="pencil-line" size={20} color={p.tint} sw={1.9} />} />
      <View style={{ paddingVertical: 4 }}>
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 7, marginHorizontal: 16,
          marginBottom: 10, paddingHorizontal: 10, height: 36, borderRadius: 11,
          backgroundColor: p.field,
        }}>
          <Icon name="search" size={15} color={p.faint} sw={2.4} />
          <TextInput value={q} onChangeText={setQ} placeholder="Rechercher"
            placeholderTextColor={p.faint}
            style={{ flex: 1, fontSize: fs(15, p), color: p.text, outlineStyle: "none" } as object} />
          {q ? <Pressable onPress={() => setQ("")}><Icon name="x" size={13} color={p.faint} sw={3} /></Pressable> : null}
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {pinned.length ? (
          <View style={{ flexDirection: "row", gap: 18, paddingHorizontal: 20, paddingBottom: 10 }}>
            {pinned.map(c => (
              <Pressable key={c.name} onPress={() => push(<Thread convo={c} />)} style={{ alignItems: "center", width: 66 }}>
                <Avatar name={c.name} hue={c.hue} size={52} />
                <Text style={{ fontSize: fs(10.5, p), color: p.sub, marginTop: 4 }} numberOfLines={1}>{c.name.split(" ")[0]}</Text>
                {c.unread ? <View style={{ position: "absolute", top: -2, right: 4 }}><Badge n={c.unread} /></View> : null}
              </Pressable>
            ))}
          </View>
        ) : null}
        {rest.length === 0 && pinned.length === 0
          ? <Empty icon="message-square" title="Aucune conversation" sub="Aucun résultat pour cette recherche." />
          : rest.map(c => <ConvoRow key={c.name} c={c} onPress={() => push(<Thread convo={c} />)} />)}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

/* ---------- fil de discussion ---------- */

function Bubble({ m }: { m: Msg }): ReactNode {
  const p = useTheme();
  const mine = !!m.me;
  return (
    <View style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "78%", marginVertical: 1.5 }}>
      <View style={{
        paddingVertical: 9, paddingHorizontal: 13, borderRadius: 19,
        borderBottomRightRadius: mine ? 4 : 19,
        borderBottomLeftRadius: mine ? 19 : 4,
        backgroundColor: mine ? p.tint : p.bubbleIn,
      }}>
        <Text style={{ fontSize: fs(15, p), lineHeight: fs(20, p), color: mine ? "#fff" : p.text }}>{m.text}</Text>
      </View>
    </View>
  );
}

function Thread({ convo }: { convo: Convo }): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  const [msgs, setMsgs] = useState<Msg[]>(convo.msgs);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const sc = useRef<ScrollViewHandle>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const now = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const send = () => {
    const t = draft.trim();
    if (!t) return;
    setDraft("");
    setMsgs(m => [...m, { me: true, text: t, time: now() }]);
    timers.current.push(window.setTimeout(() => setTyping(true), 700));
    timers.current.push(window.setTimeout(() => {
      setTyping(false);
      setMsgs(m => [...m, { text: REPLIES[Math.floor(Math.random() * REPLIES.length)], time: now() }]);
    }, 1900));
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav
        onBack={pop} back="Messages"
        left={<Avatar name={convo.name} hue={convo.hue} size={32} />}
        title={convo.name}
        right={<Icon name="video" size={20} color={p.tint} sw={1.9} />}
      />
      <ScrollView ref={sc} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => sc.current?.scrollToEnd({ animated: false })}>
        <Text style={{ textAlign: "center", fontSize: fs(11, p), color: p.faint, marginBottom: 10 }}>
          {convo.name} · aujourd'hui
        </Text>
        {msgs.map((m, i) => {
          const prev = msgs[i - 1];
          const gap = prev && (prev.me !== undefined) === (m.me !== undefined) ? 0 : 8;
          return (
            <View key={i} style={{ marginTop: i === 0 ? 0 : gap || 2 }}>
              {(i === 0 || msgs[i - 1].time !== m.time) && (
                <Text style={{ textAlign: "center", fontSize: fs(10.5, p), color: p.faint, marginVertical: 8 }}>{m.time}</Text>
              )}
              <Bubble m={m} />
            </View>
          );
        })}
        {typing && (
          <View style={{ alignSelf: "flex-start", marginTop: 8 }}>
            <View style={{ flexDirection: "row", gap: 4, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 19, borderBottomLeftRadius: 4, backgroundColor: p.bubbleIn }}>
              {[0, 1, 2].map(i => (
                <View key={i} style={{
                  width: 7, height: 7, borderRadius: 3.5, backgroundColor: p.faint,
                  animation: `msg-dot 1.2s ${i * 0.18}s infinite`,
                }} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
      <View style={{
        flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12,
        paddingTop: 8, paddingBottom: 22, borderTopWidth: 0.5, borderTopColor: p.sep,
        backgroundColor: p.bg,
      }}>
        <Pressable style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: p.field, alignItems: "center", justifyContent: "center" }}>
          <Icon name="plus" size={18} color={p.sub} sw={2.2} />
        </Pressable>
        <View style={{
          flex: 1, minHeight: 36, maxHeight: 100, borderRadius: 18, paddingHorizontal: 13,
          justifyContent: "center", backgroundColor: p.field,
        }}>
          <TextInput value={draft} onChangeText={setDraft} placeholder="Message…"
            placeholderTextColor={p.faint} multiline
            onSubmitEditing={send}
            style={{ fontSize: fs(15, p), color: p.text, outlineStyle: "none", paddingVertical: 8 } as object} />
        </View>
        <Pressable onPress={send} disabled={!draft.trim()} style={{
          width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center",
          backgroundColor: draft.trim() ? p.tint : p.field,
        }}>
          <Icon name="chevron-up" size={18} color={draft.trim() ? "#fff" : p.faint} sw={2.6} />
        </Pressable>
      </View>
    </View>
  );
}

export function MessagesApp(): ReactNode {
  const p = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <StackNav root={<ConvoList />} />
    </View>
  );
}
