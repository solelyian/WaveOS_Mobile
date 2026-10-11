// PhoneApp.tsx — téléphone complet : clavier (effacement, appel), favoris,
// fiche contact, récents, voicemail avec lecteur + transcription, écran
// d'appel (chrono, boutons à état, pavé in-call, contacts in-call).
import React from "react";
import { View, Text, Pressable, Image, ScrollView, StyleSheet } from "react-native";
import { Icon } from "../Icon";
import type { IconName } from "../../core/lucide";
import { toast, host } from "../host";
import { GlassHeader, FloatingTabBar, GBtn, PageBlank } from "./ui";
import { useAccent } from "../theme";
import { domOf } from "../fx";

const CONTACTS = [
  ["Alex Morgan", "+1 (415) 555-0142", "/img/avatar/a-2.jpg"],
  ["Jordan Lee", "+1 (628) 555-0177", "/img/avatar/a-5.jpg"],
  ["Sam Rivera", "+1 (510) 555-0109", "/img/avatar/a-8.jpg"],
  ["Mom", "+1 (925) 555-0134", "/img/avatar/a-12.jpg"],
  ["Chris Park", "+1 (650) 555-0190", "/img/avatar/a-21.jpg"],
  ["Taylor Kim", "+1 (415) 555-0128", "/img/avatar/a-24.jpg"],
] as const;
const RECENTS = [
  ["Alex Morgan", "phoneIncoming", "9:10 AM", "mobile"],
  ["Mom", "phoneMissed", "Yesterday", "mobile"],
  ["Jordan Lee", "phoneOutgoing", "Yesterday", "FaceTime audio"],
  ["Sam Rivera", "phoneIncoming", "Monday", "mobile"],
] as const;
const KEYS = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"], ["*", ""], ["0", "+"], ["#", ""]] as const;
const VM = [
  ["Mom", "2:14", "Yesterday", "Hi honey, it's me. Just calling to check if you're still coming for dinner on Sunday — your brother will be there too. Call me back when you get this, love you!", "/img/avatar/a-12.jpg"],
  ["Unknown", "0:37", "Monday", "This is a reminder about your delivery scheduled for tomorrow between 9 AM and noon. Press any key to reschedule.", ""],
] as const;

