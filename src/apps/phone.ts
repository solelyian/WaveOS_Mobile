// phone.ts — téléphone complet : clavier (effacement), favoris, contacts,
// récents cliquables, voicemail, écran d'appel avec chrono et boutons réels.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { GlassHeader, FloatingTabBar, img, pane, toast } from "./ui";

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

export function PhoneApp() {
  const root = h("div", { class: "pg", style: { height: "100%", display: "flex", flexDirection: "column", background: "#f4f4f5" } });
  const scroll = h("div", { class: "app-scroll no-sb", style: { padding: "0 20px 120px", display: "flex", flexDirection: "column" } });
  let digits = "";

  function call(name: string, avatar?: string) {
    pane(root, (close) => {
      const st = h("div", { style: { fontSize: "15px", color: "rgba(255,255,255,.75)", marginTop: "4px" } }, "calling…");
      let secs = -1;
      const iv = setInterval(() => {
        secs++;
        st.textContent = secs < 0 ? "calling…" : secs === 0 ? "00:00" : `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
        if (secs === 0) st.textContent = "00:00";
      }, 800);
      setTimeout(() => { if (secs < 0) st.textContent = "00:00"; }, 1500);
      const end = () => { clearInterval(iv); close(); };
      const btn = (ic: keyof typeof I, l: string, fn?: () => void) =>
        h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" } },
          h("button", { class: "g-btn pressable", style: { width: "62px", height: "62px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }, onClick: fn ?? (() => toast(root, l + " toggled")) }, svgIcon(I[ic], "", 22)),
          h("span", { style: { fontSize: "11px", color: "rgba(255,255,255,.7)" } }, l));
      return h("div", { class: "pg", style: { background: "linear-gradient(180deg,#1f2937,#050505)", color: "#fff", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "70px 28px 60px" } },
        avatar ? h("div", { style: { width: "90px", height: "90px", borderRadius: "50%", overflow: "hidden", marginBottom: "14px", border: "2px solid rgba(255,255,255,.2)" } }, img(avatar, "img-fill")) : h("div", { style: { width: "90px", height: "90px", borderRadius: "50%", background: "rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" } }, svgIcon(I.user, "", 40)),
        h("div", { style: { fontSize: "28px", fontWeight: "700" } }, name), st,
        h("div", { style: { flex: "1" } }),
        h("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "18px 26px", marginBottom: "34px" } },
          btn("micOff", "mute"), btn("layoutGrid", "keypad"), btn("volume2", "speaker"), btn("plus", "add call"), btn("video", "FaceTime"), btn("user", "contacts")),
        h("button", { class: "pressable", style: { width: "72px", height: "72px", borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: end },
          h("span", { style: { display: "flex", transform: "rotate(135deg)" } }, svgIcon(I.phone, "", 30))));
    });
  }

  const keypad = () => {
    const disp = h("div", { style: { textAlign: "center", fontSize: "36px", fontWeight: "300", letterSpacing: ".02em", minHeight: "46px", margin: "4px 0 12px", fontVariantNumeric: "tabular-nums" } }, " ");
    const upd = () => disp.textContent = digits || " ";
    const callRow = h("div", { style: { display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginTop: "14px" } },
      h("button", { class: "pressable", style: { width: "68px", height: "68px", borderRadius: "50%", background: "#22c55e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
        onClick: () => { if (!digits) { toast(root, "Enter a number"); return; } call(digits); } }, svgIcon(I.phone, "", 28)),
      h("button", { style: { width: "68px", height: "68px", color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center" },
        onClick: () => { digits = digits.slice(0, -1); upd(); } }, svgIcon(I.chevronLeft, "", 26)));
    scroll.append(disp,
      h("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,80px)", gap: "12px", justifyContent: "center" } },
        ...KEYS.map(([n, s]) => h("button", { class: "pk-key", onClick: () => { digits += n; upd(); } },
          h("span", { class: "n" }, n), s ? h("span", { class: "s" }, s) : h("span", { class: "s" }, " ")))),
      callRow);
  };

  const personRow = (name: string, avatar: string, sub: string, ic: keyof typeof I = "phone", red = false) =>
    h("div", { class: "lrow" },
      img(avatar, "av rd"),
      h("div", { class: "tx" }, h("div", { class: "t1", style: red ? { color: "#ef4444" } : {} }, name), h("div", { class: "t2" }, sub)),
      h("button", { class: "pressable", style: { width: "34px", height: "34px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" },
        onClick: () => call(name, avatar) }, svgIcon(I[ic], "", 16)));

  const show = (tab: string) => {
    scroll.replaceChildren();
    if (tab === "keypad") { keypad(); return; }
    if (tab === "favorites") {
      scroll.append(h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } },
        ...CONTACTS.slice(0, 4).map(([n, , a]) => h("div", { class: "card-white pressable", style: { padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }, onClick: () => call(n, a) },
          h("div", { style: { position: "relative" } },
            h("div", { style: { width: "64px", height: "64px", borderRadius: "50%", overflow: "hidden" } }, img(a, "img-fill")),
            h("div", { style: { position: "absolute", top: "-4px", right: "-4px", background: "#f59e0b", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" } }, svgIcon(I.star, "fill", 12))),
          h("span", { style: { fontWeight: "600", fontSize: "14px" } }, n),
          h("span", { style: { fontSize: "11px", color: "#9ca3af", marginTop: "-6px" } }, "mobile")))));
    } else if (tab === "contacts") {
      scroll.append(h("div", { class: "card-white", style: { padding: "2px 14px" } },
        ...CONTACTS.map(([n, num, a]) => personRow(n, a, num))));
    } else if (tab === "voicemail") {
      scroll.append(h("div", { class: "card-white", style: { padding: "2px 14px" } },
        ...[["Mom", "2:14", "Yesterday"], ["Unknown", "0:37", "Monday"]].map(([n, d, t]) =>
          h("div", { class: "lrow" },
            h("div", { class: "set-ic", style: { background: "#6b7280" } }, svgIcon(I.voicemail)),
            h("div", { class: "tx" }, h("div", { class: "t1" }, n), h("div", { class: "t2" }, `${d} · ${t}`)),
            h("button", { class: "pressable", style: { color: "#2563eb" }, onClick: () => toast(root, "Playing voicemail…") }, svgIcon(I.play, "fill", 20))))));
    } else {
      scroll.append(h("div", { class: "card-white", style: { padding: "2px 14px" } },
        ...RECENTS.map(([n, ic, t, how]) => {
          const c = CONTACTS.find((x) => x[0] === n);
          return personRow(n, c ? c[2] : "/img/avatar/a-0.jpg", `${how} · ${t}`, ic as keyof typeof I, ic === "phoneMissed");
        })));
    }
  };

  const tabs = FloatingTabBar([
    { id: "favorites", icon: "star", label: "Favorites" },
    { id: "recents", icon: "clock", label: "Recents" },
    { id: "contacts", icon: "user", label: "Contacts" },
    { id: "keypad", icon: "layoutGrid", label: "Keypad" },
    { id: "voicemail", icon: "voicemail", label: "Voicemail" },
  ], "keypad", show);

  show("keypad");
  root.append(GlassHeader("Phone", {}), scroll, tabs.el);
  return root;
}
