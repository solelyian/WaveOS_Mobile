// MailApp.tsx — boîte vivante : dossiers réels, détail (reply/archive/trash/flag),
// composer fonctionnel (envoi → Envoyés, fermeture → Brouillons), recherche.
import React from "react";
import { View, Text, Pressable, Image, ScrollView, TextInput, StyleSheet } from "react-native";
import { Icon } from "../Icon";
import { toast } from "../host";
import { GlassHeader, FloatingTabBar, GBtn, SearchPill, PageBlank } from "./ui";

type Folder = "inbox" | "sent" | "drafts";
interface Mail {
  from: string; to?: string; avatar: string; subject: string; preview: string;
  body: string; time: string; unread?: boolean; archived?: boolean;
  flagged?: boolean; folder: Folder;
}
const MAILS: Mail[] = [
  { from: "Nyne Support", avatar: "/img/avatar/a-1.jpg", subject: "New Login Detected", preview: "We noticed a new sign-in to your account from San Francisco, CA…", body: "Hi Ian,\n\nWe noticed a new sign-in to your Nyne account from San Francisco, CA on a Mac.\n\nIf this was you, you can safely ignore this email. If not, secure your account immediately.\n\n— Nyne Support", time: "9:41 AM", unread: true, folder: "inbox" },
  { from: "Design Team", avatar: "/img/avatar/a-4.jpg", subject: "Figma: WaveOS v2 ready", preview: "The new glass components are ready for review…", body: "Hey!\n\nThe WaveOS v2 components are now in Figma — new glass tiles, the app store templates and the dynamic island states.\n\nTake a look when you can!\n\n— Design Team", time: "8:52 AM", unread: true, flagged: true, folder: "inbox" },
  { from: "GitHub", avatar: "/img/avatar/a-9.jpg", subject: "[WaveOS_Mobile] PR #2 updated", preview: "devin pushed 3 new commits to the branch…", body: "devin pushed 3 new commits to devin/1791534600-calque-react:\n\n  • feat: enrich apps with interactive content\n  • feat: add App Store\n  • fix: visual bugs in apps\n\nView it on GitHub.", time: "Yesterday", folder: "inbox" },
  { from: "Calendar", avatar: "/img/avatar/a-11.jpg", subject: "Reminder: Sprint review", preview: "Design Sync starts in 30 minutes…", body: "Sprint review & Design Sync\nToday, 10:00 – 11:00 AM\nNyne HQ — Room 4\n\nJoin: waveos.link/sync", time: "Yesterday", folder: "inbox" },
  { from: "Apple Store", avatar: "/img/avatar/a-15.jpg", subject: "Your receipt", preview: "Thank you for your purchase. Total: $4.99…", body: "Dear Ian,\n\nThank you for your purchase.\n\n  Procreate Pocket — $4.99\n\nYour receipt is attached.\n\n— Apple", time: "Saturday", flagged: true, folder: "inbox" },
  { from: "Jordan Lee", avatar: "/img/avatar/a-5.jpg", subject: "Trip photos 📷", preview: "Here are all the shots from Big Sur — pick your favorites…", body: "Yo!\n\nFinally uploaded the Big Sur trip photos — 120 shots in the shared album.\nPick your favorites, I'm making prints.\n\n— J", time: "Saturday", folder: "inbox" },
  { from: "Me", to: "Design Team", avatar: "/img/contact-john.jpg", subject: "Re: WaveOS v2 glass", preview: "The spring curves look perfect — shipping the morph today…", body: "The spring curves look perfect — shipping the morph today.\n\nI'll send the tokens file over once the WASM build is green.\n\n— Ian", time: "9:02 AM", folder: "sent" },
  { from: "Me", to: "Sam Rivera", avatar: "/img/contact-john.jpg", subject: "Re: Big Sur prints", preview: "Pick shots 12, 34 and 87 — those are the keepers…", body: "Pick shots 12, 34 and 87 — those are the keepers.\n\nThanks for uploading them!\n\n— Ian", time: "Yesterday", folder: "sent" },
  { from: "Me", to: "Mom", avatar: "/img/contact-john.jpg", subject: "Sunday dinner", preview: "Count me in — I'll bring dessert…", body: "Count me in — I'll bring dessert.\n\nLove,\nIan", time: "Monday", folder: "sent" },
  { from: "Me", to: "Alex Morgan", avatar: "/img/contact-john.jpg", subject: "(no subject)", preview: "hey — still need the token values for…", body: "hey — still need the token values for", time: "10:04 AM", folder: "drafts" },
  { from: "Me", to: "Jordan Lee", avatar: "/img/contact-john.jpg", subject: "Print order", preview: "Can you also send the framing options…", body: "Can you also send the framing options for", time: "Yesterday", folder: "drafts" },
];

type Pane = { kind: "detail"; m: Mail } | { kind: "composer"; to?: string; subject?: string; body?: string; draft?: Mail };

