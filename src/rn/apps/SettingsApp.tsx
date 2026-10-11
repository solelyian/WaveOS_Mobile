// SettingsApp.tsx — Réglages RN : page racine + sous-pages complètes
// (Wi-Fi, Bluetooth, Cellular, Hotspot, Notifications, Sons, Zen, Général
//  (+About/Update/Nyne Share/Storage), Display, Wallpaper, Battery,
//  Nyne Time, Privacy, Nyne Store) — port 1:1 de main.
import React from "react";
import { View, Text, Pressable, Image, ScrollView, StyleSheet } from "react-native";
import { Icon } from "../Icon";
import type { IconName } from "../../core/lucide";
import { sys, set } from "../../system/state";
import { useSys } from "../sys";
import { toast } from "../host";
import { GlassHeader, SearchPill, SetRow, ToggleRow, Group, Cap, Bar, PageSlide, HSlider } from "./ui";

const NETWORKS = ["Home_5G", "Nyne Guest", "CoffeeShop WiFi", "Airport_Free"];
const BT_DEVICES = ["AirPods Pro", "MacBook Pro 16″", "Nyne Watch", "MX Master 3S"];
const WALLPAPERS = [
  "/img/wallpaper.jpg", "/img/memory.jpg", "/img/photos/ph-3.jpg",
  "/img/photos/ph-7.jpg", "/img/photos/ph-11.jpg", "/img/photos/ph-18.jpg",
];
let wifiNet = "Home_5G";
const btConnected = new Set<string>(["AirPods Pro", "MacBook Pro 16″"]);
let wallpaper = WALLPAPERS[0];

type PageId =
  | "wifi" | "bt" | "cellular" | "hotspot" | "notif" | "sound" | "focus"
  | "general" | "about" | "update" | "share" | "storage" | "display"
  | "wallpaper" | "battery" | "screentime" | "privacy" | "store";

