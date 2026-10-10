// phone.ts — Téléphone : clavier + récents + écran d'appel (maquette).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { FloatingTabBar, img } from "./ui";

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"];

export function PhoneApp() {
  let tab = "keypad";
  let number = "";

  const root = h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative" } });
  const stage = h("div", { style: { flex: "1", display: "flex", flexDirection: "column" } });
  root.append(stage);

  const numEl = h("div", { style: { height: "80px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", fontWeight: "300", marginBottom: "16px", letterSpacing: ".05em" } });
  const callBtn = h("button", {
    class: "pressable", style: { width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", border: "1px solid #4ade80", transition: "all .2s" },
    onClick: () => { if (number) showCall(); },
  }, svgIcon(I.phone, "fill", 32));

  const keypad = () => {
    numEl.textContent = number || "...";
    numEl.style.color = number ? "#000" : "#d1d5db";
    callBtn.style.background = number ? "#22c55e" : "#d1d5db";
    callBtn.style.borderColor = number ? "#4ade80" : "#d1d5db";
    callBtn.style.boxShadow = number ? "0 10px 25px -5px rgba(34,197,94,.4)" : "none";
    return h("div", { style: { flex: "1", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", paddingBottom: "112px" } },
      numEl,
      h("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,80px)", columnGap: "24px", rowGap: "16px", marginBottom: "32px" } },
        ...KEYS.map((n) =>
          h("button", { class: "pk-key", onClick: () => { if (number.length < 12) { number += n; refresh(); } } },
            h("span", { class: "n" }, String(n)),
            typeof n === "number" ? h("span", { class: "s" }, "ABC") : null))),
      callBtn);
  };

  const CONTACTS = [
    { n: "Alex Morgan", k: "Mobile" }, { n: "Sam Rivera", k: "iPhone" },
    { n: "Jordan Lee", k: "Mobile" }, { n: "Casey Kim", k: "Work" },
    { n: "Robin Park", k: "Mobile" }, { n: "Ari Chen", k: "Home" },
    { n: "Noa Blanc", k: "Mobile" }, { n: "Léo Martin", k: "iPhone" },
  ];
  const recents = () =>
    h("div", { class: "app-scroll no-sb", style: { padding: "64px 16px 96px" } },
      h("h1", { style: { fontSize: "30px", fontWeight: "700", marginBottom: "16px" } }, "Recents"),
      ...Array.from({ length: 10 }, (_, i) =>
        h("div", { class: "pressable", style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid rgba(243,244,246,.5)", cursor: "pointer" }, onClick: () => { number = "555-0142"; showCall(); } },
          h("div", { style: { display: "flex", alignItems: "center", gap: "16px" } },
            h("div", { style: { width: "48px", height: "48px", borderRadius: "50%", background: "#e5e7eb", overflow: "hidden" } }, (() => { const im = img(`/img/avatar/a-${i}.jpg`); im.style.cssText = "width:100%;height:100%;object-fit:cover"; return im; })()),
            h("div", {},
              h("div", { style: { fontWeight: "700", fontSize: "18px", color: i === 0 ? "#ef4444" : "rgba(0,0,0,.9)" } }, CONTACTS[i % CONTACTS.length].n),
              h("div", { style: { fontSize: "14px", color: "rgba(0,0,0,.5)" } }, CONTACTS[i % CONTACTS.length].k))),
          h("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
            h("span", { style: { fontSize: "12px", color: "rgba(0,0,0,.4)" } }, i < 2 ? "Today" : "Yesterday"),
            h("span", { style: { color: "#3b82f6", display: "flex" } }, svgIcon(I.info, "", 20))))));

  const favorites = () =>
    h("div", { class: "app-scroll no-sb", style: { padding: "64px 20px 96px" } },
      h("h1", { style: { fontSize: "30px", fontWeight: "700", marginBottom: "24px" } }, "Favorites"),
      h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" } },
        ...CONTACTS.slice(0, 4).map((c, i) =>
          h("div", { class: "pressable card-white", style: { padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", cursor: "pointer" }, onClick: () => { number = "555-0142"; showCall(); } },
            h("div", { style: { width: "72px", height: "72px", borderRadius: "50%", background: "#e5e7eb", overflow: "hidden", border: "2px solid #fff", boxShadow: "0 4px 10px rgba(0,0,0,.1)" } }, (() => { const im = img(`/img/avatar/a-${i + 12}.jpg`); im.style.cssText = "width:100%;height:100%;object-fit:cover"; return im; })()),
            h("div", { style: { fontWeight: "700", fontSize: "15px", color: "rgba(0,0,0,.9)", textAlign: "center" } }, c.n)))));

  const contacts = () =>
    h("div", { class: "app-scroll no-sb", style: { padding: "64px 16px 96px" } },
      h("h1", { style: { fontSize: "30px", fontWeight: "700", marginBottom: "16px" } }, "Contacts"),
      ...CONTACTS.map((c, i) =>
        h("div", { class: "pressable", style: { display: "flex", alignItems: "center", gap: "16px", padding: "14px 0", borderBottom: "1px solid rgba(243,244,246,.5)", cursor: "pointer" }, onClick: () => { number = "555-0142"; showCall(); } },
          h("div", { style: { width: "44px", height: "44px", borderRadius: "50%", background: "#e5e7eb", overflow: "hidden", flexShrink: "0" } }, (() => { const im = img(`/img/avatar/a-${i + 20}.jpg`); im.style.cssText = "width:100%;height:100%;object-fit:cover"; return im; })()),
          h("div", { style: { flex: "1" } },
            h("div", { style: { fontWeight: "600", fontSize: "17px", color: "rgba(0,0,0,.9)" } }, c.n),
            h("div", { style: { fontSize: "13px", color: "rgba(0,0,0,.5)" } }, c.k)),
          h("span", { style: { color: "#22c55e", display: "flex" } }, svgIcon(I.phone, "", 18)))));

  const voicemail = () =>
    h("div", { class: "app-scroll no-sb", style: { padding: "64px 20px 96px" } },
      h("h1", { style: { fontSize: "30px", fontWeight: "700", marginBottom: "24px" } }, "Voicemail"),
      ...([["Sam Rivera", "0:42", "Hey, call me back when you get this — it's about Friday."],
           ["Mom", "1:18", "Hi honey, just checking in. Dinner this weekend?"]] as const).map(([n, d, t]) =>
        h("div", { class: "card-white", style: { padding: "16px", marginBottom: "12px" } },
          h("div", { style: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" } },
            (() => {
              let playing = false;
              const play = h("button", {
                class: "pressable",
                style: { width: "44px", height: "44px", borderRadius: "50%", background: "#22c55e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
                onClick: (e) => {
                  e.stopPropagation(); playing = !playing;
                  play.replaceChildren(svgIcon(playing ? I.pause : I.play));
                  (play.querySelector("svg") as SVGElement).style.fill = "#fff";
                },
              }, svgIcon(I.play));
              (play.querySelector("svg") as SVGElement).style.fill = "#fff";
              return play;
            })(),
            h("div", { style: { flex: "1" } },
              h("div", { style: { fontWeight: "700", fontSize: "16px", color: "rgba(0,0,0,.9)" } }, n),
              h("div", { style: { fontSize: "13px", color: "rgba(0,0,0,.5)" } }, `${d} · Today`))),
          h("div", { style: { fontSize: "13px", color: "rgba(0,0,0,.6)", lineHeight: "1.45", padding: "10px 12px", background: "#f4f4f5", borderRadius: "12px" } }, t))));

  const showCall = () => {
    const ov = h("div", { style: { position: "absolute", inset: "0", zIndex: "50", background: "#111827", display: "flex", flexDirection: "column", alignItems: "center", padding: "96px 0 48px", opacity: "0", transform: "scale(.9)", transition: "all .25s" } });
    const bg = img("/img/contact-john.jpg"); bg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.3;filter:blur(40px) saturate(1.5)";
    const av = h("div", { style: { width: "96px", height: "96px", borderRadius: "50%", overflow: "hidden", marginBottom: "24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,.5)", border: "2px solid rgba(255,255,255,.2)" } },
      (() => { const im = img("/img/contact-john.jpg"); im.style.cssText = "width:100%;height:100%;object-fit:cover"; return im; })());
    ov.append(bg,
      h("div", { style: { position: "relative", zIndex: "10", display: "flex", flexDirection: "column", alignItems: "center", flex: "1" } },
        av,
        h("h2", { style: { fontSize: "30px", fontWeight: "700", color: "#fff" } }, "John Doe"),
        h("p", { style: { color: "rgba(255,255,255,.7)", marginTop: "4px" } }, "calling mobile...")),
      h("div", { style: { position: "relative", zIndex: "10" } },
        h("button", { class: "pressable", style: { width: "64px", height: "64px", borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 10px 25px -5px rgba(239,68,68,.4)", border: "1px solid #f87171" }, onClick: () => { ov.style.opacity = "0"; setTimeout(() => ov.remove(), 250); } },
          h("span", { style: { transform: "rotate(135deg)", display: "flex" } }, svgIcon(I.phone)))));
    root.append(ov);
    requestAnimationFrame(() => { ov.style.opacity = "1"; ov.style.transform = "scale(1)"; });
  };

  const TABS = [
    { id: "favorites", icon: "star" as const, label: "Favorites" },
    { id: "recents", icon: "clock" as const, label: "Recents" },
    { id: "contacts", icon: "user" as const, label: "Contacts" },
    { id: "keypad", icon: "layoutGrid" as const, label: "Keypad" },
    { id: "voicemail", icon: "voicemail" as const, label: "Voicemail" },
  ];
  // la capsule persiste : le pill glisse via son ressort interne (setActive)
  const bar = FloatingTabBar(TABS, tab, (id) => { tab = id; refresh(); });

  const refresh = () => {
    stage.replaceChildren(
      tab === "keypad" ? keypad()
      : tab === "recents" ? recents()
      : tab === "favorites" ? favorites()
      : tab === "contacts" ? contacts()
      : voicemail());
  };
  refresh();
  root.append(bar.el);
  return root;
}
