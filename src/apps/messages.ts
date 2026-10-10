// messages.ts — conversations réelles : fils de discussion, envoi + réponse
// simulée, onglets chats/calls/people/settings fonctionnels.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { GlassHeader, FloatingTabBar, img, pane, toast } from "./ui";

interface Msg { me?: boolean; text?: string; im?: string }
interface Convo { name: string; avatar: string; time: string; unread?: number; msgs: Msg[] }

const CONVOS: Convo[] = [
  { name: "Alex Morgan", avatar: "/img/avatar/a-2.jpg", time: "9:41 AM", unread: 2, msgs: [
    { text: "Did you see the new build?" }, { text: "The animations are insane 🤯" },
    { me: true, text: "Just tested it — the morph is perfect" }, { im: "/img/photos/ph-4.jpg", text: "Look at this" }] },
  { name: "Jordan Lee", avatar: "/img/avatar/a-5.jpg", time: "8:15 AM", msgs: [
    { text: "Lunch at the usual place?" }, { me: true, text: "12:30 works" }, { text: "Perfect, see you there" }] },
  { name: "Sam Rivera", avatar: "/img/avatar/a-8.jpg", time: "Yesterday", msgs: [
    { me: true, text: "Can you review my PR?" }, { text: "On it — looks clean, one comment" }, { text: "Ship it 🚢" }] },
  { name: "Mom", avatar: "/img/avatar/a-12.jpg", time: "Yesterday", msgs: [
    { text: "Call me when you can ❤️" }, { me: true, text: "Will do tonight!" }] },
  { name: "Design Team", avatar: "/img/avatar/a-16.jpg", time: "Thursday", msgs: [
    { text: "New mockups are in Figma" }, { text: "The glass theme got approved" }, { me: true, text: "Nice, porting it now" }] },
  { name: "Chris Park", avatar: "/img/avatar/a-21.jpg", time: "Tuesday", msgs: [
    { text: "Game night Friday?" }, { me: true, text: "I'm in. Bringing Mario Kart" }] },
];

const REPLIES = ["Sounds good!", "Haha nice", "On my way", "Let me check and get back to you", "👍", "Perfect — thanks!"];

