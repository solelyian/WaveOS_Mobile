// MessagesApp.tsx — conversations vivantes : fils avec envoi, indicateur de
// frappe + réponse simulée, envoi de photos, nouveau message, appels, réglages.
import React from "react";
import { View, Text, Pressable, Image, ScrollView, TextInput, StyleSheet } from "react-native";
import { Icon } from "../Icon";
import { toast } from "../host";
import { GlassHeader, FloatingTabBar, GBtn, PageBlank, IOSSwitch } from "./ui";

interface Msg { me?: boolean; text?: string; im?: string }
interface Convo { name: string; avatar: string; time: string; unread?: number; msgs: Msg[] }

const CONVOS: Convo[] = [
  { name: "Alex Morgan", avatar: "/img/avatar/a-2.jpg", time: "9:41 AM", unread: 2, msgs: [
    { text: "Did you see the new build?" }, { text: "The animations are insane 🤯" },
    { me: true, text: "Just tested it — the morph is perfect" }, { im: "/img/photos/ph-4.jpg", text: "Look at this" }] },
  { name: "Jordan Lee", avatar: "/img/avatar/a-5.jpg", time: "8:15 AM", msgs: [
    { text: "Lunch at the usual place?" }, { me: true, text: "12:30 works" }, { text: "Perfect, see you there" }] },
  { name: "Sam Rivera", avatar: "/img/avatar/a-8.jpg", time: "Yesterday", msgs: [
    { me: true, text: "Can you review my PR?" }, { text: "On it — looks clean, one comment" }, { text: "Ship it 🚢" }] },
  { name: "Mom", avatar: "/img/avatar/a-12.jpg", time: "Yesterday", msgs: [
    { text: "Call me when you can ❤️" }, { me: true, text: "Will do tonight!" }] },
  { name: "Design Team", avatar: "/img/avatar/a-16.jpg", time: "Thursday", msgs: [
    { text: "New mockups are in Figma" }, { text: "The glass theme got approved" }, { me: true, text: "Nice, porting it now" }] },
  { name: "Chris Park", avatar: "/img/avatar/a-21.jpg", time: "Tuesday", msgs: [
    { text: "Game night Friday?" }, { me: true, text: "I'm in. Bringing Mario Kart" }] },
];
const MORE: [string, string][] = [
  ["Taylor Kim", "/img/avatar/a-24.jpg"], ["Casey Kim", "/img/avatar/a-18.jpg"], ["Robin Park", "/img/avatar/a-26.jpg"],
];
const REPLIES = ["Sounds good!", "Haha nice", "On my way", "Let me check and get back to you", "👍", "Perfect — thanks!"];
const CALLS: [string, string, string][] = [
  ["Alex Morgan", "phoneOutgoing", "Today, 9:10 AM"], ["Mom", "phoneIncoming", "Yesterday"],
  ["Jordan Lee", "phoneMissed", "Yesterday"], ["Sam Rivera", "phoneOutgoing", "Monday"],
];
const PHOTOS = [3, 4, 7, 9, 11, 15, 18, 22, 26];

type Pane =
  | { kind: "thread"; convo: Convo }
  | { kind: "contact"; name: string; avatar: string }
  | { kind: "photos"; convo: Convo }
  | { kind: "new" };