export function SettingsApp() {
  const s = useSys();
  const [q, setQ] = React.useState("");
  const [stack, setStack] = React.useState<PageId[]>([]);
  const push = (p: PageId) => setStack((v) => [...v, p]);
  const pop = () => setStack((v) => v.slice(0, -1));
  const [, bump] = React.useReducer((x: number) => x + 1, 0);

  const needle = q.trim().toLowerCase();
  const show = (label: string) => !needle || label.includes(needle);

  /* ---------------- sous-pages ---------------- */

  const pages: Record<PageId, { title: string; body: React.ReactNode }> = {
    wifi: {
      title: "Wi-Fi",
      body: <>
        <Group><ToggleRow icon="wifi" bg="#2563eb" label="Wi-Fi" on={s.wifi} onFlip={(v) => { set("wifi", v); bump(); }} /></Group>
        <Cap>Known networks — tap to join</Cap>
        <Group>{NETWORKS.map((n) => (
          <SetRow key={n} icon="wifi" bg={n === wifiNet && s.wifi ? "#2563eb" : "#9ca3af"} label={n}
            end={n === wifiNet && s.wifi ? <Icon n="check" size={18} color="#2563eb" /> : undefined}
            onPress={() => {
              if (!s.wifi) { toast("Turn Wi-Fi on first"); return; }
              if (n === wifiNet) return;
              wifiNet = n; bump(); toast(`Joined “${n}”`);
            }} />
        ))}</Group>
      </>,
    },
    bt: {
      title: "Bluetooth",
      body: <>
        <Group><ToggleRow icon="bluetooth" bg="#2563eb" label="Bluetooth" on={s.bluetooth} onFlip={(v) => { set("bluetooth", v); bump(); }} /></Group>
        <Cap>My devices — tap to connect</Cap>
        <Group>{BT_DEVICES.map((n) => {
          const on = btConnected.has(n) && s.bluetooth;
          return <SetRow key={n} icon="bluetooth" bg={on ? "#2563eb" : "#9ca3af"} label={n}
            value={on ? "Connected" : "Not Connected"}
            onPress={() => {
              if (!s.bluetooth) { toast("Turn Bluetooth on first"); return; }
              const was = btConnected.has(n);
              if (was) btConnected.delete(n); else btConnected.add(n);
              bump(); toast(was ? `Disconnected “${n}”` : `Connected to “${n}”`);
            }} />;
        })}</Group>
      </>,
    },
    cellular: {
      title: "Cellular",
      body: <>
        <Group><ToggleRow icon="signal" bg="#22c55e" label="Cellular Data" on={s.cellular} onFlip={(v) => set("cellular", v)} /></Group>
        <Cap>Data usage this month</Cap>
        <Group>
          <View style={st.blockRow}>
            <View style={st.spread}><Text style={st.lbl}>Wave One 5G</Text><Text style={st.val}>4.2 / 10 GB</Text></View>
            <Bar frac={0.42} color="#22c55e" />
          </View>
          <ToggleRow icon="download" bg="#0ea5e9" label="Data roaming" on={false} onFlip={() => {}} />
        </Group>
      </>,
    },
    hotspot: {
      title: "Personal Hotspot",
      body: <HotspotPage />,
    },
    notif: {
      title: "Notifications",
      body: <>
        <Cap>Notification style</Cap>
        <Group>
          {([["Messages", "#22c55e", "messageCircle"], ["Mail", "#3b82f6", "mail"], ["Calendar", "#ef4444", "calendar"], ["Nyne Store", "#0ea5e9", "store"]] as [string, string, IconName][]).map(([n, bg, ic]) => (
            <ToggleRow key={n} icon={ic} bg={bg} label={n} on={n !== "Nyne Store"} onFlip={() => {}} />
          ))}
        </Group>
        <Group>
          <ToggleRow icon="bell" bg="#f59e0b" label="Scheduled summary" on={false} onFlip={() => {}} />
          <ToggleRow icon="moonStar" bg="#6366f1" label="Show on lock screen" on onFlip={() => {}} />
        </Group>
      </>,
    },
    sound: {
      title: "Sounds & Haptics",
      body: <>
        <Cap>Ringer and alerts</Cap>
        <Group>
          <View style={st.row}>
            <View style={[st.ic, { backgroundColor: "#f43f5e" }]}><Icon n="volume2" size={17} color="#fff" /></View>
            <View style={{ flex: 1 }}><HSlider value={s.volume} onChange={(v) => set("volume", v)} /></View>
          </View>
        </Group>
        <Cap>Ringtone — tap to pick</Cap>
        <RingtoneGroup />
        <Group>
          <ToggleRow icon="slidersHorizontal" bg="#6b7280" label="Haptic feedback" on onFlip={() => {}} />
          <ToggleRow icon="messageCircle" bg="#f59e0b" label="Keyboard haptics" on onFlip={() => {}} />
        </Group>
      </>,
    },
    focus: {
      title: "Zen Mode",
      body: <>
        <Group><ToggleRow icon="moon" bg="#6366f1" label="Do Not Disturb" on={false} onFlip={() => {}} /></Group>
        <Cap>Schedule</Cap>
        <Group>
          <SetRow icon="clock" bg="#0ea5e9" label="Sleep" value="22:30 – 07:00" />
          <SetRow icon="clock" bg="#22c55e" label="Work" value="09:00 – 12:00" />
        </Group>
        <Group><SetRow icon="bell" bg="#f59e0b" label="Allowed notifications" value="People" /></Group>
      </>,
    },
    general: {
      title: "General",
      body: (
        <Group>
          <SetRow icon="info" bg="#0ea5e9" label="About" onPress={() => push("about")} />
          <SetRow icon="download" bg="#2563eb" label="Software Update" value="2.1 available" onPress={() => push("update")} />
          <SetRow icon="share" bg="#22c55e" label="Nyne Share" value="Contacts Only" onPress={() => push("share")} />
          <SetRow icon="disc" bg="#f59e0b" label="Storage" value="57.6 GB used" onPress={() => push("storage")} />
          <SetRow icon="globe" bg="#6b7280" label="Language & Region" value="English (US)" />
          <SetRow icon="calendar" bg="#ef4444" label="Date & Time" value="Automatic" />
        </Group>
      ),
    },
    about: {
      title: "About",
      body: (
        <Group>
          <SetRow icon="phone" bg="#22c55e" label="Name" value="Wave Phone" />
          <SetRow icon="settings" bg="#6b7280" label="Model" value="WaveOS Prototype" />
          <SetRow icon="info" bg="#0ea5e9" label="Version" value="WaveOS 2.0 (26A1)" />
          <SetRow icon="disc" bg="#f59e0b" label="Capacity" value="256 GB" />
          <SetRow icon="cloud" bg="#8b5cf6" label="Available" value="198.4 GB" />
        </Group>
      ),
    },
    update: { title: "Software Update", body: <UpdatePage /> },
    share: { title: "Nyne Share", body: <SharePage /> },
    storage: {
      title: "Storage",
      body: <StoragePage />,
    },
    display: {
      title: "Display & Brightness",
      body: <DisplayPage />,
    },
    wallpaper: {
      title: "Wallpaper",
      body: <WallpaperPage bump={bump} />,
    },
    battery: {
      title: "Battery",
      body: <>
        <Group>
          <View style={st.blockRow}>
            <View style={[st.spread, { alignItems: "baseline", marginBottom: 8 }]}>
              <Text style={{ fontSize: 34, fontWeight: "800", letterSpacing: -0.5 }}>84</Text>
              <Text style={{ fontSize: 15, color: "#9ca3af", fontWeight: "600" }}>%</Text>
            </View>
            <Bar frac={0.84} color="#22c55e" />
          </View>
        </Group>
        <Group>
          <ToggleRow icon="battery" bg="#f59e0b" label="Low Power Mode" on={false} onFlip={() => {}} />
          <SetRow icon="battery" bg="#22c55e" label="Battery Health" value="98%" />
        </Group>
        <Cap>Usage by app — last 24 h</Cap>
        <Group>
          {[["Nyne Store", 0.34], ["Music", 0.22], ["Surf", 0.18], ["Messages", 0.12], ["Photos", 0.08]].map(([n, f]) => (
            <View key={n as string} style={st.blockRow}>
              <View style={st.spread}><Text style={st.lbl}>{n}</Text><Text style={st.val}>{Math.round((f as number) * 100)}%</Text></View>
              <Bar frac={f as number} color="#22c55e" h={6} />
            </View>
          ))}
        </Group>
      </>,
    },
    screentime: {
      title: "Nyne Time",
      body: <>
        <Group>
          <View style={st.blockRow}>
            <Text style={{ fontSize: 12, color: "#9ca3af", fontWeight: "600", marginBottom: 4 }}>Daily average</Text>
            <Text style={{ fontSize: 34, fontWeight: "800", letterSpacing: -0.5 }}>4h 12m</Text>
          </View>
        </Group>
        <Cap>Most used</Cap>
        <Group>
          {([["Instagram", 1.7, "#e1306c"], ["Surf", 0.97, "#2563eb"], ["Messages", 0.68, "#22c55e"], ["Music", 0.55, "#f43f5e"], ["Maps", 0.3, "#f59e0b"]] as [string, number, string][]).map(([n, hr, c]) => (
            <View key={n} style={st.blockRow}>
              <View style={st.spread}>
                <Text style={st.lbl}>{n}</Text>
                <Text style={st.val}>{Math.floor(hr)}h {String(Math.round((hr % 1) * 60)).padStart(2, "0")}m</Text>
              </View>
              <Bar frac={hr / 2} color={c} h={6} />
            </View>
          ))}
        </Group>
        <Group>
          <SetRow icon="moon" bg="#6366f1" label="Downtime" value="22:00 – 07:00" />
          <ToggleRow icon="clock" bg="#22c55e" label="App Limits" on onFlip={() => {}} />
        </Group>
      </>,
    },
    privacy: {
      title: "Privacy & Security",
      body: <>
        <Cap>Permissions</Cap>
        <Group>
          <SetRow icon="mapPin" bg="#2563eb" label="Location Services" value="While Using" />
          <SetRow icon="image" bg="#f59e0b" label="Photos" value="Selected Photos" />
          <SetRow icon="mic" bg="#ef4444" label="Microphone" value="2 apps" />
          <SetRow icon="camera" bg="#22c55e" label="Camera" value="3 apps" />
          <SetRow icon="bluetooth" bg="#8b5cf6" label="Bluetooth" value="4 apps" />
        </Group>
        <Cap>Tracking</Cap>
        <Group><ToggleRow icon="eye" bg="#6b7280" label="Allow apps to request tracking" on={false} onFlip={() => {}} /></Group>
        <Cap>Security</Cap>
        <Group><ToggleRow icon="lock" bg="#2563eb" label="Lockdown Mode" on={false} onFlip={() => {}} /></Group>
      </>,
    },
    store: {
      title: "Nyne Store",
      body: <>
        <Cap>Automatic downloads</Cap>
        <Group>
          <ToggleRow icon="download" bg="#0ea5e9" label="App Updates" on onFlip={() => {}} />
          <ToggleRow icon="store" bg="#8b5cf6" label="New Apps" on onFlip={() => {}} />
        </Group>
        <Cap>Cellular data</Cap>
        <Group><ToggleRow icon="signal" bg="#22c55e" label="Download over cellular" on={false} onFlip={() => {}} /></Group>
        <Group><SetRow icon="user" bg="#6b7280" label="Nyne ID" value="john@nyne.dev" /></Group>
      </>,
    },
  };

  /* ---------------- page racine ---------------- */

  return (
    <View style={st.root}>
      <GlassHeader title="Settings" large />
      <SearchPill value={q} onChange={setQ} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }} nativeID="app-scroll">
        {show("john account profile about") && (
          <Pressable style={st.profile} onPress={() => push("about")}>
            <Image source={{ uri: "/img/contact-john.jpg" }} style={st.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "700" }}>John Doe</Text>
              <Text style={{ fontSize: 12, color: "#9ca3af" }}>Wave Account, Nyne Cloud+, Media & Purchases</Text>
            </View>
            <Icon n="chevronRight" size={16} color="#c7c7cc" />
          </Pressable>
        )}
        {show("airplane wifi cellular bluetooth hotspot") && (
          <Group>
            <ToggleRow icon="plane" bg="#f97316" label="Airplane Mode" on={s.airplane} onFlip={(v) => set("airplane", v)} />
            <SetRow icon="wifi" bg="#2563eb" label="Wi-Fi" value={wifiNet} onPress={() => push("wifi")} />
            <SetRow icon="signal" bg="#22c55e" label="Cellular" onPress={() => push("cellular")} />
            <SetRow icon="bluetooth" bg="#2563eb" label="Bluetooth" value={s.bluetooth ? "On" : "Off"} onPress={() => push("bt")} />
            <SetRow icon="link" bg="#22c55e" label="Personal Hotspot" onPress={() => push("hotspot")} />
          </Group>
        )}
        {show("notifications sounds zen mode nyne time") && (
          <Group>
            <SetRow icon="bell" bg="#ef4444" label="Notifications" onPress={() => push("notif")} />
            <SetRow icon="volume2" bg="#f43f5e" label="Sounds & Haptics" onPress={() => push("sound")} />
            <SetRow icon="moon" bg="#6366f1" label="Zen Mode" onPress={() => push("focus")} />
            <SetRow icon="clock" bg="#22c55e" label="Nyne Time" value="4h 12m" onPress={() => push("screentime")} />
          </Group>
        )}
        {show("general display wallpaper battery privacy") && (
          <Group>
            <SetRow icon="settings" bg="#6b7280" label="General" onPress={() => push("general")} />
            <SetRow icon="sun" bg="#2563eb" label="Display & Brightness" value="Light" onPress={() => push("display")} />
            <SetRow icon="image" bg="#0ea5e9" label="Wallpaper" onPress={() => push("wallpaper")} />
            <SetRow icon="battery" bg="#22c55e" label="Battery" value="84%" onPress={() => push("battery")} />
            <SetRow icon="shield" bg="#2563eb" label="Privacy & Security" onPress={() => push("privacy")} />
          </Group>
        )}
        {show("nyne store updates") && (
          <Group>
            <SetRow icon="store" bg="#0ea5e9" label="Nyne Store" value="Automatic updates" onPress={() => push("store")} />
          </Group>
        )}
      </ScrollView>
      {stack.map((p, i) => (
        <PageSlide key={`${p}-${i}`} title={pages[p].title} onClose={pop}>
          {pages[p].body}
        </PageSlide>
      ))}
    </View>
  );
}

