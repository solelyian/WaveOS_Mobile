// messages.ts — Messages : en-tête verre, stories, 8 conversations, tab bar.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { FloatingTabBar, img } from "./ui";

export function MessagesApp() {
  const root = h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative", zIndex: "10" } });

  const header = h("div", { class: "g-light", style: { padding: "64px 24px 16px", background: "rgba(255,255,255,.6)", borderRadius: "0 0 32px 32px", marginBottom: "8px", zIndex: "20" } },
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" } },
      h("div", { style: { color: "#3b82f6", fontWeight: "500" } }, "Edit"),
      h("div", { class: "pressable", style: { padding: "8px", background: "#3b82f6", color: "#fff", borderRadius: "50%", boxShadow: "0 4px 12px rgba(59,130,246,.3)", display: "flex" } }, svgIcon(I.send, "", 18))),
    h("h1", { style: { fontSize: "30px", fontWeight: "700", color: "rgba(0,0,0,.9)", marginBottom: "16px" } }, "Messages"),
    h("div", { class: "search-pill" }, svgIcon(I.search, "", 16), h("span", {}, "Search")));

  const stories = h("div", { class: "no-sb", style: { display: "flex", gap: "16px", overflowX: "auto", padding: "8px 0 8px 8px", marginBottom: "16px" } },
    ...[1, 2, 3, 4, 5].map((i) =>
      h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: "0" } },
        h("div", { style: { width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(45deg,#60a5fa,#4ade80)", padding: "2px", boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)" } },
          h("div", { style: { width: "100%", height: "100%", borderRadius: "50%", background: "#fff", padding: "2px" } },
            (() => { const im = img(`/img/avatar/a-${i + 10}.jpg`); im.style.cssText = "width:100%;height:100%;border-radius:50%;object-fit:cover"; return im; })())),
        h("span", { style: { fontSize: "10px", fontWeight: "700", color: "rgba(0,0,0,.5)" } }, `User ${i}`))));

  const convos = h("div", { style: { display: "flex", flexDirection: "column", gap: "12px" } },
    ...Array.from({ length: 8 }, (_, i) =>
      h("div", { class: "pressable card-white", style: { padding: "16px", display: "flex", gap: "16px", alignItems: "center" } },
        h("div", { style: { position: "relative", flexShrink: "0" } },
          (() => { const im = img(`/img/avatar/a-${i + 20}.jpg`); im.style.cssText = "width:56px;height:56px;border-radius:50%;object-fit:cover;background:#e5e7eb;border:1px solid #f3f4f6"; return im; })(),
          i < 3 ? h("div", { style: { position: "absolute", top: "-4px", right: "-4px", width: "16px", height: "16px", background: "#3b82f6", borderRadius: "50%", border: "2px solid #fff", boxShadow: "0 1px 2px rgba(0,0,0,.1)" } }) : null),
        h("div", { style: { flex: "1", minWidth: "0" } },
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" } },
            h("span", { style: { fontWeight: "700", color: "rgba(0,0,0,.9)", fontSize: "18px" } }, "Alex Morgan"),
            h("span", { style: { fontSize: "12px", color: "rgba(0,0,0,.4)", fontWeight: "700" } }, `10:${10 + i} AM`)),
          h("div", { style: { fontSize: "14px", color: "rgba(0,0,0,.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: "500" } }, i === 0 ? "Hey, are we still on for lunch?" : "Sent a photo")),
        h("span", { style: { color: "#d1d5db", transform: "rotate(180deg)", display: "flex", flexShrink: "0" } }, svgIcon(I.chevronLeft, "", 16)))));

  root.append(header,
    h("div", { class: "app-scroll no-sb", style: { padding: "8px 16px 96px" } }, stories, convos));

  let tab = "chats";
  const retab = (id: string) => { tab = id; const nb = FloatingTabBar(TABS, tab, retab); bar.replaceWith(nb); bar = nb; };
  let bar = FloatingTabBar(TABS, tab, retab);
  root.append(bar);
  return root;
}

const TABS = [
  { id: "chats", icon: "messageCircle" as const, label: "Chats" },
  { id: "calls", icon: "phone" as const, label: "Calls" },
  { id: "people", icon: "user" as const, label: "People" },
  { id: "settings", icon: "settings" as const, label: "Settings" },
];
