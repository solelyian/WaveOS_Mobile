// StoreApp.tsx — Nyne Store : Today/Apps/Games/Search, catalogue,
// GET -> progression -> OPEN (installe = icône springboard + Spotlight).
import React from "react";
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet } from "react-native";
import { Icon } from "../Icon";
import type { IconName } from "../../core/lucide";
import { GlassHeader, FloatingTabBar, SearchPill } from "./ui";
import { useAccent } from "../theme";
import { EXTRA_APPS, INSTALLED, appMeta } from "../../apps/registry";
import type { AppId } from "../../system/state";
import { host } from "../host";
import { domOf } from "../fx";

interface Entry { id?: AppId; name: string; cat: string; desc: string; rating: string; color: string; icon: IconName }
const CATALOG: Entry[] = [
  ...EXTRA_APPS.map((a) => ({
    id: a.id, name: a.name, cat: a.id === "arcade" ? "Games" : a.id === "notes" ? "Productivity" : "Utilities",
    desc: a.id === "notes" ? "Capture ideas in a flash — synced, searchable, always with you."
      : a.id === "files" ? "All your documents, neatly organized. Browse, preview, done."
      : a.id === "clock" ? "World clocks, stopwatch and a gentle alarm — pixel-perfect."
      : "A pocket arcade. Ripple — chase the light, beat your best streak.",
    rating: "4.9", color: a.color, icon: a.icon,
  })),
  { name: "Wave Racer", cat: "Games", desc: "Anti-gravity racing on the ribbon roads of WaveOS.", rating: "—", color: "linear-gradient(135deg,#f472b6,#e11d48)", icon: "navigation" },
  { name: "Nyne Quest", cat: "Games", desc: "A hand-painted adventure in the Nyne universe.", rating: "—", color: "linear-gradient(135deg,#34d399,#059669)", icon: "compass" },
  { name: "Pulse", cat: "Health", desc: "Mindful minutes, streaks and breathing sessions.", rating: "—", color: "linear-gradient(135deg,#fb923c,#ea580c)", icon: "heart" },
];
const FEATURED: { kicker: string; title: string; sub: string; entry: Entry; grad: string }[] = [
  { kicker: "APP OF THE DAY", title: "Notes", sub: "Your ideas, one tap away", entry: CATALOG[0], grad: "linear-gradient(135deg,#fde047,#f59e0b)" },
  { kicker: "NOW PLAYING", title: "Arcade", sub: "Ripple — a tiny game, dangerously replayable", entry: CATALOG[3], grad: "linear-gradient(135deg,#818cf8,#6d28d9)" },
];

const installs: Record<string, number> = {}; // id -> progress 0..1 during install
function Grad({ color, style, children }: { color: string; style?: object; children?: React.ReactNode }) {
  const r = React.useRef<View>(null);
  React.useEffect(() => { const el = domOf(r); if (el) el.style.background = color; }, [color]);
  return <View ref={r} style={style}>{children}</View>;
}