/* ---------------- sous-composants de pages ---------------- */

function HotspotPage() {
  const [allow, setAllow] = React.useState(true);
  return <>
    <Group><ToggleRow icon="link" bg="#22c55e" label="Allow Others to Join" on={allow}
      onFlip={(v) => { setAllow(v); toast(v ? "Hotspot on — 1 device nearby" : "Hotspot off"); }} /></Group>
    <Group>
      <SetRow icon="lock" bg="#6b7280" label="Wi-Fi Password" value="wave-8842" />
      <SetRow icon="wifi" bg="#2563eb" label="Network name" value="Wave Phone" />
    </Group>
    <Cap>Compatibility</Cap>
    <Group><ToggleRow icon="signal" bg="#f59e0b" label="Maximize Compatibility" on={false} onFlip={() => {}} /></Group>
  </>;
}

function RingtoneGroup() {
  const tones = ["Ripples", "Aurora", "Zen Bell", "Nova"];
  const [ring, setRing] = React.useState(0);
  return (
    <Group>
      {tones.map((r, i) => (
        <SetRow key={r} icon="music" bg={i === ring ? "#22c55e" : "#9ca3af"} label={r}
          end={i === ring ? <Icon n="check" size={18} color="#22c55e" /> : undefined}
          onPress={() => { setRing(i); toast(`Ringtone “${r}”`); }} />
      ))}
    </Group>
  );
}

