// mail.ts — Mail : inbox, vue détail, bouton composer (maquette).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";

export function MailApp() {
  const root = h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative" } });

  const openDetail = () => {
    const d = h("div", { style: { position: "absolute", inset: "0", zIndex: "20", background: "#f8fafc", display: "flex", flexDirection: "column", paddingTop: "48px", transform: "translateX(50px)", opacity: "0", transition: "all .2s" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: "1px solid #e5e7eb", background: "rgba(255,255,255,.5)", backdropFilter: "blur(12px)" } },
        h("button", { style: { display: "flex", alignItems: "center", color: "#3b82f6", fontWeight: "500" }, onClick: () => { d.style.opacity = "0"; d.style.transform = "translateX(50px)"; setTimeout(() => d.remove(), 200); } },
          svgIcon(I.chevronLeft), "Lists"),
        h("div", { style: { display: "flex", gap: "24px", color: "#3b82f6" } }, svgIcon(I.arrowUp), svgIcon(I.share))),
      h("div", { style: { padding: "24px" } },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" } },
          h("h1", { style: { fontSize: "24px", fontWeight: "700" } }, "New Login Detected"),
          h("span", { style: { fontSize: "12px", color: "#9ca3af" } }, "10:42 AM")),
        h("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" } },
          h("div", { style: { width: "40px", height: "40px", borderRadius: "50%", background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" } }, "A"),
          h("div", {}, h("div", { style: { fontWeight: "700" } }, "Nyne Support"), h("div", { style: { fontSize: "12px", color: "#6b7280" } }, "To: You"))),
        h("p", { style: { color: "#374151", lineHeight: "1.6", fontSize: "18px" } }, "Your Nyne ID was used to sign in to a new device. If this wasn't you, please change your password immediately.")));
    root.append(d);
    requestAnimationFrame(() => { d.style.opacity = "1"; d.style.transform = "none"; });
  };

  root.append(
    h("div", { style: { padding: "64px 24px 8px" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
        h("button", { style: { color: "#3b82f6", fontWeight: "500" } }, "Edit"),
        h("h1", { style: { fontSize: "24px", fontWeight: "700" } }, "Inbox"),
        h("button", { style: { color: "#3b82f6" } }, svgIcon(I.layoutGrid, "", 20))),
      h("div", { class: "search-pill", style: { marginTop: "16px" } }, svgIcon(I.search, "", 16), h("span", {}, "Search"))),
    h("div", { class: "app-scroll no-sb", style: { padding: "0 16px 80px", display: "flex", flexDirection: "column", gap: "12px" } },
      ...Array.from({ length: 6 }, (_, i) =>
        h("div", { class: "pressable card-white", style: { padding: "16px", display: "flex", flexDirection: "column", gap: "4px", position: "relative", overflow: "hidden" }, onClick: openDetail },
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
            h("span", { style: { fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", color: "rgba(0,0,0,.9)" } },
              i === 0 ? h("span", { style: { width: "10px", height: "10px", borderRadius: "50%", background: "#3b82f6", boxShadow: "0 1px 2px rgba(0,0,0,.1)" } }) : null,
              "Nyne Support"),
            h("span", { style: { fontSize: "12px", color: "rgba(0,0,0,.4)" } }, `10:4${i} AM`)),
          h("span", { style: { fontWeight: "500", fontSize: "14px", marginTop: "4px", color: "rgba(0,0,0,.8)" } }, "New Login Detected on MacBook Pro..."),
          h("span", { style: { fontSize: "12px", color: "rgba(0,0,0,.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" } }, "We detected a new login from a device you don't usually use...")))),
    h("div", { style: { position: "absolute", bottom: "32px", right: "24px", zIndex: "10" } },
      h("button", { class: "app-fab pressable", style: { position: "static", width: "56px", height: "56px", background: "#3b82f6", color: "#fff", border: "1px solid #60a5fa" } }, svgIcon(I.plus, "", 28))));
  return root;
}