export function StoreApp() {
  const ac = useAccent();
  const [tab, setTab] = React.useState("today");
  const [detail, setDetail] = React.useState<Entry | null>(null);
  const [q, setQ] = React.useState("");
  const [, bump] = React.useReducer((x: number) => x + 1, 0);

  const install = (e: Entry) => {
    if (!e.id) return;
    if (INSTALLED.has(e.id)) { host.openApp(e.id); return; }
    const t0 = performance.now();
    const step = () => {
      const p = Math.min(1, (performance.now() - t0) / 1300);
      installs[e.id!] = p;
      bump();
      if (p >= 1) { host.installApp(e.id!); delete installs[e.id!]; bump(); }
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const GetBtn = ({ e, big }: { e: Entry; big?: boolean }) => {
    const installed = !!e.id && INSTALLED.has(e.id);
    const busy = !!e.id && installs[e.id] !== undefined;
    return (
      <Pressable disabled={!e.id} onPress={(ev) => { (ev as unknown as { stopPropagation: () => void }).stopPropagation?.(); install(e); }}
        style={[st.get, big && st.getBig, !e.id && { opacity: 0.55 }, busy && st.getBusy]}>
        {busy ? (
          <View style={st.prog}><View style={[st.progFill, { transform: [{ scaleX: installs[e.id!] }], backgroundColor: ac }]} /></View>
        ) : (
          <Text style={{ fontSize: big ? 15 : 13, fontWeight: "700", color: ac }}>
            {!e.id ? "SOON" : installed ? "OPEN" : "GET"}
          </Text>
        )}
      </Pressable>
    );
  };

  const Row = ({ e }: { e: Entry }) => (
    <Pressable style={st.row} onPress={() => setDetail(e)}>
      <Grad color={e.color} style={st.tile}>
        <Icon n={e.icon} size={28} color="#fff" />
      </Grad>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#111" }}>{e.name}</Text>
        <Text style={{ fontSize: 12, color: "#9ca3af", fontWeight: "500" }}>{e.cat}</Text>
      </View>
      <GetBtn e={e} />
    </Pressable>
  );

  const sectionTitle = (t: string, to: string) => (
    <View style={st.secRow}>
      <Text style={{ fontSize: 20, fontWeight: "800", color: "#111" }}>{t}</Text>
      <Pressable onPress={() => setTab(to)}><Text style={{ fontSize: 13, fontWeight: "600", color: "#3b82f6" }}>See All</Text></Pressable>
    </View>
  );
  const featuredCard = (f: typeof FEATURED[number]) => (
    <Pressable key={f.title} onPress={() => setDetail(f.entry)}>
      <Grad color={f.grad} style={st.featured}>
        <View style={st.fIcon}><Icon n={f.entry.icon} size={96} color="rgba(255,255,255,.35)" /></View>
        <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1.2, color: "rgba(255,255,255,.85)" }}>{f.kicker}</Text>
        <Text style={{ fontSize: 26, fontWeight: "800", color: "#fff", marginVertical: 2 }}>{f.title}</Text>
        <Text style={{ fontSize: 14, fontWeight: "500", color: "rgba(255,255,255,.9)" }}>{f.sub}</Text>
      </Grad>
    </Pressable>
  );

  const searchRows = CATALOG.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()) || c.cat.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f2f7" }}>
      <GlassHeader title="Nyne Store" large />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 112 }} nativeID="app-scroll">
        {tab === "today" && (
          <>
            {FEATURED.map(featuredCard)}
            {sectionTitle("Must-Have Apps", "apps")}
            <View style={st.card}>{CATALOG.filter((c) => c.id && c.id !== "arcade").map((e) => <Row key={e.name} e={e} />)}</View>
          </>
        )}
        {tab === "apps" && (
          <>
            {sectionTitle("Top Free Apps", "apps")}
            <View style={st.card}>{CATALOG.filter((c) => c.cat !== "Games").map((e) => <Row key={e.name} e={e} />)}</View>
          </>
        )}
        {tab === "games" && (
          <>
            {featuredCard(FEATURED[1])}
            {sectionTitle("New Games", "games")}
            <View style={st.card}>{CATALOG.filter((c) => c.cat === "Games").map((e) => <Row key={e.name} e={e} />)}</View>
          </>
        )}
        {tab === "search" && (
          <>
            <SearchPill value={q} onChange={setQ} placeholder="Games, apps, stories…" />
            <View style={[st.card, { marginTop: 12 }]}>
              {searchRows.length ? searchRows.map((e) => <Row key={e.name} e={e} />) :
                <Text style={{ padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 14, fontWeight: "500" }}>No Results</Text>}
            </View>
          </>
        )}
      </ScrollView>
      <FloatingTabBar active={tab} onTab={setTab} tabs={[
        { id: "today", icon: "newspaper", label: "Today" },
        { id: "games", icon: "rocket", label: "Games" },
        { id: "apps", icon: "layoutGrid", label: "Apps" },
        { id: "search", icon: "search", label: "Search" },
      ]} />
      {detail && <Detail e={detail} onClose={() => setDetail(null)} GetBtn={GetBtn} />}
    </View>
  );
}

