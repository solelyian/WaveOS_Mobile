// mail.ts — Mail : inbox réelle, détail par mail, composer, recherche live.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";

interface Mail {
  from: string; initial: string; color: string;
  subj: string; prev: string; time: string; body: string; unread?: boolean;
}

export function MailApp() {
  const root = h("div", { style: { height: "100%", display: "flex", flexDirection: "column", position: "relative" } });
  const mails: Mail[] = [
    { from: "Nyne Support", initial: "N", color: "#000", subj: "New Login Detected on MacBook Pro", prev: "We detected a new login from a device you don't usually use...", time: "10:42 AM", unread: true, body: "Your Nyne ID was used to sign in to a new device in San Francisco. If this wasn't you, please change your password immediately." },
    { from: "GitHub", initial: "G", color: "#24292f", subj: "[WaveOS_Mobile] PR #3 merged", prev: "solelyian merged commit 2186c6a into devin/1791399182-sillage-prototype...", time: "9:15 AM", body: "Merged: feat: Weather refaite style HarmonyOS. 4 files changed, +481 −67. View the pull request on GitHub." },
    { from: "Linear", initial: "L", color: "#5e6ad2", subj: "WAV-128 assigned to you", prev: "Weather app — polish pass on remaining apps...", time: "Yesterday", body: "Ian assigned WAV-128 to you: \"The apps needs some fixing here and there.\" Priority: high. Due end of week." },
    { from: "Figma", initial: "F", color: "#f24e1e", subj: "Weekly digest", prev: "12 new comments in WaveOS Design System...", time: "Yesterday", body: "This week in WaveOS Design System: 12 new comments, 4 resolved threads, 2 new components published." },
    { from: "Apple", initial: "A", color: "#555", subj: "Your receipt from App Store", prev: "Purchase: Procreate — $12.99...", time: "Friday", body: "Dear Customer, this is a receipt for your purchase of Procreate ($12.99) on the App Store. Invoice #INV-2044." },
    { from: "Mom", initial: "M", color: "#b45309", subj: "Dinner Sunday?", prev: "Are you still coming? Bring dessert...", time: "Thursday", body: "Hi! Are you still coming Sunday around 6? Your sister will be there too. Can you bring dessert? Love, Mom" },
  ];
  let query = "";

  const compose = (prefill?: { to: string; subj: string }) => {
    const to = h("input", { attrs: { type: "text", placeholder: "To:" }, style: { width: "100%", padding: "12px 0", borderBottom: "1px solid #e5e7eb", outline: "none", fontSize: "15px", background: "transparent" } }) as HTMLInputElement;
    const subj = h("input", { attrs: { type: "text", placeholder: "Subject:" }, style: { width: "100%", padding: "12px 0", borderBottom: "1px solid #e5e7eb", outline: "none", fontSize: "15px", background: "transparent" } }) as HTMLInputElement;
    const body = h("textarea", { attrs: { placeholder: "Message…", rows: "8" }, style: { flex: "1", padding: "16px 0", outline: "none", border: "none", resize: "none", fontSize: "16px", fontFamily: "inherit", background: "transparent" } }) as HTMLTextAreaElement;
    if (prefill) { to.value = prefill.to; subj.value = prefill.subj; }
    const close = () => { ov.style.opacity = "0"; sheet.style.transform = "translateY(100%)"; setTimeout(() => ov.remove(), 250); };
    const send = () => {
      mails.unshift({
        from: `To: ${to.value.trim() || "—"}`, initial: "✉", color: "#3b82f6",
        subj: subj.value.trim() || "(no subject)", prev: body.value.trim() || "…",
        time: "Now", body: body.value.trim() || "…",
      });
      paint();
      close();
    };
    const sheet = h("div", { style: { position: "absolute", left: "0", right: "0", bottom: "0", height: "70%", background: "#fff", borderRadius: "28px 28px 0 0", padding: "0 20px 24px", display: "flex", flexDirection: "column", transform: "translateY(100%)", transition: "transform .28s cubic-bezier(.32,.72,.35,1)", boxShadow: "0 -10px 40px rgba(0,0,0,.18)" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", borderBottom: "1px solid #e5e7eb" } },
        h("button", { class: "pressable", style: { color: "#3b82f6", fontWeight: "500" }, onClick: close }, "Cancel"),
        h("span", { style: { fontWeight: "700" } }, "New Message"),
        h("button", { class: "pressable", style: { color: "#3b82f6", fontWeight: "700", display: "flex" }, onClick: send }, svgIcon(I.send, "", 18))),
      to, subj, body);
    const ov = h("div", { style: { position: "absolute", inset: "0", zIndex: "30", background: "rgba(0,0,0,.12)", opacity: "0", transition: "opacity .25s" } }, sheet);
    root.append(ov);
    requestAnimationFrame(() => { ov.style.opacity = "1"; sheet.style.transform = "none"; });
  };

  const openDetail = (m: Mail) => {
    m.unread = false;
    const close = () => { d.style.opacity = "0"; d.style.transform = "translateX(50px)"; setTimeout(() => { d.remove(); paint(); }, 200); };
    const removeMail = () => { mails.splice(mails.indexOf(m), 1); close(); };
    const act = (icon: string, fn: () => void, tint = "#3b82f6") =>
      h("button", { class: "pressable", style: { color: tint, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "600" }, onClick: fn }, svgIcon(icon as never, "", 20));
    const d = h("div", { style: { position: "absolute", inset: "0", zIndex: "20", background: "#f8fafc", display: "flex", flexDirection: "column", paddingTop: "48px", transform: "translateX(50px)", opacity: "0", transition: "all .2s" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: "1px solid #e5e7eb", background: "rgba(255,255,255,.5)", backdropFilter: "blur(12px)" } },
        h("button", { class: "pressable", style: { display: "flex", alignItems: "center", color: "#3b82f6", fontWeight: "500" }, onClick: close },
          svgIcon(I.chevronLeft), "Inbox"),
        h("div", { style: { fontSize: "12px", color: "#9ca3af" } }, m.time)),
      h("div", { class: "app-scroll no-sb", style: { flex: "1", padding: "24px" } },
        h("h1", { style: { fontSize: "24px", fontWeight: "700", marginBottom: "24px" } }, m.subj),
        h("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" } },
          h("div", { style: { width: "40px", height: "40px", borderRadius: "50%", background: m.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", flexShrink: "0" } }, m.initial),
          h("div", {}, h("div", { style: { fontWeight: "700" } }, m.from), h("div", { style: { fontSize: "12px", color: "#6b7280" } }, "To: You"))),
        h("p", { style: { color: "#374151", lineHeight: "1.6", fontSize: "17px" } }, m.body)),
      h("div", { style: { display: "flex", justifyContent: "space-around", padding: "14px 24px 36px", borderTop: "1px solid #e5e7eb", background: "rgba(255,255,255,.6)", backdropFilter: "blur(12px)" } },
        act(I.reply, () => { close(); setTimeout(() => compose({ to: m.from, subj: `Re: ${m.subj}` }), 220); }),
        act(I.archive, removeMail, "#f59e0b"),
        act(I.trash2, removeMail, "#ef4444")));
    root.append(d);
    requestAnimationFrame(() => { d.style.opacity = "1"; d.style.transform = "none"; });
  };

  const row = (m: Mail) =>
    h("div", { class: "pressable card-white", style: { padding: "16px", display: "flex", flexDirection: "column", gap: "4px", position: "relative", overflow: "hidden" }, onClick: () => openDetail(m) },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
        h("span", { style: { fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", color: "rgba(0,0,0,.9)" } },
          m.unread ? h("span", { style: { width: "10px", height: "10px", borderRadius: "50%", background: "#3b82f6", boxShadow: "0 1px 2px rgba(0,0,0,.1)", flexShrink: "0" } }) : null,
          m.from),
        h("span", { style: { fontSize: "12px", color: "rgba(0,0,0,.4)", flexShrink: "0" } }, m.time)),
      h("span", { style: { fontWeight: "600", fontSize: "14px", marginTop: "4px", color: "rgba(0,0,0,.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, m.subj),
      h("span", { style: { fontSize: "12px", color: "rgba(0,0,0,.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" } }, m.prev));

  const list = h("div", { class: "app-scroll no-sb", style: { padding: "0 16px 80px", display: "flex", flexDirection: "column", gap: "12px" } });
  const paint = () => {
    const q = query.trim().toLowerCase();
    const hits = q ? mails.filter((m) => (m.from + m.subj + m.prev).toLowerCase().includes(q)) : mails;
    list.replaceChildren(...(hits.length
      ? hits.map(row)
      : [h("div", { style: { textAlign: "center", color: "rgba(0,0,0,.4)", padding: "40px 0", fontSize: "14px" } }, `No mail matching “${query}”`)]));
  };
  paint();

  const searchInput = h("input", {
    attrs: { type: "search", placeholder: "Search" },
    style: { flex: "1", border: "none", outline: "none", background: "transparent", fontSize: "14px", fontFamily: "inherit" },
  }) as HTMLInputElement;
  searchInput.addEventListener("input", () => { query = searchInput.value; paint(); });

  root.append(
    h("div", { style: { padding: "64px 24px 8px" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
        h("span", { style: { color: "#3b82f6", fontWeight: "500" } }, `${mails.length} messages`),
        h("h1", { style: { fontSize: "24px", fontWeight: "700" } }, "Inbox"),
        h("span", { style: { color: "#3b82f6" } }, svgIcon(I.layoutGrid, "", 20))),
      h("div", { class: "search-pill", style: { marginTop: "16px" } }, svgIcon(I.search, "", 16), searchInput)),
    list,
    h("div", { style: { position: "absolute", bottom: "32px", right: "24px", zIndex: "10" } },
      h("button", { class: "app-fab pressable", style: { position: "static", width: "56px", height: "56px", background: "#3b82f6", color: "#fff", border: "1px solid #60a5fa" }, onClick: () => compose() }, svgIcon(I.plus, "", 28))));
  return root;
}
