// settings.ts — Réglages vivants : recherche, sous-pages Wi-Fi / Bluetooth /
// Notifications / Sons / Concentration, interrupteurs câblés sur l'état système
// (les mêmes que le Control Center).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import type { IconName } from "../core/lucide";
import { sys, set, onChange } from "../system/state";
import { GlassHeader, img, pane, setRow, switchEl } from "./ui";

const NETWORKS = [["Home_5G", true], ["Nyne Guest", false], ["CoffeeShop WiFi", false], ["Airport_Free", false]] as const;
const DEVICES = [["AirPods Pro", true], ["MacBook Pro 16″", true], ["Nyne Watch", false], ["MX Master 3S", false]] as const;

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

export function SettingsApp() {
  const root = h("div", { class: "pg", style: { height: "100%", display: "flex", flexDirection: "column", background: "#f4f4f5" } });
  const scroll = h("div", { class: "app-scroll no-sb", style: { padding: "0 16px 60px" } });
  const groups: { label: string; el: HTMLElement }[] = [];

  const wifiSub = () => page(root, "Wi-Fi", (s) => {
    const netList = h("div", {});
    const draw = () => netList.replaceChildren(...NETWORKS.map(([n]) =>
      setRow("wifi", n === "Home_5G" && sys.wifi ? "#2563eb" : "#9ca3af", n,
        { end: n === "Home_5G" && sys.wifi ? svgIcon(I.check, "", 18) : h("span", { class: "set-val" }, "···") })));
    s.append(
      grp(h("div", { class: "set-row" }, h("div", { class: "set-ic", style: { background: "#2563eb" } }, svgIcon(I.wifi)),
        h("span", { class: "set-lbl" }, "Wi-Fi"), switchEl(sys.wifi, (v) => { set("wifi", v); draw(); }))),
      h("div", { style: { fontSize: "12px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", margin: "4px 4px 6px" } }, "Known networks"),
      (netList.className = "set-group", netList));
    draw();
  });

  const btSub = () => page(root, "Bluetooth", (s) => {
    s.append(
      grp(h("div", { class: "set-row" }, h("div", { class: "set-ic", style: { background: "#2563eb" } }, svgIcon(I.bluetooth)),
        h("span", { class: "set-lbl" }, "Bluetooth"), switchEl(sys.bluetooth, (v) => set("bluetooth", v)))),
      h("div", { style: { fontSize: "12px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", margin: "4px 4px 6px" } }, "My devices"),
      grp(...DEVICES.map(([n, on]) => setRow("bluetooth", on && sys.bluetooth ? "#2563eb" : "#9ca3af", n, { value: on ? "Connected" : "Not Connected" }))));
  });

  const notifSub = () => page(root, "Notifications", (s) => {
    s.append(h("div", { style: { fontSize: "12px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", margin: "4px 4px 6px" } }, "Notification style"),
      grp(...[["Messages", "#22c55e", "messageCircle"], ["Mail", "#3b82f6", "mail"], ["Calendar", "#ef4444", "calendar"], ["App Store", "#0ea5e9", "store"]].map(([n, bg, ic]) =>
        setRow(ic as IconName, bg as string, n as string, { end: switchEl(n !== "App Store", () => {}) }))),
      grp(setRow("bell", "#f59e0b", "Scheduled summary", { end: switchEl(false, () => {}) }),
          setRow("moonStar", "#6366f1", "Show on lock screen", { end: switchEl(true, () => {}) })));
  });

  const soundSub = () => page(root, "Sounds & Haptics", (s) => {
    const slider = h("input", { attrs: { type: "range", min: "0", max: "100", value: String(sys.volume) },
      style: { width: "100%", accentColor: "#2563eb" }, onInput: (e) => set("volume", +(e.target as HTMLInputElement).value) }) as HTMLInputElement;
    onChange((k) => { if (k === "volume") slider.value = String(sys.volume); });
    s.append(
      grp(h("div", { class: "set-row" }, h("div", { class: "set-ic", style: { background: "#f43f5e" } }, svgIcon(I.volume2)), h("div", { style: { flex: "1" } }, slider))),
      h("div", { style: { fontSize: "12px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", margin: "4px 4px 6px" } }, "Ringtone"),
      grp(...["Ripples", "Aurora", "Zen Bell", "Nova"].map((r, i) =>
        setRow("music", i === 0 ? "#22c55e" : "#9ca3af", r, { end: i === 0 ? svgIcon(I.check, "", 18) : undefined }))),
      grp(setRow("slidersHorizontal", "#6b7280", "Haptic feedback", { end: switchEl(true, () => {}) })));
  });

  const focusSub = () => page(root, "Focus", (s) => {
    s.append(
      grp(h("div", { class: "set-row" }, h("div", { class: "set-ic", style: { background: "#6366f1" } }, svgIcon(I.moon)),
        h("span", { class: "set-lbl" }, "Do Not Disturb"), switchEl(false, () => {}))),
      h("div", { style: { fontSize: "12px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", margin: "4px 4px 6px" } }, "Schedule"),
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

  const build = (q = "") => {
    scroll.replaceChildren();
    groups.length = 0;
    const add = (label: string, el: HTMLElement) => { groups.push({ label, el }); };

    add("john", h("div", { class: "card-white pressable", style: { display: "flex", alignItems: "center", gap: "14px", padding: "16px", marginBottom: "14px" }, onClick: aboutSub },
      img("/img/contact-john.jpg", "av rd"),
      h("div", { style: { flex: "1" } },
        h("div", { style: { fontSize: "18px", fontWeight: "700" } }, "John Doe"),
        h("div", { style: { fontSize: "12px", color: "#9ca3af" } }, "Wave Account, iCloud+, Media & Purchases")),
      h("span", { class: "chev" }, svgIcon(I.chevronLeft))));

    add("airplane wifi cellular bluetooth hotspot", grp(
      setRow("plane", "#f97316", "Airplane Mode", { end: switchEl(sys.airplane, (v) => set("airplane", v)) }),
      setRow("wifi", "#2563eb", "Wi-Fi", { value: "Home_5G", onClick: wifiSub }),
      setRow("signal", "#22c55e", "Cellular", { onClick: () => page(root, "Cellular", (s) => s.append(grp(h("div", { class: "set-row" }, h("div", { class: "set-ic", style: { background: "#22c55e" } }, svgIcon(I.signal)), h("span", { class: "set-lbl" }, "Cellular Data"), switchEl(sys.cellular, (v) => set("cellular", v)))), grp(setRow("download", "#0ea5e9", "Data usage", { value: "4.2 GB this month" })))) }),
      setRow("bluetooth", "#2563eb", "Bluetooth", { value: "On", onClick: btSub })));

    add("notifications sounds focus screen time", grp(
      setRow("bell", "#ef4444", "Notifications", { onClick: notifSub }),
      setRow("volume2", "#f43f5e", "Sounds & Haptics", { onClick: soundSub }),
      setRow("moon", "#6366f1", "Focus", { onClick: focusSub }),
      setRow("clock", "#22c55e", "Screen Time", { value: "4h 12m" })));

    add("general display wallpaper battery privacy", grp(
      setRow("settings", "#6b7280", "General", { onClick: aboutSub }),
      setRow("sun", "#2563eb", "Display & Brightness", { value: "Light" }),
      setRow("image", "#0ea5e9", "Wallpaper", {}),
      setRow("battery", "#22c55e", "Battery", { value: "84%" }),
      setRow("shield", "#2563eb", "Privacy & Security", {})));

    add("app store", grp(setRow("store", "#0ea5e9", "App Store", { value: "Automatic updates" })));

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
