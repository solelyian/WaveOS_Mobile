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

  const recents = () =>
    h("div", { class: "app-scroll no-sb", style: { padding: "64px 16px 96px" } },
      h("h1", { style: { fontSize: "30px", fontWeight: "700", marginBottom: "16px" } }, "Recents"),
      ...Array.from({ length: 10 }, (_, i) =>
        h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid rgba(243,244,246,.5)" } },
          h("div", { style: { display: "flex", alignItems: "center", gap: "16px" } },
            h("div", { style: { width: "48px", height: "48px", borderRadius: "50%", background: "#e5e7eb", overflow: "hidden" } }, (() => { const im = img(`/img/avatar/a-${i}.jpg`); im.style.cssText = "width:100%;height:100%;object-fit:cover"; return im; })()),
            h("div", {},
              h("div", { style: { fontWeight: "700", fontSize: "18px", color: i === 0 ? "#ef4444" : "rgba(0,0,0,.9)" } }, "John Doe"),
              h("div", { style: { fontSize: "14px", color: "rgba(0,0,0,.5)" } }, "Mobile"))),
          h("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
            h("span", { style: { fontSize: "12px", color: "rgba(0,0,0,.4)" } }, "Yesterday"),
            h("span", { style: { color: "#3b82f6", display: "flex" } }, svgIcon(I.info, "", 20))))));

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
  let bar = FloatingTabBar(TABS, tab, (id) => { tab = id; refresh(); });

  const refresh = () => {
    // maquette : seuls keypad/recents ont du contenu — les autres onglets vident l'écran
    stage.replaceChildren(tab === "keypad" ? keypad() : tab === "recents" ? recents() : h("div", { style: { flex: "1" } }));
    const nb = FloatingTabBar(TABS, tab, (id) => { tab = id; refresh(); });
    bar.replaceWith(nb); bar = nb;
  };
  refresh();
  root.append(bar);
  return root;
}