function UpdatePage() {
  const [pct, setPct] = React.useState(0);
  const [state, setStateUI] = React.useState<"idle" | "dl" | "done">("idle");
  const start = () => {
    setStateUI("dl");
    let p = 0;
    const iv = setInterval(() => {
      p = Math.min(100, p + 4 + Math.random() * 7);
      setPct(Math.round(p));
      if (p >= 100) { clearInterval(iv); setStateUI("done"); toast("WaveOS 2.1 downloaded"); }
    }, 180);
  };
  return <>
    <Group>
      <View style={st.blockRow}>
        <View style={st.spread}><Text style={st.lbl}>WaveOS 2.1</Text><Text style={st.val}>1.8 GB</Text></View>
        <Text style={{ fontSize: 13, color: "#6b7280", lineHeight: 19 }}>
          New glass shaders, faster app morphs and stability improvements.
        </Text>
      </View>
    </Group>
    <Pressable
      style={[st.dlBtn, state === "dl" && { opacity: 0.5 }, state === "done" && { backgroundColor: "#22c55e", opacity: 1 }]}
      disabled={state === "dl"} onPress={start}>
      <Text style={st.dlTxt}>{state === "idle" ? "Download and Install" : state === "dl" ? "Downloading…" : "Update ready — WaveOS 2.1"}</Text>
    </Pressable>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ flex: 1 }}><Bar frac={pct / 100} color="#2563eb" h={6} /></View>
      <Text style={st.val}>{pct}%</Text>
    </View>
  </>;
}

