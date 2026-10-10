// settings.ts — Réglages : profil, sous-pages Wi-Fi/Bluetooth/Cellular/Hotspot,
// Notifications/Sounds/Focus câblées au système, recherche live.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import type { IconName } from "../core/lucide";
import { GlassHeader } from "./ui";
import { sys, set } from "../system/state";

function tog(on: boolean, fn: (v: boolean) => void) {
  const t = h("button", {
    class: "g-tog pressable" + (on ? " on" : ""),
    onClick: (e) => { e.stopPropagation(); const v = !t.classList.contains("on"); t.classList.toggle("on", v); fn(v); },
  }, h("em"));
  return t;
}
function toggle(key: "wifi" | "bluetooth" | "airplane" | "cellular") {
  return tog(sys[key], (v) => set(key, v));
}
function row(icon: IconName, color: string, label: string, val = "", extra?: HTMLElement, onClick?: () => void) {
  const r = h("div", { class: onClick ? "set-row pressable" : "set-row", style: onClick ? { cursor: "pointer" } : {} },
    h("div", { class: "set-ic", style: { background: color } }, svgIcon(I[icon])),
    h("span", { class: "set-lbl" }, label),
    val ? h("span", { class: "set-val" }, val) : null,
    extra ?? h("span", { class: "chev" }, svgIcon(I.chevronLeft, "", 16)));
  if (onClick) r.addEventListener("click", onClick);
  return r;
}