export function MessagesApp() {
  const [tab, setTab] = React.useState("chats");
  const [q, setQ] = React.useState("");
  const [panes, setPanes] = React.useState<Pane[]>([]);
  const [, bump] = React.useReducer((x: number) => x + 1, 0);
  const push = (p: Pane) => setPanes((v) => [...v, p]);
  const pop = () => setPanes((v) => v.slice(0, -1));
  const clearPanes = () => setPanes([]);

  const convoFor = (name: string, avatar: string) => {
    let c = CONVOS.find((x) => x.name === name);
    if (!c) { c = { name, avatar, time: "now", msgs: [] }; CONVOS.unshift(c); }
    return c;
  };
  const openConvo = (c: Convo) => { c.unread = 0; bump(); push({ kind: "thread", convo: c }); };
  const contact = (name: string, avatar: string) => push({ kind: "contact", name, avatar });

  const convoRow = (c: Convo) => (
    <Pressable key={c.name} style={ms.lrow} onPress={() => openConvo(c)}>
      <Image source={{ uri: c.avatar }} style={ms.av} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={ms.t1} numberOfLines={1}>{c.name}</Text>
        <Text style={ms.t2} numberOfLines={1}>
          {c.msgs.length ? (c.msgs[c.msgs.length - 1].text ?? "📷 Photo") : "New conversation"}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={ms.rt}>{c.time}</Text>
        {c.unread ? <View style={ms.badge}><Text style={ms.badgeTxt}>{c.unread}</Text></View> : null}
      </View>
    </Pressable>
  );

  return (
    <View style={ms.root}>
      <GlassHeader title="Messages" large action="pencil" onAction={() => push({ kind: "new" })} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }} nativeID="app-scroll">
        {tab === "chats" && <>
          <View style={ms.search}>
            <Icon n="search" size={15} color="#9ca3af" />
            <TextInput style={ms.searchIn} value={q} onChangeText={setQ} placeholder="Search" placeholderTextColor="#9ca3af" />
          </View>
          <View style={ms.card}>
            {CONVOS.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())).map(convoRow)}
          </View>
        </>}
        {tab === "calls" && (
          <View style={ms.card}>
            {CALLS.map(([n, ic, t]) => {
              const c = CONVOS.find((x) => x.name === n);
              const missed = ic === "phoneMissed";
              return (
                <Pressable key={n + t} style={ms.lrow} onPress={() => c && contact(n, c.avatar)}>
                  <View style={[ms.ic, { backgroundColor: missed ? "#ef4444" : "#22c55e" }]}>
                    <Icon n={ic} size={17} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[ms.t1, missed && { color: "#ef4444" }]}>{n}</Text>
                    <Text style={ms.t2}>{t}</Text>
                  </View>
                  <Pressable onPress={() => c && contact(n, c.avatar)}>
                    <Icon n="info" size={20} color="#2563eb" />
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        )}
        {tab === "people" && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, padding: 4 }}>
            {CONVOS.map((c) => (
              <Pressable key={c.name} style={{ alignItems: "center", gap: 6, width: "30%" }} onPress={() => contact(c.name, c.avatar)}>
                <Image source={{ uri: c.avatar }} style={{ width: 72, height: 72, borderRadius: 24 }} />
                <Text style={{ fontSize: 12, fontWeight: "600" }}>{c.name.split(" ")[0]}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {tab === "settings" && (
          <View style={ms.card}>
            {["Notifications", "Message previews", "Send read receipts", "Filter unknown senders"].map((l, i) => (
              <View key={l} style={[ms.lrow, { justifyContent: "space-between" }]}>
                <Text style={{ fontWeight: "600", fontSize: 15 }}>{l}</Text>
                <IOSSwitch on={i < 2} onFlip={() => {}} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <FloatingTabBar active={tab} onTab={setTab} tabs={[
        { id: "chats", icon: "messageCircle", label: "Chats" },
        { id: "calls", icon: "phone", label: "Calls" },
        { id: "people", icon: "users", label: "People" },
        { id: "settings", icon: "settings", label: "Settings" },
      ]} />
      <Pressable style={ms.fab} onPress={() => push({ kind: "new" })}>
        <Icon n="pencil" size={22} color="#fff" />
      </Pressable>

      {panes.map((p, i) => (
        <PageBlank key={i} onClose={pop}>
          {p.kind === "thread" && <Thread c={p.convo} onBack={pop} onContact={contact} onPhotos={() => push({ kind: "photos", convo: p.convo })} bump={bump} />}
          {p.kind === "contact" && <Contact name={p.name} avatar={p.avatar} onBack={pop} onMessage={() => { clearPanes(); openConvo(convoFor(p.name, p.avatar)); }} />}
          {p.kind === "photos" && <PhotoPicker onBack={pop} onPick={(src) => { p.convo.msgs.push({ me: true, im: src }); pop(); bump(); }} />}
          {p.kind === "new" && <NewMessage all={[...CONVOS.map((c) => [c.name, c.avatar] as [string, string]), ...MORE]}
            onBack={pop} onPick={(n, a) => { clearPanes(); openConvo(convoFor(n, a)); }} />}
        </PageBlank>
      ))}
    </View>
  );
}

/* ---------------- fil de discussion ---------------- */
function Thread({ c, onBack, onContact, onPhotos, bump }: {
  c: Convo; onBack: () => void; onContact: (n: string, a: string) => void;
  onPhotos: () => void; bump: () => void;
}) {
  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const list = React.useRef<ScrollView>(null);
  const scrollEnd = () => setTimeout(() => (list.current as unknown as { scrollToEnd?: (o?: object) => void })?.scrollToEnd?.({ animated: true }), 60);

  const send = () => {
    const t = draft.trim(); if (!t) return;
    c.msgs.push({ me: true, text: t });
    setDraft(""); bump(); scrollEnd();
    setTyping(true); scrollEnd();
    setTimeout(() => {
      setTyping(false);
      c.msgs.push({ text: REPLIES[Math.floor(Math.random() * REPLIES.length)] });
      bump(); scrollEnd();
    }, 1100 + Math.random() * 800);
  };
  React.useEffect(() => { scrollEnd(); }, []);

  return (
    <View style={ms.page}>
      <View style={ms.thdr}>
        <GBtn icon="chevronLeft" onPress={onBack} />
        <Pressable onPress={() => onContact(c.name, c.avatar)}>
          <Image source={{ uri: c.avatar }} style={{ width: 44, height: 44, borderRadius: 22 }} />
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => onContact(c.name, c.avatar)}>
          <Text style={{ fontWeight: "700", fontSize: 16 }}>{c.name}</Text>
          <Text style={{ fontSize: 11, color: "#22c55e", fontWeight: "600" }}>Online</Text>
        </Pressable>
        <GBtn icon="video" color="#2563eb" onPress={() => toast("Starting Nyne Vision…")} />
        <GBtn icon="phone" color="#2563eb" onPress={() => toast(`Calling ${c.name.split(" ")[0]}…`)} />
      </View>
      <ScrollView ref={list} style={{ flex: 1 }} contentContainerStyle={{ gap: 6, paddingHorizontal: 16, paddingBottom: 16 }} nativeID="app-scroll">
        {c.msgs.map((m, i) => m.im ? (
          <View key={i} style={[ms.bub, m.me ? ms.me : ms.them, { padding: 3, overflow: "hidden" }]}>
            <Image source={{ uri: m.im }} style={{ width: 180, height: 120, borderRadius: 17 }} resizeMode="cover" />
          </View>
        ) : (
          <View key={i} style={[ms.bub, m.me ? ms.me : ms.them]}>
            <Text style={{ fontSize: 14, lineHeight: 19, color: m.me ? "#fff" : "#111" }}>{m.text}</Text>
          </View>
        ))}
        {typing && (
          <View style={[ms.bub, ms.them, { flexDirection: "row", gap: 5, paddingVertical: 12, paddingHorizontal: 16 }]}>
            {[0, 1, 2].map((i) => <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#b6bcc5" }} />)}
          </View>
        )}
      </ScrollView>
      <View style={ms.composer}>
        <GBtn icon="plus" color="#6b7280" onPress={onPhotos} />
        <View style={[ms.search, { flex: 1 }]}>
          <TextInput style={ms.searchIn} value={draft} onChangeText={setDraft}
            placeholder="Nyne Message" placeholderTextColor="#9ca3af" onSubmitEditing={send} />
        </View>
        <Pressable style={ms.send} onPress={send}><Icon n="arrowUp" size={16} color="#fff" /></Pressable>
      </View>
    </View>
  );
}

/* ---------------- fiche contact ---------------- */
function Contact({ name, avatar, onBack, onMessage }: {
  name: string; avatar: string; onBack: () => void; onMessage: () => void;
}) {
  const acts: [string, string, string, () => void][] = [
    ["messageCircle", "Message", "#22c55e", onMessage],
    ["phone", "Call", "#2563eb", () => toast(`Calling ${name.split(" ")[0]}…`)],
    ["video", "Nyne Vision", "#0ea5e9", () => toast("Starting Nyne Vision…")],
  ];
  return (
    <View style={ms.page}>
      <View style={{ paddingTop: 60, paddingHorizontal: 16, paddingBottom: 4 }}>
        <GBtn icon="chevronLeft" onPress={onBack} />
      </View>
      <View style={{ flex: 1, alignItems: "center", paddingTop: 30 }}>
        <Image source={{ uri: avatar }} style={{ width: 96, height: 96, borderRadius: 48, marginBottom: 12 }} />
        <Text style={{ fontSize: 22, fontWeight: "800" }}>{name}</Text>
        <Text style={{ fontSize: 12, color: "#22c55e", fontWeight: "600", marginTop: 3 }}>Online</Text>
        <View style={{ flexDirection: "row", gap: 16, marginTop: 24 }}>
          {acts.map(([ic, l, bg, fn]) => (
            <View key={l} style={{ alignItems: "center", gap: 6 }}>
              <Pressable style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: bg, alignItems: "center", justifyContent: "center" }} onPress={fn}>
                <Icon n={ic} size={20} color="#fff" />
              </Pressable>
              <Text style={{ fontSize: 11, color: "#6b7280", fontWeight: "600" }}>{l}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/* ---------------- envoi de photo ---------------- */
function PhotoPicker({ onBack, onPick }: { onBack: () => void; onPick: (src: string) => void }) {
  return (
    <View style={ms.page}>
      <View style={ms.thdr}>
        <GBtn icon="x" onPress={onBack} />
        <Text style={{ fontWeight: "700", fontSize: 17 }}>Send a photo</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 6, paddingBottom: 40, flexDirection: "row", flexWrap: "wrap", gap: 8 }} nativeID="app-scroll">
        {PHOTOS.map((i) => (
          <Pressable key={i} style={{ width: "31.5%", aspectRatio: 1, borderRadius: 14, overflow: "hidden" }}
            onPress={() => onPick(`/img/photos/ph-${i}.jpg`)}>
            <Image source={{ uri: `/img/photos/ph-${i}.jpg` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

/* ---------------- nouveau message ---------------- */
function NewMessage({ all, onBack, onPick }: {
  all: [string, string][]; onBack: () => void; onPick: (n: string, a: string) => void;
}) {
  const [q, setQ] = React.useState("");
  const hits = all.filter(([n]) => !q || n.toLowerCase().includes(q.toLowerCase()));
  return (
    <View style={ms.page}>
      <View style={ms.thdr}>
        <GBtn icon="chevronLeft" onPress={onBack} />
        <Text style={{ fontWeight: "700", fontSize: 17 }}>New Message</Text>
      </View>
      <View style={[ms.search, { marginHorizontal: 16, marginBottom: 10 }]}>
        <Icon n="search" size={15} color="#9ca3af" />
        <TextInput style={ms.searchIn} value={q} onChangeText={setQ} placeholder="To:" placeholderTextColor="#9ca3af" autoFocus />
      </View>
      <View style={[ms.card, { marginHorizontal: 16 }]}>
        {hits.length ? hits.map(([n, a]) => (
          <Pressable key={n} style={ms.lrow} onPress={() => onPick(n, a)}>
            <Image source={{ uri: a }} style={ms.av} />
            <Text style={[ms.t1, { flex: 1 }]}>{n}</Text>
            <Icon n="chevronRight" size={16} color="#d1d5db" />
          </Pressable>
        )) : <Text style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No contact</Text>}
      </View>
    </View>
  );
}

const ms = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f4f4f5" },
  page: { flex: 1, backgroundColor: "#f4f4f5" },
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", paddingHorizontal: 14, paddingVertical: 2 } as object,
  lrow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 } as object,
  av: { width: 48, height: 48, borderRadius: 24 },
  ic: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  t1: { fontSize: 15, fontWeight: "600", color: "#111" },
  t2: { fontSize: 13, color: "#6b7280", marginTop: 1 },
  rt: { fontSize: 12, color: "#9ca3af" },
  badge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#22c55e", alignItems: "center", justifyContent: "center", paddingHorizontal: 5 } as object,
  badgeTxt: { color: "#fff", fontSize: 11, fontWeight: "700" },
  search: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(0,0,0,.06)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 } as object,
  searchIn: { flex: 1, fontSize: 14, color: "#111", padding: 0, margin: 0, outlineStyle: "none" } as object,
  thdr: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 60, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: "rgba(244,244,245,.9)" } as object,
  bub: { maxWidth: "76%" as unknown as number, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20, alignSelf: "flex-start" } as object,
  me: { backgroundColor: "#22c55e", borderBottomRightRadius: 4, alignSelf: "flex-end" } as object,
  them: { backgroundColor: "#fff", borderBottomLeftRadius: 4, alignSelf: "flex-start", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } } as object,
  composer: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 96 } as object,
  send: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#22c55e", alignItems: "center", justifyContent: "center" } as object,
  fab: {
    position: "absolute", right: 20, bottom: 116, width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#22c55e", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, zIndex: 40,
  } as object,
});