function SharePage() {
  const ads = ["Receiving Off", "Contacts Only", "Everyone"];
  const [airdrop, setAirdrop] = React.useState(1);
  return (
    <Group>
      {ads.map((n, i) => (
        <SetRow key={n} icon="share" bg={i === airdrop ? "#2563eb" : "#9ca3af"} label={n}
          end={i === airdrop ? <Icon n="check" size={18} color="#2563eb" /> : undefined}
          onPress={() => setAirdrop(i)} />
      ))}
    </Group>
  );
}

function StoragePage() {
  const segs: [string, number, string][] = [["System", 0.22, "#6b7280"], ["Apps", 0.31, "#2563eb"], ["Photos", 0.14, "#f59e0b"], ["Media", 0.08, "#ef4444"], ["Other", 0.05, "#9ca3af"]];
  return <>
    <Group>
      <View style={st.blockRow}>
        <View style={[st.spread, { marginBottom: 10 }]}>
          <Text style={st.lbl}>57.6 GB of 256 GB used</Text><Text style={st.val} />
        </View>
        <View style={{ flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden", gap: 2 }}>
          {segs.map(([n, f, c]) => <View key={n} style={{ width: `${f * 100}%` as unknown as number, backgroundColor: c }} />)}
        </View>
      </View>
    </Group>
    <Cap>Categories</Cap>
    <Group>{segs.map(([n, f, c]) => <SetRow key={n} icon="disc" bg={c} label={n} value={`${(f * 256).toFixed(0)} GB`} />)}</Group>
  </>;
}

function DisplayPage() {
  const s = useSys();
  const modes = ["Light", "Dark", "Automatic"];
  const icons: IconName[] = ["sun", "moon", "clock"];
  const night = () => { const h = new Date().getHours(); return h < 7 || h >= 19; };
  const mode = s.darkMode ? 1 : 0;
  return <>
    <Cap>Brightness — mirrors Control Center</Cap>
    <Group>
      <View style={st.row}>
        <View style={[st.ic, { backgroundColor: "#f59e0b" }]}><Icon n="sun" size={17} color="#fff" /></View>
        <View style={{ flex: 1 }}><HSlider value={s.brightness} onChange={(v) => set("brightness", v)} /></View>
      </View>
    </Group>
    <Cap>Appearance</Cap>
    <Group>
      {modes.map((m, i) => (
        <SetRow key={m} icon={icons[i]} bg={i === mode ? "#2563eb" : "#9ca3af"} label={m}
          end={i === mode ? <Icon n="check" size={18} color="#2563eb" /> : undefined}
          onPress={() => set("darkMode", i === 1 || (i === 2 && night()))} />
      ))}
    </Group>
    <Group>
      <ToggleRow icon="eye" bg="#8b5cf6" label="True Tone" on onFlip={() => {}} />
      <SetRow icon="moonStar" bg="#6366f1" label="Night Shift" value="Sunset – 07:00" />
    </Group>
  </>;
}

function WallpaperPage({ bump }: { bump: () => void }) {
  return <>
    <Cap>Pick a wallpaper — applied to the home screen</Cap>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {WALLPAPERS.map((w) => (
        <Pressable key={w} onPress={() => {
          wallpaper = w;
          const wp = document.getElementById("wp");
          if (wp) wp.style.backgroundImage = `url(${w})`;
          bump(); toast("Wallpaper applied");
        }} style={[st.wp, { borderColor: w === wallpaper ? "#2563eb" : "#e5e7eb", borderWidth: w === wallpaper ? 3 : 1 }]}>
          <Image source={{ uri: w }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          {w === wallpaper && (
            <View style={st.wpCheck}><Icon n="check" size={12} color="#fff" /></View>
          )}
        </Pressable>
      ))}
    </View>
  </>;
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f4f4f5" },
  profile: {
    flexDirection: "row", alignItems: "center", gap: 14, padding: 16, marginBottom: 14,
    backgroundColor: "#fff", borderRadius: 16,
  } as object,
  avatar: { width: 56, height: 56, borderRadius: 28 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, paddingHorizontal: 14, backgroundColor: "#fff" } as object,
  blockRow: { paddingVertical: 12, paddingHorizontal: 14, backgroundColor: "#fff" } as object,
  spread: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 6 } as object,
  lbl: { fontSize: 15, fontWeight: "500", color: "#111" },
  val: { fontSize: 14, color: "#9ca3af" },
  ic: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  dlBtn: { backgroundColor: "#2563eb", borderRadius: 16, paddingVertical: 14, alignItems: "center", marginBottom: 14 } as object,
  dlTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
  wp: { width: "31%", aspectRatio: 9 / 16, borderRadius: 14, overflow: "hidden" } as object,
  wpCheck: {
    position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center",
  } as object,
});