export function SettingsApp() {
  const root = h("div", { class: "harm-set", style: { height: "100%", display: "flex", flexDirection: "column", position: "relative", background: "linear-gradient(180deg,#e9f1fb 0%,#f5f7fa 340px)" } });

  const sub = (title: string, ...content: HTMLElement[]) => {
    const d = h("div", { style: { position: "absolute", inset: "0", zIndex: "100", background: "linear-gradient(180deg,#e9f1fb 0%,#f5f7fa 340px)", display: "flex", flexDirection: "column", transform: "translateX(60px)", opacity: "0", transition: "all .22s ease-out" } },
      h("div", { style: { position: "relative", padding: "60px 20px 12px", display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,.7)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(0,0,0,.06)" } },
        h("button", { class: "pressable", style: { position: "relative", zIndex: "2", color: "#007dff", display: "flex", alignItems: "center", fontSize: "16px", fontWeight: "600" }, onClick: () => { d.style.opacity = "0"; d.style.transform = "translateX(60px)"; setTimeout(() => d.remove(), 220); } }, svgIcon(I.chevronLeft, "", 20), "Settings"),
        h("span", { style: { position: "absolute", left: "0", right: "0", textAlign: "center", fontWeight: "700", fontSize: "16px", pointerEvents: "none" } }, title)),
      h("div", { class: "app-scroll no-sb", style: { padding: "24px 20px 40px", display: "flex", flexDirection: "column", gap: "20px" } }, ...content));
    root.append(d);
    requestAnimationFrame(() => { d.style.opacity = "1"; d.style.transform = "none"; });
  };

  const group = (...rows: HTMLElement[]) => h("div", { class: "set-group g-light" }, ...rows);
  const note = (t: string) => h("div", { style: { fontSize: "12px", color: "rgba(0,0,0,.45)", padding: "0 12px" } }, t);

  const wifiPage = () => {
    const nets = ["Home_5G", "NyneOffice", "CoffeeShop_Guest"];
    const wrap = h("div", { class: "set-group g-light" });
    const paint = () => wrap.replaceChildren(...nets.map((n, i) => {
      const on = i === 0 && sys.wifi;
      const r = row("wifi", "#007dff", n, "", on ? h("span", { style: { color: "#007dff", display: "flex" } }, svgIcon(I.check, "", 18)) : h("span", {}));
      r.addEventListener("click", () => { if (sys.wifi) { nets.unshift(nets.splice(i, 1)[0]); paint(); } });
      return r;
    }));
    paint();
    sub("Wi-Fi",
      group(row("wifi", "#007dff", "Wi-Fi", "", toggle("wifi"))),
      note("Available networks"),
      wrap);
  };

  const btPage = () => {
    const devs: [string, boolean][] = [["AirPods Pro", true], ["Wave Watch", true], ["Magic Keyboard", false]];
    const wrap = h("div", { class: "set-group g-light" });
    const paint = () => wrap.replaceChildren(...devs.map(([n, conn], i) => {
      const r = row("bluetooth", "#007dff", n, "", h("span", { style: { fontSize: "13px", color: conn ? "#007dff" : "rgba(0,0,0,.4)", fontWeight: "600" } }, conn ? "Connected" : "Not Connected"));
      r.classList.add("pressable");
      r.style.cursor = "pointer";
      r.addEventListener("click", () => { if (sys.bluetooth) { devs[i][1] = !conn; paint(); } });
      return r;
    }));
    paint();
    sub("Bluetooth",
      group(row("bluetooth", "#007dff", "Bluetooth", "", toggle("bluetooth"))),
      note("My devices"),
      wrap);
  };

  const cellularPage = () =>
    sub("Cellular",
      group(row("signal", "#22c55e", "Cellular Data", "", toggle("cellular"))),
      note("Data usage — October"),
      group(row("globe", "#007dff", "Data Used", "4.2 GB of 20 GB"),
        h("div", { style: { padding: "4px 16px 16px" } },
          h("div", { style: { height: "6px", borderRadius: "3px", background: "#e5e7eb", overflow: "hidden" } },
            h("div", { style: { height: "100%", width: "21%", borderRadius: "3px", background: "#22c55e" } })))));

  const hotspotPage = () => {
    let on = false;
    sub("Personal Hotspot",
      group(row("globe", "#007dff", "Allow Others to Join", "", tog(on, (v) => { on = v; }))),
      note(on ? "Other devices can now find this phone." : "When off, only your own devices can connect."),
      group(row("lock", "#71717a", "Wi-Fi Password", "wave-2049")));
  };

  const notifPage = () =>
    sub("Notifications",
      ...(["Messages", "Mail", "Calendar", "Weather"] as const).map((n) =>
        group(row("bell", "#ef4444", n, "", tog(true, () => {})))));

  const soundsPage = () => {
    const slider = h("input", { attrs: { type: "range", min: "0", max: "100", value: String(sys.volume) }, style: { width: "100%", accentColor: "#ec4899" } }) as HTMLInputElement;
    slider.addEventListener("input", () => set("volume", Number(slider.value)));
    return sub("Sounds & Haptics",
      group(row("volume2", "#ec4899", "Ringtone", "Ripple"), row("bell", "#f59e0b", "Vibration", "", tog(true, () => {}))),
      note("Volume"),
      h("div", { class: "card-white", style: { padding: "18px 20px" } }, slider));
  };

  const focusPage = () => {
    let cur = "off";
    const MODES: [string, IconName, string][] = [["Do Not Disturb", "moon", "#6366f1"], ["Work", "pencil", "#007dff"], ["Sleep", "bell", "#10b981"], ["Off", "x", "#71717a"]];
    const wrap = h("div", { class: "set-group g-light" });
    const paint = () => wrap.replaceChildren(...MODES.map(([n, ic, c]) => {
      const id = n.toLowerCase();
      return row(ic, c, n, "", cur === id ? h("span", { style: { color: "#007dff", display: "flex" } }, svgIcon(I.check, "", 18)) : h("span", {}), () => { cur = id; paint(); });
    }));
    paint();
    sub("Focus", wrap, note("Focus filters notifications across the system."));
  };

  const GROUPS: [string, HTMLElement][] = [
    ["wifi", group(row("wifi", "#007dff", "Wi-Fi", "Home_5G", toggle("wifi"), wifiPage),
      row("bluetooth", "#007dff", "Bluetooth", "On", toggle("bluetooth"), btPage),
      row("plane", "#f97316", "Airplane Mode", "", toggle("airplane")),
      row("signal", "#22c55e", "Cellular", "", undefined, cellularPage),
      row("globe", "#007dff", "Personal Hotspot", "Off", undefined, hotspotPage))],
    ["notif", group(row("bell", "#ef4444", "Notifications", "", undefined, notifPage),
      row("volume2", "#ec4899", "Sounds & Haptics", "", undefined, soundsPage),
      row("moon", "#6366f1", "Focus", "", undefined, focusPage))],
  ];

  const scroll = h("div", { class: "app-scroll no-sb", style: { padding: "0 24px 40px", display: "flex", flexDirection: "column", gap: "24px" } });
  const profile = h("div", { class: "pressable card-white", style: { padding: "18px 20px", display: "flex", alignItems: "center", gap: "16px", borderRadius: "24px", background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,.04)", cursor: "pointer" } },
    h("div", { style: { width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg,#007dff,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "20px", fontWeight: "700", boxShadow: "inset 0 1px 1px rgba(255,255,255,.4),0 4px 10px rgba(0,0,0,.1)", flexShrink: "0" } }, "JD"),
    h("div", { style: { flex: "1" } },
      h("div", { style: { fontSize: "20px", fontWeight: "700", color: "rgba(0,0,0,.9)" } }, "John Doe"),
      h("div", { style: { fontSize: "13px", color: "rgba(0,0,0,.45)", fontWeight: "500", marginTop: "2px" } }, "Nyne ID")),
    h("span", { class: "chev" }, svgIcon(I.chevronLeft, "", 16)));

  const searchIn = h("input", { attrs: { type: "search", placeholder: "Search Settings" }, style: { flex: "1", border: "none", outline: "none", background: "transparent", fontSize: "14px", fontFamily: "inherit" } }) as HTMLInputElement;
  const paint = () => {
    const q = searchIn.value.trim().toLowerCase();
    if (!q) { scroll.replaceChildren(profile, ...GROUPS.map(([, g]) => g)); return; }
    const flat: HTMLElement[] = [];
    GROUPS.forEach(([, g]) => g.querySelectorAll<HTMLElement>(".set-row").forEach((r) => {
      const lbl = r.querySelector(".set-lbl")?.textContent ?? "";
      if (lbl.toLowerCase().includes(q)) flat.push(r);
    }));
    scroll.replaceChildren(...(flat.length ? [group(...flat)] : [note(`No settings matching “${searchIn.value}”`)]));
  };
  searchIn.addEventListener("input", paint);
  paint();

  root.append(
    GlassHeader("Settings", { large: true }),
    h("div", { style: { padding: "8px 24px 16px" } },
      h("div", { class: "search-pill", style: { borderRadius: "999px", height: "44px", padding: "0 18px", background: "rgba(255,255,255,.55)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,.7)", boxShadow: "0 4px 16px rgba(10,89,247,.08)" } }, svgIcon(I.search, "", 16), searchIn)),
    scroll);
  return root;
}