function thread(host: HTMLElement, c: Convo, markRead: () => void) {
  markRead();
  pane(host, (close) => {
    const list = h("div", { class: "no-sb", style: { flex: "1", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", padding: "8px 16px 16px" } });
    const draw = () => {
      list.replaceChildren(...c.msgs.map((m) => m.im
        ? h("div", { class: "bub im " + (m.me ? "me" : "them") }, img(m.im))
        : h("div", { class: "bub " + (m.me ? "me" : "them") }, m.text ?? "")));
      list.scrollTop = list.scrollHeight;
    };
    const input = h("input", { attrs: { type: "text", placeholder: "iMessage" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "15px" } }) as HTMLInputElement;
    const send = () => {
      const t = input.value.trim(); if (!t) return;
      c.msgs.push({ me: true, text: t }); input.value = ""; draw();
      setTimeout(() => { c.msgs.push({ text: REPLIES[Math.floor(Math.random() * REPLIES.length)] }); draw(); }, 1200);
    };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
    draw();
    return h("div", { class: "pg", style: { background: "#f4f4f5", height: "100%", display: "flex", flexDirection: "column" } },
      h("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "60px 16px 10px", background: "rgba(244,244,245,.9)" } },
        h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: close }, svgIcon(I.chevronLeft, "", 18)),
        h("div", { style: { width: "44px", height: "44px", borderRadius: "50%", overflow: "hidden", flex: "none" } }, img(c.avatar)),
        h("div", { style: { flex: "1" } },
          h("div", { style: { fontWeight: "700", fontSize: "16px" } }, c.name),
          h("div", { style: { fontSize: "11px", color: "#22c55e", fontWeight: "600" } }, "Online")),
        h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" } }, svgIcon(I.video, "", 16)),
        h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" } }, svgIcon(I.phone, "", 16))),
      list,
      h("div", { style: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px 96px" } },
        h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", flex: "none" } }, svgIcon(I.plus, "", 16)),
        h("div", { class: "search-pill", style: { flex: "1" } }, input),
        h("button", { class: "pressable", style: { width: "36px", height: "36px", borderRadius: "50%", background: "#22c55e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }, onClick: send }, svgIcon(I.arrowUp, "", 16))));
  });
}

export function MessagesApp() {
  const root = h("div", { class: "pg", style: { height: "100%", display: "flex", flexDirection: "column", background: "#f4f4f5" } });
  const scroll = h("div", { class: "app-scroll no-sb", style: { padding: "0 16px 120px" } });

  const convoRow = (c: Convo) => h("div", { class: "lrow pressable", onClick: () => thread(root, c, () => { c.unread = 0; show("chats"); }) },
    img(c.avatar, "av rd"),
    h("div", { class: "tx" },
      h("div", { class: "t1" }, c.name),
      h("div", { class: "t2" }, c.msgs[c.msgs.length - 1].text ?? "📷 Photo")),
    h("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flex: "none" } },
      h("span", { class: "rt" }, c.time),
      c.unread ? h("span", { style: { background: "#22c55e", color: "#fff", fontSize: "11px", fontWeight: "700", minWidth: "18px", height: "18px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" } }, String(c.unread)) : null));

  const show = (tab: string) => {
    scroll.replaceChildren();
    if (tab === "chats") {
      const input = h("input", { attrs: { placeholder: "Search" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "14px" } }) as HTMLInputElement;
      const list = h("div", { class: "card-white", style: { padding: "2px 14px" } });
      const draw = () => {
        const q = input.value.trim().toLowerCase();
        list.replaceChildren(...CONVOS.filter((c) => c.name.toLowerCase().includes(q)).map(convoRow));
      };
      input.addEventListener("input", draw); draw();
      scroll.append(h("div", { class: "search-pill", style: { margin: "2px 0 8px" } }, svgIcon(I.search), input), list);
    } else if (tab === "calls") {
      scroll.append(h("div", { class: "card-white", style: { padding: "2px 14px" } },
        ...[["Alex Morgan", "phoneOutgoing", "Today, 9:10 AM"], ["Mom", "phoneIncoming", "Yesterday"], ["Jordan Lee", "phoneMissed", "Yesterday"], ["Sam Rivera", "phoneOutgoing", "Monday"]].map(([n, ic, t], i) =>
          h("div", { class: "lrow" },
            h("div", { class: "set-ic", style: { background: ic === "phoneMissed" ? "#ef4444" : "#22c55e" } }, svgIcon(I[ic as keyof typeof I])),
            h("div", { class: "tx" }, h("div", { class: "t1", style: { color: ic === "phoneMissed" ? "#ef4444" : "#111" } }, n), h("div", { class: "t2" }, t)),
            h("button", { class: "pressable", style: { color: "#2563eb" } }, svgIcon(I.info, "", 20))))));
    } else if (tab === "people") {
      scroll.append(h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", padding: "4px" } },
        ...CONVOS.map((c) => h("div", { class: "pressable", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }, onClick: () => thread(root, c, () => { c.unread = 0; }) },
          h("div", { style: { width: "72px", height: "72px", borderRadius: "24px", overflow: "hidden" } }, img(c.avatar)),
          h("span", { style: { fontSize: "12px", fontWeight: "600" } }, c.name.split(" ")[0])))));
    } else {
      scroll.append(h("div", { class: "card-white", style: { padding: "2px 14px" } },
        ...["Notifications", "Message previews", "Send read receipts", "Filter unknown senders"].map((l, i) =>
          h("div", { class: "lrow", style: { justifyContent: "space-between" } }, h("span", { style: { fontWeight: "600", fontSize: "15px" } }, l),
            h("button", { class: "sw" + (i < 2 ? " on" : ""), onClick: (e) => (e.currentTarget as HTMLElement).classList.toggle("on") }, h("i"))))));
    }
  };

  const tabs = FloatingTabBar([
    { id: "chats", icon: "messageCircle", label: "Chats" },
    { id: "calls", icon: "phone", label: "Calls" },
    { id: "people", icon: "users", label: "People" },
    { id: "settings", icon: "settings", label: "Settings" },
  ], "chats", show);

  show("chats");
  root.append(
    GlassHeader("Messages", { large: true, action: "pencil" }),
    scroll, tabs.el,
    h("button", { class: "app-fab", style: { width: "56px", height: "56px", right: "20px", bottom: "116px", background: "#22c55e", color: "#fff" },
      onClick: () => toast(root, "New message — pick a conversation") }, svgIcon(I.pencil)));
  return root;
}
