// messages.ts — conversations vivantes : fils de discussion avec envoi,
// indicateur de frappe + réponse simulée, envoi de photos, nouveau message
// (création de conversation), appels avec fiche contact, réglages.
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

// contacts sans conversation — proposés par le composer « New Message »
const MORE: [string, string][] = [
  ["Taylor Kim", "/img/avatar/a-24.jpg"], ["Casey Kim", "/img/avatar/a-18.jpg"], ["Robin Park", "/img/avatar/a-26.jpg"],
];

const REPLIES = ["Sounds good!", "Haha nice", "On my way", "Let me check and get back to you", "👍", "Perfect — thanks!"];
const CALLS: [string, string, string][] = [
  ["Alex Morgan", "phoneOutgoing", "Today, 9:10 AM"], ["Mom", "phoneIncoming", "Yesterday"],
  ["Jordan Lee", "phoneMissed", "Yesterday"], ["Sam Rivera", "phoneOutgoing", "Monday"],
];
const PHOTOS = [3, 4, 7, 9, 11, 15, 18, 22, 26];

export function MessagesApp() {
  const root = h("div", { class: "pg", style: { height: "100%", display: "flex", flexDirection: "column", background: "#f4f4f5" } });
  const scroll = h("div", { class: "app-scroll no-sb", style: { padding: "0 16px 120px" } });
  let curTab = "chats";

  // ---- fiche contact -------------------------------------------------------
  const contactCard = (name: string, avatar: string) => pane(root, (close) =>
    h("div", { class: "pg", style: { background: "#f4f4f5", height: "100%", display: "flex", flexDirection: "column" } },
      h("div", { style: { display: "flex", alignItems: "center", padding: "60px 16px 4px" } },
        h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: close }, svgIcon(I.chevronLeft, "", 18))),
      h("div", { style: { flex: "1", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "30px" } },
        h("div", { style: { width: "96px", height: "96px", borderRadius: "50%", overflow: "hidden", marginBottom: "12px", boxShadow: "0 12px 30px rgba(0,0,0,.15)" } }, img(avatar, "img-fill")),
        h("div", { style: { fontSize: "22px", fontWeight: "800" } }, name),
        h("div", { style: { fontSize: "12px", color: "#22c55e", fontWeight: "600", marginTop: "3px" } }, "Online"),
        h("div", { style: { display: "flex", gap: "16px", marginTop: "24px" } },
          ...([["messageCircle", "Message", "#22c55e", () => { close(); openConvo(convoFor(name, avatar)); }],
               ["phone", "Call", "#2563eb", () => toast(root, `Calling ${name.split(" ")[0]}…`)],
               ["video", "FaceTime", "#0ea5e9", () => toast(root, "Starting FaceTime…")]] as [keyof typeof I, string, string, () => void][]).map(([ic, l, bg, fn]) =>
            h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" } },
              h("button", { class: "pressable", style: { width: "54px", height: "54px", borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: fn }, svgIcon(I[ic], "", 20)),
              h("span", { style: { fontSize: "11px", color: "#6b7280", fontWeight: "600" } }, l)))))));

  // ---- fil de discussion ---------------------------------------------------
  const thread = (c: Convo) => {
    c.unread = 0;
    pane(root, (close) => {
      const list = h("div", { class: "no-sb", style: { flex: "1", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", padding: "8px 16px 16px" } });
      const draw = () => {
        list.replaceChildren(...c.msgs.map((m) => m.im
          ? h("div", { class: "bub im " + (m.me ? "me" : "them") }, img(m.im))
          : h("div", { class: "bub " + (m.me ? "me" : "them") }, m.text ?? "")));
        list.scrollTop = list.scrollHeight;
      };
      const reply = () => {
        const typing = h("div", { class: "bub them typing" }, h("i"), h("i"), h("i"));
        list.append(typing); list.scrollTop = list.scrollHeight;
        setTimeout(() => {
          typing.remove();
          c.msgs.push({ text: REPLIES[Math.floor(Math.random() * REPLIES.length)] });
          draw();
        }, 1100 + Math.random() * 800);
      };
      const input = h("input", { attrs: { type: "text", placeholder: "iMessage" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "15px" } }) as HTMLInputElement;
      const send = () => {
        const t = input.value.trim(); if (!t) return;
        c.msgs.push({ me: true, text: t }); input.value = ""; draw(); reply();
      };
      const sendPhoto = (src: string) => { c.msgs.push({ me: true, im: src }); draw(); reply(); };
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });

      const photoPicker = () => pane(root, (close2) =>
        h("div", { class: "pg", style: { background: "#f4f4f5", height: "100%", display: "flex", flexDirection: "column" } },
          h("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "60px 16px 10px" } },
            h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: close2 }, svgIcon(I.x, "", 16)),
            h("span", { style: { fontWeight: "700", fontSize: "17px" } }, "Send a photo")),
          h("div", { class: "no-sb", style: { flex: "1", overflowY: "auto", padding: "6px 16px 40px" } },
            h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" } },
              ...PHOTOS.map((i) => h("div", { class: "pressable", style: { aspectRatio: "1", borderRadius: "14px", overflow: "hidden", cursor: "pointer" },
                onClick: () => { close2(); sendPhoto(`/img/photos/ph-${i}.jpg`); } },
                img(`/img/photos/ph-${i}.jpg`, "img-fill")))))));

      draw();
      return h("div", { class: "pg", style: { background: "#f4f4f5", height: "100%", display: "flex", flexDirection: "column" } },
        h("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "60px 16px 10px", background: "rgba(244,244,245,.9)" } },
          h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: () => { show(curTab); close(); } }, svgIcon(I.chevronLeft, "", 18)),
          h("button", { class: "pressable", style: { width: "44px", height: "44px", borderRadius: "50%", overflow: "hidden", flex: "none" }, onClick: () => contactCard(c.name, c.avatar) }, img(c.avatar)),
          h("button", { style: { flex: "1", textAlign: "left" }, onClick: () => contactCard(c.name, c.avatar) },
            h("div", { style: { fontWeight: "700", fontSize: "16px" } }, c.name),
            h("div", { style: { fontSize: "11px", color: "#22c55e", fontWeight: "600" } }, "Online")),
          h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }, onClick: () => toast(root, "Starting FaceTime…") }, svgIcon(I.video, "", 16)),
          h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }, onClick: () => toast(root, `Calling ${c.name.split(" ")[0]}…`) }, svgIcon(I.phone, "", 16))),
        list,
        h("div", { style: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px 96px" } },
          h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", flex: "none" }, onClick: photoPicker }, svgIcon(I.plus, "", 16)),
          h("div", { class: "search-pill", style: { flex: "1" } }, input),
          h("button", { class: "pressable", style: { width: "36px", height: "36px", borderRadius: "50%", background: "#22c55e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }, onClick: send }, svgIcon(I.arrowUp, "", 16))));
    });
  };

  const convoFor = (name: string, avatar: string) => {
    let c = CONVOS.find((x) => x.name === name);
    if (!c) { c = { name, avatar, time: "now", msgs: [] }; CONVOS.unshift(c); }
    return c;
  };
  const openConvo = (c: Convo) => { c.unread = 0; thread(c); };

  // ---- composer « New Message » --------------------------------------------
  const newMessage = () => pane(root, (close) => {
    const all: [string, string][] = [...CONVOS.map((c) => [c.name, c.avatar] as [string, string]), ...MORE];
    const input = h("input", { attrs: { placeholder: "To:" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "15px" } }) as HTMLInputElement;
    const list = h("div", { class: "card-white", style: { margin: "0 16px", padding: "2px 14px" } });
    const draw = () => {
      const q = input.value.trim().toLowerCase();
      const hits = all.filter(([n]) => !q || n.toLowerCase().includes(q));
      list.replaceChildren(...(hits.length ? hits.map(([n, a]) =>
        h("div", { class: "lrow pressable", onClick: () => { close(); openConvo(convoFor(n, a)); } },
          img(a, "av rd"), h("div", { class: "tx" }, h("div", { class: "t1" }, n)),
          h("span", { class: "chev", style: { color: "#d1d5db", transform: "rotate(180deg)" } }, svgIcon(I.chevronLeft, "", 16))))
        : [h("div", { style: { padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: "14px" } }, "No contact")]));
    };
    input.addEventListener("input", draw); draw();
    setTimeout(() => input.focus(), 80);
    return h("div", { class: "pg", style: { background: "#f4f4f5", height: "100%", display: "flex", flexDirection: "column" } },
      h("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "60px 16px 10px" } },
        h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: close }, svgIcon(I.chevronLeft, "", 18)),
        h("span", { style: { fontWeight: "700", fontSize: "17px" } }, "New Message")),
      h("div", { class: "search-pill", style: { margin: "0 16px 10px" } }, svgIcon(I.search), input),
      list);
  });

  const convoRow = (c: Convo) => h("div", { class: "lrow pressable", onClick: () => openConvo(c) },
    img(c.avatar, "av rd"),
    h("div", { class: "tx" },
      h("div", { class: "t1" }, c.name),
      h("div", { class: "t2" }, c.msgs.length ? (c.msgs[c.msgs.length - 1].text ?? "📷 Photo") : "New conversation")),
    h("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flex: "none" } },
      h("span", { class: "rt" }, c.time),
      c.unread ? h("span", { style: { background: "#22c55e", color: "#fff", fontSize: "11px", fontWeight: "700", minWidth: "18px", height: "18px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" } }, String(c.unread)) : null));

  const show = (tab: string) => {
    curTab = tab;
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
        ...CALLS.map(([n, ic, t]) => {
          const c = CONVOS.find((x) => x.name === n);
          return h("div", { class: "lrow pressable", onClick: () => c ? contactCard(n, c.avatar) : undefined },
            h("div", { class: "set-ic", style: { background: ic === "phoneMissed" ? "#ef4444" : "#22c55e" } }, svgIcon(I[ic as keyof typeof I])),
            h("div", { class: "tx" }, h("div", { class: "t1", style: { color: ic === "phoneMissed" ? "#ef4444" : "#111" } }, n), h("div", { class: "t2" }, t)),
            h("button", { class: "pressable", style: { color: "#2563eb" }, onClick: (e) => { e.stopPropagation(); if (c) contactCard(n, c.avatar); } }, svgIcon(I.info, "", 20)));
        })));
    } else if (tab === "people") {
      scroll.append(h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", padding: "4px" } },
        ...CONVOS.map((c) => h("div", { class: "pressable", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }, onClick: () => contactCard(c.name, c.avatar) },
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
    GlassHeader("Messages", { large: true, action: "pencil", onAction: newMessage }),
    scroll, tabs.el,
    h("button", { class: "app-fab", style: { width: "56px", height: "56px", right: "20px", bottom: "116px", background: "#22c55e", color: "#fff" },
      onClick: newMessage }, svgIcon(I.pencil)));
  return root;
}
