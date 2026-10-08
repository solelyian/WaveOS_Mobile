// Mail.tsx — client mail complet : boîtes (Réception/Envoyés/Brouillons/
// Corbeille avec compteurs non-lus), liste (avatar expéditeur, sujet,
// extrait, heure, pastille non-lu, pièce jointe), lecteur (corps réel,
// barre d'actions répondre/transférer/archiver/signaler/supprimer),
// marquage lu à l'ouverture, recherche. État externe via store.
import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Avatar, createStore, Empty, fs, Icon, Nav, Search, StackNav, useStack, useStore, useTheme } from "../rn";

interface Mail {
  id: number; box: string; from: string; mail: string; subject: string;
  body: string; preview: string; time: string; unread?: boolean; att?: boolean; flag?: boolean;
}

const BOXES = [
  { name: "Réception", ic: "inbox" },
  { name: "Envoyés", ic: "send" },
  { name: "Brouillons", ic: "file-pen" },
  { name: "Corbeille", ic: "trash-2" },
];

const mails = createStore<Mail[]>([
  { id: 1, box: "Réception", from: "Camille Rey", mail: "camille@studio-a.fr", subject: "Maquettes WaveOS — v3", preview: "J'ai intégré tes retours sur les icônes, la version glossy est…", body: "Salut Ian,\n\nJ'ai intégré tes retours sur les icônes — la version glossy est dans le dossier partagé (v3). Le contraste sur fond clair a été revu aussi, dis-moi ce que tu en penses.\n\nPour le motion j'ai gardé les ressorts qu'on a calés ensemble.\n\nCamille", time: "14:02", unread: true, att: true },
  { id: 2, box: "Réception", from: "Nyne — sprint", mail: "sprint@nyne.dev", subject: "Revue sprint 42 — ordre du jour", preview: "Ordre du jour : avancement Sillage, motion review, plan QA…", body: "Bonjour,\n\nOrdre du jour de la revue sprint 42 :\n\n1. Avancement prototype Sillage\n2. Motion review (springs, cascades)\n3. Plan QA accessibilité\n4. Divers\n\nLa réunion est à 10h en visio.", time: "11:38", unread: true },
  { id: 3, box: "Réception", from: "Marc Delmas", mail: "marc@delmas.io", subject: "Re: Facture septembre", preview: "Merci, c'est réglé de mon côté. Bon week-end !", body: "Merci, c'est réglé de mon côté.\n\nBon week-end !\nMarc", time: "Hier", att: false },
  { id: 4, box: "Réception", from: "App Store", mail: "no_reply@apple.com", subject: "Votre reçu : Figma Professional", preview: "Reçu de votre achat du 11 octobre 2026. Total : 15,00 €…", body: "Reçu de votre achat du 11 octobre 2026.\n\nFigma Professional — abonnement mensuel\nTotal : 15,00 €\n\nMerci pour votre achat.", time: "Hier", unread: false, att: true },
  { id: 5, box: "Réception", from: "Léa Voss", mail: "lea@voss.audio", subject: "Stem « Rubans » — mix final", preview: "Le mix final est sur le Drive, version 96kHz master…", body: "Yo,\n\nLe mix final de « Rubans » est sur le Drive — version 96kHz master + stems séparés. La basse est beaucoup plus propre maintenant.\n\nDis-moi si tu veux une variante radio edit.\n\nLéa", time: "Lun.", flag: true },
  { id: 6, box: "Réception", from: "Banque Privée", mail: "alertes@bp.fr", subject: "Nouvelle connexion à votre espace", preview: "Une connexion a été établie le 12 oct. à 09:41…", body: "Une connexion a été établie à votre espace client le 12 oct. à 09:41 depuis un appareil mobile.\n\nSi ce n'était pas vous, contactez-nous.", time: "Lun." },
  { id: 7, box: "Envoyés", from: "Moi", mail: "ian@nyne.dev", subject: "Re: Maquettes WaveOS — v2", preview: "Les tuiles pastel sont top — par contre évite le plastique…", body: "Les tuiles pastel sont top — par contre évite le plastique brillant, on veut du verre, pas du jouet.\n\nIan", time: "Hier" },
  { id: 8, box: "Brouillons", from: "Moi", mail: "ian@nyne.dev", subject: "Brief direction artistique", preview: "L'eau comme comportement, jamais décor…", body: "L'eau comme comportement, jamais décor.\n\nÀ creuser : ribbons, verre liquide, ressorts…", time: "Dim." },
  { id: 9, box: "Corbeille", from: "Promo Tech", mail: "promo@tech.io", subject: "-40% sur tout, cette nuit seulement", preview: "Offre exceptionnelle valable jusqu'à minuit…", body: "Offre exceptionnelle valable jusqu'à minuit.", time: "10 oct." },
]);

const boxOf = createStore("Réception");

const initials = (f: string) => f.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
const HUES = [222, 150, 24, 8, 262, 190, 330];