export function MailApp() {
  const [tab, setTab] = React.useState("inbox");
  const [q, setQ] = React.useState("");
  const [panes, setPanes] = React.useState<Pane[]>([]);
  const [, bump] = React.useReducer((x: number) => x + 1, 0);
  const push = (p: Pane) => setPanes((v) => [...v, p]);
  const pop = () => setPanes((v) => v.slice(0, -1));
  const composer = (o: Omit<Pane & { kind: "composer" }, "kind"> = {}) => push({ kind: "composer", ...o });

  const box = MAILS.filter((m) => !m.archived && (
    tab === "inbox" ? m.folder === "inbox"
    : tab === "sent" ? m.folder === "sent"
    : tab === "drafts" ? m.folder === "drafts"
    : !!m.flagged));
  const hits = box.filter((m) => !q || (m.from + (m.to ?? "") + m.subject + m.preview).toLowerCase().includes(q.toLowerCase()));

  const row = (m: Mail, i: number) => {
    const who = m.folder === "sent" || m.folder === "drafts" ? `To: ${m.to}` : m.from;
    return (
      <Pressable key={i} style={ms.lrow} onPress={() =>
        m.folder === "drafts"
          ? composer({ to: m.to, subject: m.subject === "(no subject)" ? "" : m.subject, body: m.body, draft: m })
          : (m.unread = false, push({ kind: "detail", m }))}>
        <Image source={{ uri: m.avatar }} style={ms.av} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            {m.unread && <View style={ms.dot} />}
            {m.flagged && <Icon n="flag" size={12} color="#f59e0b" />}
            <Text style={ms.t1} numberOfLines={1}>{who}</Text>
          </View>
          <Text style={[ms.t1, { fontSize: 13, fontWeight: "600", color: m.folder === "drafts" ? "#d97706" : "#4b5563" }]} numberOfLines={1}>{m.subject}</Text>
          <Text style={ms.t2} numberOfLines={1}>{m.preview}</Text>
        </View>
        <Text style={ms.rt}>{m.time}</Text>
      </Pressable>
    );
  };

  return (
    <View style={ms.root}>
      <GlassHeader title="Inbox" large />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }} nativeID="app-scroll">
        <SearchPill value={q} onChange={setQ} placeholder="Search" />
        <View style={ms.card}>
          {hits.length ? hits.map(row) : (
            <Text style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
              No {tab === "flag" ? "flagged" : tab} mail
            </Text>
          )}
        </View>
      </ScrollView>
      <FloatingTabBar active={tab} onTab={setTab} tabs={[
        { id: "inbox", icon: "mail", label: "Inbox" },
        { id: "sent", icon: "send", label: "Sent" },
        { id: "drafts", icon: "file", label: "Drafts" },
        { id: "flag", icon: "flag", label: "Flagged" },
      ]} />
      <Pressable style={ms.fab} onPress={() => composer()}>
        <Icon n="pencil" size={22} color="#fff" />
      </Pressable>
      {panes.map((p, i) => (
        <PageBlank key={i} onClose={pop}>
          {p.kind === "detail"
            ? <Detail m={p.m} onBack={pop} bump={bump} onReply={(o) => { pop(); composer(o); }} />
            : <ComposerPane opts={p} onDone={(sent) => { pop(); bump(); toast(sent ? "Message sent" : "Saved to drafts"); }} />}
        </PageBlank>
      ))}
    </View>
  );
}

