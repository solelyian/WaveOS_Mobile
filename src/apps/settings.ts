// settings.ts — Réglages vivants : recherche, sous-pages complètes (Wi-Fi avec
// connexion réelle, Bluetooth, Notifications, Sons, Concentration, Général,
// Luminosité câblée sur le Control Center, Fond d'écran appliqué, Batterie,
// Temps d'écran, Confidentialité, App Store, Hotspot).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import type { IconName } from "../core/lucide";
import { sys, set, onChange } from "../system/state";
import { GlassHeader, img, pane, setRow, switchEl, toast } from "./ui";

const NETWORKS = ["Home_5G", "Nyne Guest", "CoffeeShop WiFi", "Airport_Free"];
let wifiNet = "Home_5G";
const btConnected = new Set<string>(["AirPods Pro", "MacBook Pro 16″"]);
const BT_DEVICES = ["AirPods Pro", "MacBook Pro 16″", "Nyne Watch", "MX Master 3S"];

const WALLPAPERS = [
  "/img/wallpaper.jpg", "/img/memory.jpg", "/img/photos/ph-3.jpg",
  "/img/photos/ph-7.jpg", "/img/photos/ph-11.jpg", "/img/photos/ph-18.jpg",
];
let wallpaper = WALLPAPERS[0];

function page(host: HTMLElement, title: string, build: (scroll: HTMLElement) => void) {
  pane(host, (close) => {
    const scroll = h("div", { class: "no-sb", style: { flex: "1", overflowY: "auto", padding: "0 16px 40px" } });
    build(scroll);
    return h("div", { class: "pg", style: { background: "#f4f4f5", height: "100%", display: "flex", flexDirection: "column" } },
      h("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "60px 16px 10px" } },
        h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: close }, svgIcon(I.chevronLeft, "", 18)),
        h("span", { style: { fontWeight: "700", fontSize: "17px" } }, title)),
      scroll);
  });
}

const grp = (...rows: HTMLElement[]) => h("div", { class: "set-group", style: { marginBottom: "14px" } }, ...rows);
const cap = (t: string) => h("div", { style: { fontSize: "12px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", margin: "4px 4px 6px" } }, t);

// barre horizontale de stat (Temps d'écran, Batterie, Stockage)
const bar = (frac: number, color: string, hgt = "8px") =>
  h("div", { style: { height: hgt, borderRadius: "4px", background: "rgba(0,0,0,.08)", overflow: "hidden" } },
    h("div", { style: { height: "100%", width: `${Math.round(frac * 100)}%`, borderRadius: "4px", background: color, transition: "width .8s cubic-bezier(.2,.7,.2,1)" } }));