function Reader({ m }: { m: Mail }): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav onBack={pop} back={boxOf.get()} right={
        <View style={{ flexDirection: "row", gap: 18 }}>
          <Pressable onPress={() => mails.set(ms => ms.map(x => x.id === m.id ? { ...x, flag: !x.flag } : x))}>
            <Icon name="flag" size={18} color={m.flag ? p.ambre : p.sub} sw={2} />
          </Pressable>
          <Pressable onPress={() => { mails.set(ms => ms.map(x => x.id === m.id ? { ...x, box: "Corbeille" } : x)); pop(); }}>
            <Icon name="trash-2" size={19} color={p.corail} sw={2} />
          </Pressable>
        </View>}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
        <Text style={{ fontSize: fs(20, p), fontWeight: "700", color: p.text, lineHeight: 27 }}>{m.subject}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, marginBottom: 4 }}>
          <Avatar name={initials(m.from)} size={34} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fs(14.5, p), fontWeight: "600", color: p.text }}>{m.from}</Text>
            <Text style={{ fontSize: fs(12, p), color: p.faint }}>{m.mail}</Text>
          </View>
          <Text style={{ fontSize: fs(12, p), color: p.faint }}>{m.time}</Text>
        </View>
        {m.att ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: p.card, borderRadius: 12, padding: 10, marginTop: 10, borderWidth: 0.5, borderColor: p.sep }}>
            <Icon name="paperclip" size={15} color={p.tint} sw={2} />
            <Text style={{ fontSize: fs(13, p), color: p.text }}>pièce-jointe.pdf</Text>
            <Text style={{ fontSize: fs(11.5, p), color: p.faint, marginLeft: "auto" as never }}>2,4 Mo</Text>
          </View>
        ) : null}
        <View style={{ height: 0.5, backgroundColor: p.sep, marginVertical: 14 }} />
        <Text style={{ fontSize: fs(15, p), color: p.text, lineHeight: 23 }}>{m.body}</Text>
        {/* barre d'actions */}
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 26, backgroundColor: p.card, borderRadius: 16, paddingVertical: 12, borderWidth: 0.5, borderColor: p.sep }}>
          {([["reply", "Répondre"], ["forward", "Transférer"], ["archive", "Archiver"]] as const).map(([ic, label]) => (
            <Pressable key={ic} style={({ pressed }) => ({ alignItems: "center", gap: 4, opacity: pressed ? 0.6 : 1 })}
              onPress={() => mails.set(ms => ic === "archive" ? ms.filter(x => x.id !== m.id) : ms)}>
              <Icon name={ic} size={19} color={p.tint} sw={2} />
              <Text style={{ fontSize: fs(10.5, p), color: p.sub }}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function MailRow({ m, last }: { m: Mail; last: boolean }): ReactNode {
  const p = useTheme();
  const { push } = useStack();
  const hue = HUES[m.id % HUES.length];
  return (
    <Pressable onPress={() => { mails.set(ms => ms.map(x => x.id === m.id ? { ...x, unread: false } : x)); push(<Reader m={m} />); }}
      style={({ pressed }) => ({
        flexDirection: "row", gap: 10, paddingHorizontal: 14, paddingVertical: 10, alignItems: "flex-start",
        borderBottomWidth: last ? 0 : 0.5, borderBottomColor: p.sep,
        backgroundColor: pressed ? p.card2 : "transparent",
      })}>
      <View style={{ width: 8, alignItems: "center", paddingTop: 8 }}>
        {m.unread ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.tint }} /> : null}
      </View>
      <Avatar name={initials(m.from)} size={38} hue={hue} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ flex: 1, fontSize: fs(15, p), fontWeight: m.unread ? "700" : "500", color: p.text }} numberOfLines={1}>{m.from}</Text>
          {m.flag ? <Icon name="flag" size={11} color={p.ambre} sw={2.6} /> : null}
          <Text style={{ fontSize: fs(12, p), color: p.faint, marginLeft: 6 }}>{m.time}</Text>
        </View>
        <Text style={{ fontSize: fs(13.5, p), fontWeight: m.unread ? "600" : "400", color: p.text, marginTop: 1 }} numberOfLines={1}>{m.subject}</Text>
        <Text style={{ fontSize: fs(12.5, p), color: p.faint, marginTop: 1 }} numberOfLines={2}>{m.preview}</Text>
        {m.att ? <Icon name="paperclip" size={12} color={p.faint} sw={2} /> : null}
      </View>
    </Pressable>
  );
}

function Home(): ReactNode {
  const p = useTheme();
  const all = useStore(mails);
  const box = useStore(boxOf);
  const [q, setQ] = useState("");
  const list = all.filter(m => m.box === box).filter(m => !q || (m.subject + m.from + m.preview).toLowerCase().includes(q.toLowerCase()));
  const unreadCount = (b: string) => all.filter(m => m.box === b && m.unread).length;
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav large="Mail" right={
        <Pressable><Icon name="square-pen" size={19} color={p.tint} sw={2.2} /></Pressable>
      } />
      {/* sélecteur de boîtes */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0, maxHeight: 34 }}
        contentContainerStyle={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 6, alignItems: "flex-start" }}>
        {BOXES.map(b => {
          const n = unreadCount(b.name);
          const on = box === b.name;
          return (
            <Pressable key={b.name} onPress={() => boxOf.set(() => b.name)} style={{
              flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 7, paddingHorizontal: 13,
              borderRadius: 16, backgroundColor: on ? p.tint : p.field,
            }}>
              <Icon name={b.ic} size={13} color={on ? "#fff" : p.sub} sw={2.2} />
              <Text style={{ fontSize: fs(13, p), fontWeight: "600", color: on ? "#fff" : p.sub }}>{b.name}</Text>
              {n > 0 ? <View style={{ backgroundColor: on ? "rgba(255,255,255,.28)" : p.tint, borderRadius: 9, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>{n}</Text>
              </View> : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <Search value={q} onChange={setQ} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        {list.length === 0 ? <Empty icon="mail-open" title="Boîte vide" sub={q ? "Aucun résultat." : "Rien à afficher ici."} /> : (
          <View style={{ backgroundColor: p.card, borderRadius: 18, overflow: "hidden", borderWidth: 0.5, borderColor: p.sep }}>
            {list.map((m, i) => <MailRow key={m.id} m={m} last={i === list.length - 1} />)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export function MailApp(): ReactNode {
  return <StackNav root={<Home />} />;
}