function Detail({ e, onClose, GetBtn }: { e: Entry; onClose: () => void; GetBtn: (p: { e: Entry; big?: boolean }) => React.ReactElement }) {
  const m = e.id ? appMeta(e.id) : undefined;
  const ref = React.useRef<View>(null);
  React.useEffect(() => {
    const el = domOf(ref);
    if (el) {
      el.style.transition = "transform .22s cubic-bezier(.2,.9,.3,1), opacity .22s";
      el.style.transform = "translateY(60px)"; el.style.opacity = "0";
      requestAnimationFrame(() => { el.style.transform = "translateY(0px)"; el.style.opacity = "1"; });
    }
  }, []);
  const bg = (m?.color ?? e.color);
  return (
    <View ref={ref} style={st.detail}>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingTop: 16, paddingHorizontal: 20 }}>
        <Pressable style={st.close} onPress={onClose}><Icon n="x" size={16} color="#111" /></Pressable>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }} nativeID="app-scroll">
        <View style={{ flexDirection: "row", gap: 16, alignItems: "center", marginBottom: 16 }}>
          <Grad color={bg} style={st.tileLg}>
            <Icon n={(m?.icon ?? e.icon)} size={42} color="#fff" />
          </Grad>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#111" }}>{e.name}</Text>
            <Text style={{ fontSize: 13, color: "#6b7280", fontWeight: "500" }}>{e.cat}</Text>
            <View style={{ flexDirection: "row", gap: 2, marginTop: 4, alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map((i) => <Icon key={i} n="star" size={12} color="#f59e0b" />)}
              <Text style={{ fontSize: 12, color: "#9ca3af", marginLeft: 6, fontWeight: "600" }}>{e.rating}</Text>
            </View>
          </View>
        </View>
        <GetBtn e={e} big />
        <View style={{ height: 1, backgroundColor: "#e5e7eb", marginVertical: 20 }} />
        <Text style={{ fontSize: 15, lineHeight: 23, color: "#374151" }}>{e.desc}</Text>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#111", marginTop: 20, marginBottom: 10 }}>Preview</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {[1, 2, 3].map((i) => <Grad key={i} color={bg} style={st.preview} />)}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 24, paddingVertical: 4, paddingHorizontal: 16 } as object,
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 10 } as object,
  tile: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", flexShrink: 0 } as object,
  tileLg: { width: 84, height: 84, borderRadius: 20, alignItems: "center", justifyContent: "center", flexShrink: 0 } as object,
  get: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 999, backgroundColor: "rgba(0,0,0,.06)", minWidth: 64, alignItems: "center", height: 32, justifyContent: "center" } as object,
  getBig: { paddingVertical: 12, borderRadius: 16, width: "100%" as unknown as number, height: 48 } as object,
  getBusy: { backgroundColor: "rgba(0,0,0,.08)" } as object,
  prog: { width: "80%" as unknown as number, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,.1)", overflow: "hidden" } as object,
  progFill: { height: 4, backgroundColor: "#2563eb", borderRadius: 2 } as object,
  secRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 20, marginBottom: 12, marginHorizontal: 4 } as object,
  featured: {
    borderRadius: 28, overflow: "hidden", padding: 24, minHeight: 180, justifyContent: "flex-end",
    marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,.25)",
  } as object,
  fIcon: { position: "absolute", top: 20, right: 20 } as object,
  detail: { position: "absolute", top: 40, left: 0, right: 0, bottom: 0, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, zIndex: 50 } as object,
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,.06)", alignItems: "center", justifyContent: "center" } as object,
  preview: { width: 150, height: 260, borderRadius: 20, opacity: 0.85, borderWidth: 1, borderColor: "rgba(0,0,0,.05)" } as object,
});