const fmtNumber = (raw: string) => {
  const plus = raw.startsWith("+");
  let d = (plus ? raw.slice(1) : raw).replace(/\D/g, "");
  let cc = plus ? "+" : "";
  if (plus && d.startsWith("1") && d.length > 10) { cc = "+1 "; d = d.slice(1); }
  let out = "";
  if (d.length <= 3) out = d;
  else if (d.length <= 6) out = `${d.slice(0, 3)}-${d.slice(3)}`;
  else if (d.length <= 10) out = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  else out = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)} ${d.slice(10)}`;
  return cc + out;
};

type Pane =
  | { kind: "call"; name: string; avatar?: string }
  | { kind: "contact"; name: string; num: string; avatar: string }
  | { kind: "vm"; i: number }
  | { kind: "incall-contacts" };

export function PhoneApp() {
  const ac = useAccent();
  const [tab, setTab] = React.useState("keypad");
  const [digits, setDigits] = React.useState("");
  const [panes, setPanes] = React.useState<Pane[]>([]);
  const push = (p: Pane) => setPanes((v) => [...v, p]);
  const pop = () => setPanes((v) => v.slice(0, -1));
  const clear = () => setPanes([]);
  const call = (name: string, avatar?: string) => push({ kind: "call", name, avatar });
  const card = (name: string, num: string, avatar: string) => push({ kind: "contact", name, num, avatar });

  const normalize = (s: string) => s.replace(/\D/g, "");
  const match = () => {
    const d = normalize(digits);
    if (d.length < 4) return null;
    const c = CONTACTS.find(([, num]) => {
      const n = normalize(num), local = n.slice(-10);
      return local.startsWith(d) || d.endsWith(local) || (d.startsWith("1") && d.slice(1).endsWith(local));
    });
    return c ? c[0] : null;
  };

  const personRow = (name: string, avatar: string, sub: string, red = false, key?: string) => (
    <View key={key ?? name + sub} style={ps.lrow}>
      <Pressable style={[ps.lrow, { flex: 1 }]} onPress={() => card(name, CONTACTS.find((x) => x[0] === name)?.[1] ?? sub, avatar)}>
        <Image source={{ uri: avatar }} style={ps.av} />
        <View style={{ flex: 1 }}>
          <Text style={[ps.t1, red && { color: "#ef4444" }]}>{name}</Text>
          <Text style={ps.t2}>{sub}</Text>
        </View>
      </Pressable>
      <Pressable style={ps.callBtn} onPress={() => call(name, avatar)}>
        <Icon n="phone" size={16} color="#16a34a" />
      </Pressable>
    </View>
  );

  return (
    <View style={ps.root}>
      <GlassHeader title="Phone" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} nativeID="app-scroll">
        {tab === "keypad" && (
          <>
            <Text style={[ps.disp, normalize(digits).length > 10 && { fontSize: 30 }]}>{fmtNumber(digits) || " "}</Text>
            <Text style={ps.who}>{match() ?? " "}</Text>
            <View style={ps.keys}>
              {KEYS.map(([n, sub]) => <Key key={n} n={n} sub={sub} onDigit={(d, plus) => {
                setDigits((v) => plus ? (v.startsWith("+") ? v : "+" + v) : v + d);
              }} />)}
            </View>
            <View style={ps.callRow}>
              <View style={{ width: 80 }} />
              <Pressable style={ps.callMain} onPress={() => {
                if (!digits) { toast("Enter a number"); return; }
                call(fmtNumber(digits)); setDigits("");
              }}>
                <Icon n="phone" size={28} color="#fff" />
              </Pressable>
              <View style={{ width: 80, alignItems: "center" }}>
                {digits ? (
                  <Pressable
                    onPress={() => setDigits((v) => v.slice(0, -1))}
                    onLongPress={() => setDigits("")}
                    style={{ padding: 20 }}>
                    <Icon n="delete" size={26} color="#6b7280" />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </>
        )}
        {tab === "favorites" && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {CONTACTS.slice(0, 4).map(([n, num, a]) => (
              <Pressable key={n} style={ps.fav} onPress={() => card(n, num, a)}>
                <View>
                  <Image source={{ uri: a }} style={{ width: 64, height: 64, borderRadius: 32 }} />
                  <View style={ps.favStar}><Icon n="star" size={12} color="#fff" /></View>
                </View>
                <Text style={{ fontWeight: "600", fontSize: 14 }}>{n}</Text>
                <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: -6 }}>mobile</Text>
              </Pressable>
            ))}
          </View>
        )}
        {tab === "contacts" && (
          <View style={ps.card}>{CONTACTS.map(([n, num, a]) => personRow(n, a, num))}</View>
        )}
        {tab === "voicemail" && (
          <View style={ps.card}>
            {VM.map(([n, d, t], i) => (
              <View key={n} style={ps.lrow}>
                <View style={[ps.ic, { backgroundColor: "#6b7280" }]}><Icon n="voicemail" size={17} color="#fff" /></View>
                <Pressable style={{ flex: 1 }} onPress={() => push({ kind: "vm", i })}>
                  <Text style={ps.t1}>{n}</Text><Text style={ps.t2}>{d} · {t}</Text>
                </Pressable>
                <Pressable onPress={() => push({ kind: "vm", i })}><Icon n="play" size={20} color={ac} /></Pressable>
              </View>
            ))}
          </View>
        )}
        {tab === "recents" && (
          <View style={ps.card}>
            {RECENTS.map(([n, ic, t, how]) => {
              const c = CONTACTS.find((x) => x[0] === n);
              return personRow(n, c ? c[2] : "/img/avatar/a-0.jpg", `${how} · ${t}`, ic === "phoneMissed", n + t);
            })}
          </View>
        )}
      </ScrollView>
      <FloatingTabBar active={tab} onTab={setTab} tabs={[
        { id: "favorites", icon: "star", label: "Favorites" },
        { id: "recents", icon: "clock", label: "Recents" },
        { id: "contacts", icon: "user", label: "Contacts" },
        { id: "keypad", icon: "layoutGrid", label: "Keypad" },
        { id: "voicemail", icon: "voicemail", label: "Voicemail" },
      ]} />
      {panes.map((p, i) => (
        <PageBlank key={i} onClose={pop}>
          {p.kind === "call" && <CallScreen name={p.name} avatar={p.avatar} onEnd={() => setPanes((v) => v.slice(0, i))} onContacts={() => push({ kind: "incall-contacts" })} />}
          {p.kind === "contact" && <ContactCard name={p.name} num={p.num} avatar={p.avatar} onBack={pop} onCall={call} onClear={clear} ac={ac} />}
          {p.kind === "vm" && <Voicemail i={p.i} onBack={pop} onCall={call} />}
          {p.kind === "incall-contacts" && <InCallContacts onBack={pop} />}
        </PageBlank>
      ))}
    </View>
  );
}

/* ---------------- clavier ---------------- */
function Key({ n, sub, onDigit }: { n: string; sub: string; onDigit: (d: string, plus?: boolean) => void }) {
  const hold = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppress = React.useRef(false);
  return (
    <Pressable
      style={ps.key}
      onPressIn={() => {
        if (n === "0") hold.current = setTimeout(() => { suppress.current = true; onDigit("0", true); }, 500);
      }}
      onPressOut={() => { if (hold.current) clearTimeout(hold.current); }}
      onPress={() => {
        if (n === "0" && suppress.current) { suppress.current = false; return; }
        onDigit(n);
      }}>
      <Text style={ps.keyN}>{n}</Text>
      <Text style={ps.keyS}>{sub || " "}</Text>
    </Pressable>
  );
}

/* ---------------- écran d'appel ---------------- */
function CallScreen({ name, avatar, onEnd, onContacts }: {
  name: string; avatar?: string; onEnd: () => void; onContacts: () => void;
}) {
  const [secs, setSecs] = React.useState(-1);
  const [kp, setKp] = React.useState(false);
  const [act, setAct] = React.useState<Set<string>>(new Set());
  const bg = React.useRef<View>(null);
  React.useEffect(() => {
    const el = domOf(bg);
    if (el) {
      el.style.backgroundImage = avatar ? `url(${avatar})` : "url(/img/wallpaper.jpg)";
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.style.filter = avatar ? "blur(30px) brightness(.62) saturate(1.35)" : "blur(26px) brightness(.58) saturate(1.4)";
      el.style.transform = "scale(1.05)";
    }
    const iv = setInterval(() => setSecs((v) => v + 1), 800);
    const t0 = setTimeout(() => setSecs((v) => (v < 0 ? 0 : v)), 1500);
    return () => { clearInterval(iv); clearTimeout(t0); };
  }, [avatar]);

  const Btn = ({ ic, l, fn }: { ic: IconName; l: string; fn?: () => void }) => (
    <View style={{ alignItems: "center", gap: 6 }}>
      <Pressable
        style={[ps.abtn, act.has(l) && { backgroundColor: "rgba(255,255,255,.28)" }]}
        onPress={() => {
          if (fn) return fn();
          setAct((v) => { const s = new Set(v); if (s.has(l)) s.delete(l); else s.add(l); return s; });
        }}>
        <Icon n={ic} size={22} color="#fff" />
      </Pressable>
      <Text style={ps.albl}>{l}</Text>
    </View>
  );

  return (
    <View style={ps.call}>
      <View ref={bg} style={ps.callBg} />
      <View style={ps.callVeil} />
      <View style={ps.callCol}>
        {!avatar && <View style={ps.callAv}><Icon n="user" size={36} color="#fff" /></View>}
        <Text style={ps.callName}>{name}</Text>
        <Text style={{ fontSize: 13, color: "rgba(255,255,255,.6)", marginTop: 3 }}>mobile</Text>
        <Text style={{ fontSize: 15, color: "rgba(255,255,255,.75)", marginTop: 2 }}>
          {secs < 0 ? "calling…" : `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`}
        </Text>
        <View style={{ flex: 1 }} />
        <View style={ps.callCard}>
          <View style={ps.callGrid}>
            <Btn ic="volume2" l="speaker" />
            <Btn ic="video" l="Nyne Vision" fn={() => toast("Switching to Nyne Vision…")} />
            <Btn ic="micOff" l="mute" />
            <Btn ic="plus" l="add call" fn={onContacts} />
            <View style={{ alignItems: "center", gap: 6 }}>
              <Pressable style={ps.endBtn} onPress={onEnd}>
                <View style={{ transform: [{ rotate: "135deg" }] }}><Icon n="phone" size={28} color="#fff" /></View>
              </Pressable>
              <Text style={ps.albl}>end</Text>
            </View>
            <Btn ic="layoutGrid" l="keypad" fn={() => setKp(true)} />
          </View>
        </View>
      </View>
      {kp && (
        <View style={ps.inkp}>
          <Text style={{ fontSize: 22, fontWeight: "600", color: "#fff", marginBottom: 26 }}>{name}</Text>
          <View style={ps.keys}>
            {KEYS.map(([n, s]) => (
              <View key={n} style={[ps.key, { backgroundColor: "rgba(255,255,255,.1)" }]}>
                <Text style={[ps.keyN, { color: "#fff" }]}>{n}</Text>
                <Text style={[ps.keyS, { color: "rgba(255,255,255,.4)" }]}>{s || " "}</Text>
              </View>
            ))}
          </View>
          <View style={{ flex: 1 }} />
          <Pressable style={ps.hide} onPress={() => setKp(false)}><Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Hide</Text></Pressable>
        </View>
      )}
    </View>
  );
}

function InCallContacts({ onBack }: { onBack: () => void }) {
  return (
    <View style={ps.page}>
      <View style={ps.thdr}>
        <GBtn icon="chevronLeft" onPress={onBack} />
        <Text style={{ fontWeight: "700", fontSize: 17 }}>Contacts</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16 }} nativeID="app-scroll">
        <View style={ps.card}>
          {CONTACTS.map(([n, num, a]) => (
            <Pressable key={n} style={ps.lrow} onPress={() => { onBack(); toast(`Merging call with ${n.split(" ")[0]}…`); }}>
              <Image source={{ uri: a }} style={ps.av} />
              <View style={{ flex: 1 }}><Text style={ps.t1}>{n}</Text><Text style={ps.t2}>{num}</Text></View>
              <Icon n="plus" size={18} color="#22c55e" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------------- fiche contact ---------------- */
function ContactCard({ name, num, avatar, onBack, onCall, onClear, ac }: {
  ac: string;
  name: string; num: string; avatar: string; onBack: () => void;
  onCall: (n: string, a?: string) => void; onClear: () => void;
}) {
  const act = (ic: IconName, l: string, bg: string, fn: () => void) => (
    <View key={l} style={{ alignItems: "center", gap: 6 }}>
      <Pressable style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}
        onPress={() => { onClear(); fn(); }}>
        <Icon n={ic} size={20} color="#fff" />
      </Pressable>
      <Text style={{ fontSize: 11, color: "#6b7280", fontWeight: "600" }}>{l}</Text>
    </View>
  );
  return (
    <View style={ps.page}>
      <View style={{ paddingTop: 60, paddingHorizontal: 16, paddingBottom: 4 }}>
        <GBtn icon="chevronLeft" onPress={onBack} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, alignItems: "center" }} nativeID="app-scroll">
        <Image source={{ uri: avatar }} style={{ width: 104, height: 104, borderRadius: 52, marginBottom: 12 }} />
        <Text style={{ fontSize: 24, fontWeight: "800", letterSpacing: -0.3 }}>{name}</Text>
        <View style={{ flexDirection: "row", gap: 18, marginVertical: 26 }}>
          {act("messageCircle", "message", ac, () => host.openApp("messages"))}
          {act("phone", "call", "#22c55e", () => onCall(name, avatar))}
          {act("video", "video", "#0ea5e9", () => onCall(name, avatar))}
          {act("mail", "mail", "#8b5cf6", () => host.openApp("mail"))}
        </View>
        <View style={[ps.card, { width: "100%" }]}>
          <View style={ps.lrow}><View style={[ps.ic, { backgroundColor: "#22c55e" }]}><Icon n="phone" size={17} color="#fff" /></View>
            <View><Text style={ps.t2}>mobile</Text><Text style={ps.t1}>{num}</Text></View></View>
          <View style={ps.lrow}><View style={[ps.ic, { backgroundColor: "#8b5cf6" }]}><Icon n="mail" size={17} color="#fff" /></View>
            <View><Text style={ps.t2}>email</Text><Text style={ps.t1}>{name.split(" ")[0].toLowerCase()}@nyne.dev</Text></View></View>
          <View style={ps.lrow}><View style={[ps.ic, { backgroundColor: "#f59e0b" }]}><Icon n="bell" size={17} color="#fff" /></View>
            <View><Text style={ps.t1}>Ringtone</Text><Text style={ps.t2}>Ripples</Text></View></View>
        </View>
        <Pressable style={[ps.card, { width: "100%", marginTop: 12, padding: 14, alignItems: "center" }]}
          onPress={() => { onBack(); toast(`${name.split(" ")[0]} blocked`); }}>
          <Text style={{ color: "#ef4444", fontWeight: "600" }}>Block this Caller</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/* ---------------- voicemail ---------------- */
function Voicemail({ i, onBack, onCall }: { i: number; onBack: () => void; onCall: (n: string, a?: string) => void }) {
  const ac = useAccent();
  const [n, dur, when, transcript, avatar] = VM[i];
  const secs = (() => { const [m, s] = dur.split(":").map(Number); return m * 60 + s; })();
  const [playing, setPlaying] = React.useState(false);
  const [pos, setPos] = React.useState(0);
  React.useEffect(() => {
    if (!playing) return;
    const t0 = performance.now();
    let base = pos;
    const iv = setInterval(() => {
      const p = base + (performance.now() - t0) / 1000;
      if (p >= secs) { setPos(secs); setPlaying(false); } else setPos(p);
    }, 200);
    return () => { clearInterval(iv); base = pos; };
  }, [playing]);
  return (
    <View style={ps.page}>
      <View style={ps.thdr}>
        <GBtn icon="chevronLeft" onPress={onBack} />
        <Text style={{ fontWeight: "700", fontSize: 17 }}>Voicemail</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 6 }} nativeID="app-scroll">
        <View style={[ps.card, { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }]}>
          {avatar ? <Image source={{ uri: avatar }} style={ps.av} /> : (
            <View style={[ps.av, { backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center" }]}><Icon n="user" size={20} color="#6b7280" /></View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "700", fontSize: 16 }}>{n}</Text>
            <Text style={{ fontSize: 12, color: "#9ca3af" }}>{when}</Text>
          </View>
          <Pressable style={[ps.callBtn, { width: 38, height: 38, borderRadius: 19 }]} onPress={() => onCall(n, avatar || undefined)}>
            <Icon n="phone" size={16} color="#16a34a" />
          </Pressable>
        </View>
        <View style={[ps.card, { marginTop: 14, padding: 18 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Pressable style={ps.pp} onPress={() => setPlaying((v) => !v)}>
              <Icon n={playing ? "pause" : "play"} size={22} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(0,0,0,.08)", overflow: "hidden" }}>
                <View style={{ height: "100%" as unknown as number, width: `${(pos / secs) * 100}%` as unknown as number, backgroundColor: ac, borderRadius: 3 }} />
              </View>
              <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 6, fontVariant: ["tabular-nums"] }}>
                {Math.floor(pos / 60)}:{String(Math.floor(pos % 60)).padStart(2, "0")} / {dur}
              </Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: "rgba(0,0,0,.06)", marginVertical: 16 }} />
          <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 0.8, color: "#9ca3af", textTransform: "uppercase", marginBottom: 6 }}>Transcription</Text>
          <Text style={{ fontSize: 14, lineHeight: 22, color: "#374151" }}>{transcript}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const ps = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f4f4f5" },
  page: { flex: 1, backgroundColor: "#f4f4f5" },
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", paddingHorizontal: 14, paddingVertical: 2 } as object,
  lrow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 } as object,
  av: { width: 48, height: 48, borderRadius: 24 },
  ic: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  t1: { fontSize: 15, fontWeight: "600", color: "#111" },
  t2: { fontSize: 13, color: "#6b7280", marginTop: 1 },
  callBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center" } as object,
  disp: { textAlign: "center", fontSize: 38, fontWeight: "300", letterSpacing: 0.3, minHeight: 48, marginTop: 4, fontVariant: ["tabular-nums"] },
  who: { textAlign: "center", fontSize: 13, fontWeight: "600", color: "#22c55e", minHeight: 18, marginBottom: 10 },
  keys: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, paddingHorizontal: 20 } as object,
  key: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" } as object,
  keyN: { fontSize: 30, fontWeight: "300", color: "#111" },
  keyS: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2, color: "#9ca3af", marginTop: -2 },
  callRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 14 } as object,
  callMain: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#22c55e", alignItems: "center", justifyContent: "center" } as object,
  fav: { width: "47.5%", backgroundColor: "#fff", borderRadius: 16, padding: 16, alignItems: "center", gap: 8 } as object,
  favStar: { position: "absolute", top: -4, right: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: "#f59e0b", alignItems: "center", justifyContent: "center" } as object,
  call: { flex: 1, overflow: "hidden" },
  callBg: { position: "absolute", top: -24, left: -24, right: -24, bottom: -24 } as object,
  callVeil: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,.3)" } as object,
  callCol: { flex: 1, alignItems: "center", paddingTop: 76, paddingHorizontal: 28, paddingBottom: 44, zIndex: 2 } as object,
  callAv: { width: 84, height: 84, borderRadius: 42, backgroundColor: "rgba(255,255,255,.14)", alignItems: "center", justifyContent: "center", marginBottom: 12 } as object,
  callName: { fontSize: 30, fontWeight: "700", letterSpacing: -0.3, color: "#fff" },
  callCard: {
    width: "100%" as unknown as number, paddingVertical: 24, paddingHorizontal: 18, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,.08)", borderWidth: 1, borderColor: "rgba(255,255,255,.14)",
  } as object,
  callGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", rowGap: 20 } as object,
  abtn: { width: 62, height: 62, borderRadius: 31, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,.08)" } as object,
  albl: { fontSize: 11, color: "rgba(255,255,255,.7)" },
  endBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center" } as object,
  inkp: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 90, backgroundColor: "rgba(10,10,12,.96)", alignItems: "center", paddingTop: 90, paddingHorizontal: 28, paddingBottom: 60 } as object,
  hide: { paddingVertical: 12, paddingHorizontal: 34, borderRadius: 999, backgroundColor: "rgba(255,255,255,.14)" } as object,
  thdr: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 60, paddingHorizontal: 16, paddingBottom: 10 } as object,
  pp: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center" } as object,
});