function Detail({ m, onBack, bump, onReply }: {
  m: Mail; onBack: () => void; bump: () => void;
  onReply: (o: { to: string; subject: string; body: string }) => void;
}) {
  const reply = { to: m.folder === "inbox" ? m.from : (m.to ?? ""), subject: m.subject.startsWith("Re:") ? m.subject : `Re: ${m.subject}`, body: `\n\n—— Original message ——\n${m.body}` };
  const who = m.folder === "sent" || m.folder === "drafts" ? `To: ${m.to}` : m.from;
  return (
    <View style={{ flex: 1, backgroundColor: "#f4f4f5" }}>
      <View style={ms.thdr}>
        <GBtn icon="chevronLeft" onPress={() => { bump(); onBack(); }} />
        <View style={{ flex: 1 }} />
        <GBtn icon="flag" color={m.flagged ? "#f59e0b" : "#2563eb"} onPress={() => { m.flagged = !m.flagged; bump(); toast(m.flagged ? "Flagged" : "Unflagged"); }} />
        <GBtn icon="archive" color="#2563eb" onPress={() => { m.archived = true; bump(); onBack(); toast("Archived"); }} />
        <GBtn icon="trash2" color="#2563eb" onPress={() => { m.archived = true; bump(); onBack(); toast("Moved to Bin"); }} />
        <GBtn icon="reply" color="#2563eb" onPress={() => onReply(reply)} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} nativeID="app-scroll">
        <Text style={{ fontSize: 22, fontWeight: "700", letterSpacing: -0.2, marginVertical: 12 }}>{m.subject}</Text>
        <View style={[ms.card, { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 }]}>
          <Image source={{ uri: m.avatar }} style={ms.av} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontWeight: "700", fontSize: 15 }} numberOfLines={1}>{who}</Text>
            <Text style={{ fontSize: 12, color: "#9ca3af" }}>{m.folder === "inbox" ? "To: ian.alexandre1@pm.me" : "From: ian.alexandre1@pm.me"}</Text>
          </View>
          <Text style={{ fontSize: 12, color: "#9ca3af" }}>{m.time}</Text>
        </View>
        <View style={[ms.card, { marginTop: 14, padding: 18 }]}>
          {m.body.split("\n\n").map((p, i) => (
            <Text key={i} style={{ fontSize: 15, lineHeight: 23, color: "#374151", marginBottom: 12 }}>{p}</Text>
          ))}
        </View>
        <Pressable style={ms.replyBtn} onPress={() => onReply(reply)}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Reply</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ComposerPane({ opts, onDone }: {
  opts: { to?: string; subject?: string; body?: string; draft?: Mail };
  onDone: (sent: boolean) => void;
}) {
  const [to, setTo] = React.useState(opts.to ?? "");
  const [subj, setSubj] = React.useState(opts.subject ?? "");
  const [body, setBody] = React.useState(opts.body ?? "");
  const send = () => {
    if (!to.trim() && !subj.trim() && !body.trim()) { toast("Empty message"); return; }
    if (opts.draft) MAILS.splice(MAILS.indexOf(opts.draft), 1);
    MAILS.unshift({ from: "Me", to: to.trim() || "Unknown", avatar: "/img/contact-john.jpg", subject: subj.trim() || "(no subject)", preview: body.trim().split("\n")[0].slice(0, 60) || "(empty)", body: body.trim(), time: "now", folder: "sent" });
    onDone(true);
  };
  const dismiss = () => {
    if (to.trim() || subj.trim() || body.trim()) {
      if (opts.draft) { opts.draft.to = to.trim() || "Unknown"; opts.draft.subject = subj.trim() || "(no subject)"; opts.draft.body = body; opts.draft.preview = body.trim().split("\n")[0].slice(0, 60) || "(empty)"; }
      else MAILS.unshift({ from: "Me", to: to.trim() || "Unknown", avatar: "/img/contact-john.jpg", subject: subj.trim() || "(no subject)", preview: body.trim().split("\n")[0].slice(0, 60) || "(empty)", body, time: "now", folder: "drafts" });
      onDone(false);
    } else onDone(false);
  };
  return (
    <View style={{ flex: 1, backgroundColor: "#f4f4f5" }}>
      <View style={[ms.thdr, { gap: 0 }]}>
        <GBtn icon="x" onPress={dismiss} />
        <Text style={{ flex: 1, textAlign: "center", fontWeight: "700", fontSize: 17 }}>New Message</Text>
        <Pressable style={ms.send} onPress={send}><Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Send</Text></Pressable>
      </View>
      <View style={ms.fld}><TextInput style={ms.fldIn} value={to} onChangeText={setTo} placeholder="To:" placeholderTextColor="#9ca3af" autoFocus /></View>
      <View style={ms.fld}><TextInput style={ms.fldIn} value={subj} onChangeText={setSubj} placeholder="Subject:" placeholderTextColor="#9ca3af" /></View>
      <TextInput style={ms.bodyIn} value={body} onChangeText={setBody} placeholder="Write your message…" placeholderTextColor="#9ca3af" multiline />
    </View>
  );
}

const ms = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f4f4f5" },
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden" } as object,
  lrow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 14 } as object,
  av: { width: 44, height: 44, borderRadius: 22 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2563eb" },
  t1: { fontSize: 15, fontWeight: "600", color: "#111" },
  t2: { fontSize: 13, color: "#6b7280", marginTop: 1 },
  rt: { fontSize: 12, color: "#9ca3af" },
  thdr: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 60, paddingHorizontal: 16, paddingBottom: 10 } as object,
  replyBtn: { marginTop: 14, paddingVertical: 13, borderRadius: 16, backgroundColor: "#2563eb", alignItems: "center" } as object,
  send: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999, backgroundColor: "#2563eb" } as object,
  fab: { position: "absolute", width: 56, height: 56, right: 20, bottom: 116, borderRadius: 28, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center", zIndex: 80 } as object,
  fld: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,.05)" } as object,
  fldIn: { fontSize: 15, color: "#111", padding: 0, outlineStyle: "none" } as object,
  bodyIn: { flex: 1, fontSize: 15, lineHeight: 22, paddingHorizontal: 20, paddingVertical: 14, color: "#111", textAlignVertical: "top", outlineStyle: "none" } as object,
});
