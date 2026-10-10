// messages.ts — Messages : en-tête verre, stories, conversations ouvrables,
// fil de discussion avec envoi + réponse simulée.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { FloatingTabBar, img } from "./ui";

const NAMES = ["Alex Morgan", "Sam Rivera", "Jordan Lee", "Casey Kim", "Robin Park", "Ari Chen", "Noa Blanc", "Léo Martin"];
const REPLIES = ["Sounds good!", "On my way", "Haha yes", "Can't wait", "Let's do it", "Perfect 👌", "See you then!"];

export function MessagesApp() {
  const root = h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative", zIndex: "10" } });
  const stage = h("div", { style: { flex: "1", display: "flex", flexDirection: "column", minHeight: "0" } });
  let tab = "chats";

  const header = h("div", { class: "g-light", style: { padding: "64px 24px 16px", background: "rgba(255,255,255,.6)", borderRadius: "0 0 32px 32px", marginBottom: "8px", zIndex: "20" } },
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" } },
      h("div", { style: { color: "#3b82f6", fontWeight: "500" } }, "Edit"),
      h("div", { class: "pressable", style: { padding: "8px", background: "#3b82f6", color: "#fff", borderRadius: "50%", boxShadow: "0 4px 12px rgba(59,130,246,.3)", display: "flex" } }, svgIcon(I.send, "", 18))),
    h("h1", { style: { fontSize: "30px", fontWeight: "700", color: "rgba(0,0,0,.9)", marginBottom: "16px" } }, "Messages"),
    h("div", { class: "search-pill" }, svgIcon(I.search, "", 16), h("span", {}, "Search")));

  const stories = h("div", { class: "no-sb", style: { display: "flex", gap: "16px", overflowX: "auto", padding: "8px 0 8px 8px", marginBottom: "16px" } },
    ...[1, 2, 3, 4, 5].map((i) =>
      h("div", { class: "pressable", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: "0", cursor: "pointer" }, onClick: () => thread(NAMES[i - 1], i + 10) },
        h("div", { style: { width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(45deg,#60a5fa,#4ade80)", padding: "2px", boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)" } },
          h("div", { style: { width: "100%", height: "100%", borderRadius: "50%", background: "#fff", padding: "2px" } },
            (() => { const im = img(`/img/avatar/a-${i + 10}.jpg`); im.style.cssText = "width:100%;height:100%;border-radius:50%;object-fit:cover"; return im; })())),
        h("span", { style: { fontSize: "10px", fontWeight: "700", color: "rgba(0,0,0,.5)" } }, NAMES[i - 1].split(" ")[0]))));

  const lastMsg: Record<string, string> = {};
  const convos = h("div", { style: { display: "flex", flexDirection: "column", gap: "12px" } },
    ...NAMES.map((name, i) =>
      h("div", { class: "pressable card-white", style: { padding: "16px", display: "flex", gap: "16px", alignItems: "center", cursor: "pointer" }, onClick: () => thread(name, i + 20) },
        h("div", { style: { position: "relative", flexShrink: "0" } },
          (() => { const im = img(`/img/avatar/a-${i + 20}.jpg`); im.style.cssText = "width:56px;height:56px;border-radius:50%;object-fit:cover;background:#e5e7eb;border:1px solid #f3f4f6"; return im; })(),
          i < 3 ? h("div", { style: { position: "absolute", top: "-4px", right: "-4px", width: "16px", height: "16px", background: "#3b82f6", borderRadius: "50%", border: "2px solid #fff", boxShadow: "0 1px 2px rgba(0,0,0,.1)" } }) : null),
        h("div", { style: { flex: "1", minWidth: "0" } },
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" } },
            h("span", { style: { fontWeight: "700", color: "rgba(0,0,0,.9)", fontSize: "18px" } }, name),
            h("span", { style: { fontSize: "12px", color: "rgba(0,0,0,.4)", fontWeight: "700" } }, `10:${10 + i} AM`)),
          h("div", { class: "last-msg", style: { fontSize: "14px", color: "rgba(0,0,0,.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: "500" } }, i === 0 ? "Hey, are we still on for lunch?" : "Sent a photo")),
        h("span", { style: { color: "#d1d5db", transform: "rotate(180deg)", display: "flex", flexShrink: "0" } }, svgIcon(I.chevronLeft, "", 16)))));

  // fil de discussion : bulles + champ d'envoi + réponse simulée
  const thread = (name: string, av: number) => {
    const feed = h("div", { class: "msg-thread app-scroll no-sb", style: { flex: "1", overflowY: "auto" } },
      h("div", { class: "msg-b in" }, lastMsg[name] ?? (name === "Alex Morgan" ? "Hey, are we still on for lunch?" : "Sent a photo")),
      h("div", { class: "msg-b out" }, "Yes! Noon at the usual place?"),
      h("div", { class: "msg-b in" }, "Perfect, see you there"));
    const input = h("input", { attrs: { type: "text", placeholder: "iMessage" } }) as HTMLInputElement;
    const send = () => {
      const v = input.value.trim();
      if (!v) return;
      input.value = "";
      feed.append(h("div", { class: "msg-b out" }, v));
      feed.scrollTop = feed.scrollHeight;
      lastMsg[name] = v;
      setTimeout(() => {
        const r = REPLIES[Math.floor(Math.random() * REPLIES.length)];
        feed.append(h("div", { class: "msg-b in" }, r));
        feed.scrollTop = feed.scrollHeight;
        lastMsg[name] = r;
      }, 900 + Math.random() * 800);
    };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
    const d = h("div", { style: { position: "absolute", inset: "0", zIndex: "40", background: "#f4f4f5", display: "flex", flexDirection: "column", transform: "translateX(60px)", opacity: "0", transition: "all .22s ease-out" } },
      h("div", { class: "g-light", style: { padding: "60px 16px 12px", display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,.7)", borderRadius: "0 0 24px 24px" } },
        h("button", { class: "pressable", style: { color: "#3b82f6", display: "flex" }, onClick: () => { d.style.opacity = "0"; d.style.transform = "translateX(60px)"; setTimeout(() => d.remove(), 220); } }, svgIcon(I.chevronLeft)),
        (() => { const im = img(`/img/avatar/a-${av}.jpg`); im.style.cssText = "width:36px;height:36px;border-radius:50%;object-fit:cover"; return im; })(),
        h("div", {}, h("div", { style: { fontWeight: "700", fontSize: "16px", color: "#111" } }, name), h("div", { style: { fontSize: "11px", color: "#22c55e", fontWeight: "600" } }, "Online")),
        h("span", { style: { marginLeft: "auto", color: "#3b82f6", display: "flex" } }, svgIcon(I.phone, "", 20))),
      feed,
      h("div", { class: "msg-inrow" },
        input,
        h("button", { class: "msg-send pressable", onClick: send }, svgIcon(I.send, "", 16))));
    root.append(d);
    requestAnimationFrame(() => { d.style.opacity = "1"; d.style.transform = "none"; });
    feed.scrollTop = feed.scrollHeight;
  };

  const calls = () =>
    h("div", { class: "app-scroll no-sb", style: { padding: "70px 16px 96px" } },
      h("h1", { style: { fontSize: "30px", fontWeight: "700", color: "rgba(0,0,0,.9)", marginBottom: "20px" } }, "Calls"),
      ...NAMES.slice(0, 6).map((n, i) =>
        h("div", { class: "pressable card-white", style: { padding: "14px 16px", display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px", cursor: "pointer" }, onClick: () => thread(n, i + 20) },
          (() => { const im = img(`/img/avatar/a-${i + 20}.jpg`); im.style.cssText = "width:44px;height:44px;border-radius:50%;object-fit:cover;background:#e5e7eb"; return im; })(),
          h("div", { style: { flex: "1" } },
            h("div", { style: { fontWeight: "700", fontSize: "16px", color: i === 1 ? "#ef4444" : "rgba(0,0,0,.9)" } }, n),
            h("div", { style: { fontSize: "13px", color: "rgba(0,0,0,.5)" } }, i === 1 ? "Missed · 9:41 AM" : i % 2 ? "Outgoing · Yesterday" : "Incoming · Today")),
          h("span", { style: { color: "#22c55e", display: "flex" } }, svgIcon(I.phone, "", 18)))));

  const people = () =>
    h("div", { class: "app-scroll no-sb", style: { padding: "70px 20px 96px" } },
      h("h1", { style: { fontSize: "30px", fontWeight: "700", color: "rgba(0,0,0,.9)", marginBottom: "20px" } }, "People"),
      h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" } },
        ...NAMES.map((n, i) =>
          h("div", { class: "pressable card-white", style: { padding: "20px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", cursor: "pointer" }, onClick: () => thread(n, i + 20) },
            (() => { const im = img(`/img/avatar/a-${i + 20}.jpg`); im.style.cssText = "width:64px;height:64px;border-radius:50%;object-fit:cover;background:#e5e7eb"; return im; })(),
            h("div", { style: { fontWeight: "700", fontSize: "14px", color: "rgba(0,0,0,.9)", textAlign: "center" } }, n)))));

  const toggleRow = (label: string, on: boolean) => {
    const knob = h("div", { style: { position: "absolute", top: "2px", left: on ? "22px" : "2px", width: "28px", height: "28px", borderRadius: "50%", background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,.25)", transition: "left .18s" } });
    const t = h("button", { class: "pressable", style: { position: "relative", width: "52px", height: "32px", borderRadius: "16px", background: on ? "#22c55e" : "#d1d5db", transition: "background .2s", flexShrink: "0" } },
      knob);
    t.onmousedown = () => {
      const next = t.style.background.includes("34,197,94") || t.style.background.includes("rgb(34, 197, 94)") ? false : true;
      t.style.background = next ? "#22c55e" : "#d1d5db";
      knob.style.left = next ? "22px" : "2px";
    };
    return h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: "#fff", borderRadius: "18px", marginBottom: "10px", boxShadow: "0 2px 8px rgba(0,0,0,.04)" } },
      h("span", { style: { fontWeight: "600", fontSize: "16px", color: "rgba(0,0,0,.85)" } }, label), t);
  };

  const settings = () =>
    h("div", { class: "app-scroll no-sb", style: { padding: "70px 20px 96px" } },
      h("h1", { style: { fontSize: "30px", fontWeight: "700", color: "rgba(0,0,0,.9)", marginBottom: "20px" } }, "Messages Settings"),
      toggleRow("iMessage", true),
      toggleRow("Send Read Receipts", true),
      toggleRow("Notifications", true),
      toggleRow("Low Quality Image Mode", false),
      toggleRow("Filter Unknown Senders", false));

  const render = () => {
    stage.replaceChildren(...(
      tab === "chats"
        ? [header, h("div", { class: "app-scroll no-sb", style: { padding: "8px 16px 96px" } }, stories, convos)]
        : tab === "calls" ? [calls()]
        : tab === "people" ? [people()]
        : [settings()]));
  };
  render();
  root.append(stage);

  const bar = FloatingTabBar(TABS, "chats", (id) => { tab = id; render(); });
  root.append(bar.el);
  return root;
}

const TABS = [
  { id: "chats", icon: "messageCircle" as const, label: "Chats" },
  { id: "calls", icon: "phone" as const, label: "Calls" },
  { id: "people", icon: "user" as const, label: "People" },
  { id: "settings", icon: "settings" as const, label: "Settings" },
];