export function SettingsApp() {
  const root = h("div", { class: "pg", style: { height: "100%", display: "flex", flexDirection: "column", background: "#f4f4f5" } });
  const scroll = h("div", { class: "app-scroll no-sb", style: { padding: "0 16px 60px" } });
  const groups: { label: string; el: HTMLElement }[] = [];
  const wifiVal = h("span", { class: "set-val" }, wifiNet);

  const wifiSub = () => page(root, "Wi-Fi", (s) => {
    const netList = h("div", { class: "set-group" });
    const draw = () => netList.replaceChildren(...NETWORKS.map((n) =>
      setRow("wifi", n === wifiNet && sys.wifi ? "#2563eb" : "#9ca3af", n, {
        end: n === wifiNet && sys.wifi ? svgIcon(I.check, "", 18) : undefined,
        onClick: () => {
          if (!sys.wifi) { toast(root, "Turn Wi-Fi on first"); return; }
          if (n === wifiNet) return;
          wifiNet = n; wifiVal.textContent = n; draw();
          toast(root, `Joined “${n}”`);
        },
      })));
    s.append(
      grp(h("div", { class: "set-row" }, h("div", { class: "set-ic", style: { background: "#2563eb" } }, svgIcon(I.wifi)),
        h("span", { class: "set-lbl" }, "Wi-Fi"), switchEl(sys.wifi, (v) => { set("wifi", v); draw(); }))),
      cap("Known networks — tap to join"),
      netList);
    draw();
  });

  const btSub = () => page(root, "Bluetooth", (s) => {
    const devList = h("div", { class: "set-group" });
    const draw = () => devList.replaceChildren(...BT_DEVICES.map((n) => {
      const on = btConnected.has(n) && sys.bluetooth;
      return setRow("bluetooth", on ? "#2563eb" : "#9ca3af", n, {
        value: on ? "Connected" : "Not Connected",
        onClick: () => {
          if (!sys.bluetooth) { toast(root, "Turn Bluetooth on first"); return; }
          const was = btConnected.has(n);
          was ? btConnected.delete(n) : btConnected.add(n);
          draw();
          toast(root, was ? `Disconnected “${n}”` : `Connected to “${n}”`);
        },
      });
    }));
    s.append(
      grp(h("div", { class: "set-row" }, h("div", { class: "set-ic", style: { background: "#2563eb" } }, svgIcon(I.bluetooth)),
        h("span", { class: "set-lbl" }, "Bluetooth"), switchEl(sys.bluetooth, (v) => { set("bluetooth", v); draw(); }))),
      cap("My devices — tap to connect"),
      devList);
    draw();
  });

  const cellularSub = () => page(root, "Cellular", (s) => {
    s.append(
      grp(h("div", { class: "set-row" }, h("div", { class: "set-ic", style: { background: "#22c55e" } }, svgIcon(I.signal)),
        h("span", { class: "set-lbl" }, "Cellular Data"), switchEl(sys.cellular, (v) => set("cellular", v)))),
      cap("Data usage this month"),
      grp(
        h("div", { class: "set-row", style: { display: "block" } },
          h("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "8px" } },
            h("span", { class: "set-lbl" }, "Wave One 5G"), h("span", { class: "set-val" }, "4.2 / 10 GB")),
          bar(0.42, "#22c55e")),
        setRow("download", "#0ea5e9", "Data roaming", { end: switchEl(false, () => {}) })));
  });

  const hotspotSub = () => page(root, "Personal Hotspot", (s) => {
    let allow = true;
    const row = h("div", { class: "set-row" }, h("div", { class: "set-ic", style: { background: "#22c55e" } }, svgIcon(I.link)),
      h("span", { class: "set-lbl" }, "Allow Others to Join"), switchEl(allow, (v) => { allow = v; toast(root, v ? "Hotspot on — 1 device nearby" : "Hotspot off"); }));
    s.append(
      grp(row),
      grp(setRow("lock", "#6b7280", "Wi-Fi Password", { value: "wave-8842" }),
          setRow("wifi", "#2563eb", "Network name", { value: "Wave Phone" })),
      cap("Compatibility"),
      grp(setRow("signal", "#f59e0b", "Maximize Compatibility", { end: switchEl(false, () => {}) })));
  });

  const notifSub = () => page(root, "Notifications", (s) => {
    s.append(cap("Notification style"),
      grp(...[["Messages", "#22c55e", "messageCircle"], ["Mail", "#3b82f6", "mail"], ["Calendar", "#ef4444", "calendar"], ["App Store", "#0ea5e9", "store"]].map(([n, bg, ic]) =>
        setRow(ic as IconName, bg as string, n as string, { end: switchEl(n !== "App Store", () => {}) }))),
      grp(setRow("bell", "#f59e0b", "Scheduled summary", { end: switchEl(false, () => {}) }),
          setRow("moonStar", "#6366f1", "Show on lock screen", { end: switchEl(true, () => {}) })));
  });

  const soundSub = () => page(root, "Sounds & Haptics", (s) => {
    const slider = h("input", { attrs: { type: "range", min: "0", max: "100", value: String(sys.volume) },
      style: { width: "100%", accentColor: "#2563eb" }, onInput: (e) => set("volume", +(e.target as HTMLInputElement).value) }) as HTMLInputElement;
    onChange((k) => { if (k === "volume") slider.value = String(sys.volume); });
    let ring = 0;
    const tones = ["Ripples", "Aurora", "Zen Bell", "Nova"];
    const toneGrp = h("div", { class: "set-group" });
    const drawTones = () => toneGrp.replaceChildren(...tones.map((r, i) =>
      setRow("music", i === ring ? "#22c55e" : "#9ca3af", r,
        { end: i === ring ? svgIcon(I.check, "", 18) : undefined, onClick: () => { ring = i; drawTones(); toast(root, `Ringtone “${r}”`); } })));
    s.append(
      cap("Ringer and alerts"),
      grp(h("div", { class: "set-row" }, h("div", { class: "set-ic", style: { background: "#f43f5e" } }, svgIcon(I.volume2)), h("div", { style: { flex: "1" } }, slider))),
      cap("Ringtone — tap to pick"),
      (drawTones(), toneGrp),
      grp(setRow("slidersHorizontal", "#6b7280", "Haptic feedback", { end: switchEl(true, () => {}) }),
          setRow("messageCircle", "#f59e0b", "Keyboard haptics", { end: switchEl(true, () => {}) })));
  });

  const focusSub = () => page(root, "Focus", (s) => {
    s.append(
      grp(h("div", { class: "set-row" }, h("div", { class: "set-ic", style: { background: "#6366f1" } }, svgIcon(I.moon)),
        h("span", { class: "set-lbl" }, "Do Not Disturb"), switchEl(false, () => {}))),
      cap("Schedule"),
      grp(setRow("clock", "#0ea5e9", "Sleep", { value: "22:30 – 07:00" }), setRow("clock", "#22c55e", "Work", { value: "09:00 – 12:00" })),
      grp(setRow("bell", "#f59e0b", "Allowed notifications", { value: "People" })));
  });

  const aboutSub = () => page(root, "About", (s) => {
    s.append(grp(
      setRow("phone", "#22c55e", "Name", { value: "Wave Phone" }),
      setRow("settings", "#6b7280", "Model", { value: "WaveOS Prototype" }),
      setRow("info", "#0ea5e9", "Version", { value: "WaveOS 2.0 (26A1)" }),
      setRow("disc", "#f59e0b", "Capacity", { value: "256 GB" }),
      setRow("cloud", "#8b5cf6", "Available", { value: "198.4 GB" })));
  });

  const updateSub = () => page(root, "Software Update", (s) => {
    const pct = h("span", { class: "set-val" }, "");
    const pfill = h("div", { style: { height: "100%", width: "0%", borderRadius: "4px", background: "#2563eb", transition: "width .5s" } });
    const btn = h("button", { class: "pressable", style: { width: "100%", padding: "14px", borderRadius: "16px", background: "#2563eb", color: "#fff", fontWeight: "700", fontSize: "15px" },
      onClick: (e) => {
        const b = e.currentTarget as HTMLButtonElement;
        b.style.opacity = ".5"; b.style.pointerEvents = "none"; b.textContent = "Downloading…";
        let p = 0;
        const iv = setInterval(() => {
          p = Math.min(100, p + 4 + Math.random() * 7);
          pfill.style.width = `${p}%`; pct.textContent = `${Math.round(p)}%`;
          if (p >= 100) { clearInterval(iv); b.textContent = "Update ready — WaveOS 2.1"; b.style.background = "#22c55e"; b.style.opacity = "1"; toast(root, "WaveOS 2.1 downloaded"); }
        }, 180);
      } }, "Download and Install");
    s.append(
      grp(h("div", { class: "set-row", style: { display: "block" } },
          h("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "8px" } },
            h("span", { class: "set-lbl" }, "WaveOS 2.1"), h("span", { class: "set-val" }, "1.8 GB")),
          h("div", { style: { fontSize: "13px", color: "#6b7280", lineHeight: "1.45" } }, "New glass shaders, faster app morphs and stability improvements."))),
      h("div", { style: { margin: "6px 0 14px" } }, btn),
      h("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
        h("div", { style: { flex: "1", height: "6px", borderRadius: "3px", background: "rgba(0,0,0,.08)", overflow: "hidden" } }, pfill), pct));
  });

  const generalSub = () => page(root, "General", (s) => {
    let airdrop = 1;
    const ads = ["Receiving Off", "Contacts Only", "Everyone"];
    const airSub = () => page(root, "AirDrop", (ss) => {
      const g = h("div", { class: "set-group" });
      const draw = () => g.replaceChildren(...ads.map((n, i) =>
        setRow("share", i === airdrop ? "#2563eb" : "#9ca3af", n, { end: i === airdrop ? svgIcon(I.check, "", 18) : undefined, onClick: () => { airdrop = i; draw(); } })));
      ss.append(g); draw();
    });
    const storageSub = () => page(root, "Storage", (ss) => {
      const segs: [string, number, string][] = [["System", .22, "#6b7280"], ["Apps", .31, "#2563eb"], ["Photos", .14, "#f59e0b"], ["Media", .08, "#ef4444"], ["Other", .05, "#9ca3af"]];
      ss.append(
        grp(h("div", { class: "set-row", style: { display: "block" } },
          h("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "10px" } },
            h("span", { class: "set-lbl" }, "57.6 GB of 256 GB used"), h("span", { class: "set-val" }, "")),
          h("div", { style: { display: "flex", height: "10px", borderRadius: "5px", overflow: "hidden", gap: "2px" } },
            ...segs.map(([, f, c]) => h("div", { style: { width: `${f * 100}%`, background: c } }))))),
        cap("Categories"),
        grp(...segs.map(([n, f, c]) => setRow("disc", c, n, { value: `${(f * 256).toFixed(0)} GB` }))));
    });
    s.append(grp(
      setRow("info", "#0ea5e9", "About", { onClick: aboutSub }),
      setRow("download", "#2563eb", "Software Update", { value: "2.1 available", onClick: updateSub }),
      setRow("share", "#22c55e", "AirDrop", { value: "Contacts Only", onClick: airSub }),
      setRow("disc", "#f59e0b", "Storage", { value: "57.6 GB used", onClick: storageSub }),
      setRow("globe", "#6b7280", "Language & Region", { value: "English (US)" }),
      setRow("calendar", "#ef4444", "Date & Time", { value: "Automatic" })));
  });

  const displaySub = () => page(root, "Display & Brightness", (s) => {
    const slider = h("input", { attrs: { type: "range", min: "0", max: "100", value: String(sys.brightness) },
      style: { width: "100%", accentColor: "#2563eb" }, onInput: (e) => set("brightness", +(e.target as HTMLInputElement).value) }) as HTMLInputElement;
    onChange((k) => { if (k === "brightness") slider.value = String(sys.brightness); });
    const night = () => { const h = new Date().getHours(); return h < 7 || h >= 19; };
    let mode = sys.darkMode ? 1 : 0;
    const modes = ["Light", "Dark", "Automatic"];
    const modeGrp = h("div", { class: "set-group" });
    const drawModes = () => modeGrp.replaceChildren(...modes.map((m, i) =>
      setRow(i === 0 ? "sun" : i === 1 ? "moon" : "clock", i === mode ? "#2563eb" : "#9ca3af", m,
        { end: i === mode ? svgIcon(I.check, "", 18) : undefined,
          onClick: () => { mode = i; set("darkMode", i === 1 || (i === 2 && night())); drawModes(); } })));
    s.append(
      cap("Brightness — mirrors Control Center"),
      grp(h("div", { class: "set-row" }, h("div", { class: "set-ic", style: { background: "#f59e0b" } }, svgIcon(I.sun)), h("div", { style: { flex: "1" } }, slider))),
      cap("Appearance"),
      (drawModes(), modeGrp),
      grp(setRow("eye", "#8b5cf6", "True Tone", { end: switchEl(true, () => {}) }),
          setRow("moonStar", "#6366f1", "Night Shift", { value: "Sunset – 07:00" })));
  });

  const wallpaperSub = () => page(root, "Wallpaper", (s) => {
    const g = h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" } });
    const draw = () => g.replaceChildren(...WALLPAPERS.map((w) =>
      h("div", { class: "pressable", style: { position: "relative", aspectRatio: "9/16", borderRadius: "14px", overflow: "hidden", border: w === wallpaper ? "3px solid #2563eb" : "1px solid #e5e7eb", cursor: "pointer" },
        onClick: () => {
          wallpaper = w;
          const wp = document.getElementById("wp");
          if (wp) wp.style.backgroundImage = `url(${w})`;
          draw(); toast(root, "Wallpaper applied");
        } },
        img(w, "img-fill"),
        w === wallpaper ? h("div", { style: { position: "absolute", top: "6px", right: "6px", width: "20px", height: "20px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" } }, svgIcon(I.check, "", 12)) : null)));
    s.append(cap("Pick a wallpaper — applied to the home screen"), g);
    draw();
  });

  const batterySub = () => page(root, "Battery", (s) => {
    s.append(
      grp(h("div", { class: "set-row", style: { display: "block" } },
          h("div", { style: { display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "8px" } },
            h("span", { style: { fontSize: "34px", fontWeight: "800", letterSpacing: "-.02em" } }, "84"),
            h("span", { style: { fontSize: "15px", color: "#9ca3af", fontWeight: "600" } }, "%")),
          bar(0.84, "#22c55e"))),
      grp(setRow("battery", "#f59e0b", "Low Power Mode", { end: switchEl(false, () => {}) }),
          setRow("battery", "#22c55e", "Battery Health", { value: "98%" })),
      cap("Usage by app — last 24 h"),
      grp(...[["App Store", .34], ["Music", .22], ["Safari", .18], ["Messages", .12], ["Photos", .08]].map(([n, f]) =>
        h("div", { class: "set-row", style: { display: "block" } },
          h("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "6px" } },
            h("span", { class: "set-lbl" }, n as string), h("span", { class: "set-val" }, `${Math.round((f as number) * 100)}%`)),
          bar(f as number, "#22c55e", "6px")))));
  });

  const screenTimeSub = () => page(root, "Screen Time", (s) => {
    const hrs: [string, number, string][] = [["Instagram", 1.7, "#e1306c"], ["Safari", .97, "#2563eb"], ["Messages", .68, "#22c55e"], ["Music", .55, "#f43f5e"], ["Maps", .3, "#f59e0b"]];
    s.append(
      grp(h("div", { class: "set-row", style: { display: "block" } },
          h("div", { style: { fontSize: "12px", color: "#9ca3af", fontWeight: "600", marginBottom: "4px" } }, "Daily average"),
          h("div", { style: { fontSize: "34px", fontWeight: "800", letterSpacing: "-.02em" } }, "4h 12m"))),
      cap("Most used"),
      grp(...hrs.map(([n, hr, c]) =>
        h("div", { class: "set-row", style: { display: "block" } },
          h("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "6px" } },
            h("span", { class: "set-lbl" }, n), h("span", { class: "set-val" }, `${Math.floor(hr)}h ${String(Math.round((hr % 1) * 60)).padStart(2, "0")}m`)),
          bar(hr / 2, c as string, "6px")))),
      grp(setRow("moon", "#6366f1", "Downtime", { value: "22:00 – 07:00" }),
          setRow("clock", "#22c55e", "App Limits", { end: switchEl(true, () => {}) })));
  });

  const privacySub = () => page(root, "Privacy & Security", (s) => {
    s.append(
      cap("Permissions"),
      grp(
        setRow("mapPin", "#2563eb", "Location Services", { value: "While Using" }),
        setRow("image", "#f59e0b", "Photos", { value: "Selected Photos" }),
        setRow("mic", "#ef4444", "Microphone", { value: "2 apps" }),
        setRow("camera", "#22c55e", "Camera", { value: "3 apps" }),
        setRow("bluetooth", "#8b5cf6", "Bluetooth", { value: "4 apps" })),
      cap("Tracking"),
      grp(setRow("eye", "#6b7280", "Allow apps to request tracking", { end: switchEl(false, () => {}) })),
      cap("Security"),
      grp(setRow("lock", "#2563eb", "Lockdown Mode", { end: switchEl(false, () => {}) })));
  });

  const storeSub = () => page(root, "App Store", (s) => {
    s.append(
      cap("Automatic downloads"),
      grp(setRow("download", "#0ea5e9", "App Updates", { end: switchEl(true, () => {}) }),
          setRow("store", "#8b5cf6", "New Apps", { end: switchEl(true, () => {}) })),
      cap("Cellular data"),
      grp(setRow("signal", "#22c55e", "Download over cellular", { end: switchEl(false, () => {}) })),
      grp(setRow("user", "#6b7280", "Nyne ID", { value: "john@nyne.dev" })));
  });

  const build = (q = "") => {
    scroll.replaceChildren();
    groups.length = 0;
    const add = (label: string, el: HTMLElement) => { groups.push({ label, el }); };

    add("john account profile about", h("div", { class: "card-white pressable", style: { display: "flex", alignItems: "center", gap: "14px", padding: "16px", marginBottom: "14px" }, onClick: aboutSub },
      img("/img/contact-john.jpg", "av rd"),
      h("div", { style: { flex: "1" } },
        h("div", { style: { fontSize: "18px", fontWeight: "700" } }, "John Doe"),
        h("div", { style: { fontSize: "12px", color: "#9ca3af" } }, "Wave Account, iCloud+, Media & Purchases")),
      h("span", { class: "chev" }, svgIcon(I.chevronLeft))));

    add("airplane wifi cellular bluetooth hotspot", grp(
      setRow("plane", "#f97316", "Airplane Mode", { end: switchEl(sys.airplane, (v) => set("airplane", v)) }),
      h("div", { class: "set-row pressable", onClick: wifiSub },
        h("div", { class: "set-ic", style: { background: "#2563eb" } }, svgIcon(I.wifi)),
        h("span", { class: "set-lbl" }, "Wi-Fi"), wifiVal, h("span", { class: "chev" }, svgIcon(I.chevronLeft))),
      setRow("signal", "#22c55e", "Cellular", { onClick: cellularSub }),
      setRow("bluetooth", "#2563eb", "Bluetooth", { value: "On", onClick: btSub }),
      setRow("link", "#22c55e", "Personal Hotspot", { onClick: hotspotSub })));

    add("notifications sounds focus screen time", grp(
      setRow("bell", "#ef4444", "Notifications", { onClick: notifSub }),
      setRow("volume2", "#f43f5e", "Sounds & Haptics", { onClick: soundSub }),
      setRow("moon", "#6366f1", "Focus", { onClick: focusSub }),
      setRow("clock", "#22c55e", "Screen Time", { value: "4h 12m", onClick: screenTimeSub })));

    add("general display wallpaper battery privacy", grp(
      setRow("settings", "#6b7280", "General", { onClick: generalSub }),
      setRow("sun", "#2563eb", "Display & Brightness", { value: "Light", onClick: displaySub }),
      setRow("image", "#0ea5e9", "Wallpaper", { onClick: wallpaperSub }),
      setRow("battery", "#22c55e", "Battery", { value: "84%", onClick: batterySub }),
      setRow("shield", "#2563eb", "Privacy & Security", { onClick: privacySub })));

    add("app store updates", grp(setRow("store", "#0ea5e9", "App Store", { value: "Automatic updates", onClick: storeSub })));

    const needle = q.toLowerCase();
    for (const g of groups) if (!needle || g.label.includes(needle)) scroll.append(g.el);
  };

  const input = h("input", { attrs: { placeholder: "Search" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "14px" } }) as HTMLInputElement;
  input.addEventListener("input", () => build(input.value.trim()));
  build();

  root.append(
    GlassHeader("Settings", { large: true }),
    h("div", { class: "search-pill", style: { margin: "0 16px 10px" } }, svgIcon(I.search), input),
    scroll);
  return root;
}
