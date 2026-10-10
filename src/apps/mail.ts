// mail.ts — boîte de réception vivante : dossiers réels (Envoyés, Brouillons,
// Suivis), mails distincts, détail avec reply/archive/trash/flag, composer
// fonctionnel (envoi → Envoyés, fermeture → Brouillons), recherche.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { GlassHeader, FloatingTabBar, img, pane, toast } from "./ui";

type Folder = "inbox" | "sent" | "drafts";
interface Mail {
  from: string; to?: string; avatar: string; subject: string; preview: string;
  body: string; time: string; unread?: boolean; archived?: boolean;
  flagged?: boolean; folder: Folder;
}

const MAILS: Mail[] = [
  { from: "Nyne Support", avatar: "/img/avatar/a-1.jpg", subject: "New Login Detected", preview: "We noticed a new sign-in to your account from San Francisco, CA…", body: "Hi Ian,\n\nWe noticed a new sign-in to your Nyne account from San Francisco, CA on a Mac.\n\nIf this was you, you can safely ignore this email. If not, secure your account immediately.\n\n— Nyne Support", time: "9:41 AM", unread: true, folder: "inbox" },
  { from: "Design Team", avatar: "/img/avatar/a-4.jpg", subject: "Figma: WaveOS v2 ready", preview: "The new glass components are ready for review…", body: "Hey!\n\nThe WaveOS v2 components are now in Figma — new glass tiles, the app store templates and the dynamic island states.\n\nTake a look when you can!\n\n— Design Team", time: "8:52 AM", unread: true, flagged: true, folder: "inbox" },
  { from: "GitHub", avatar: "/img/avatar/a-9.jpg", subject: "[WaveOS_Mobile] PR #2 updated", preview: "devin pushed 3 new commits to the branch…", body: "devin pushed 3 new commits to devin/1791534600-calque-react:\n\n  • feat: enrich apps with interactive content\n  • feat: add App Store\n  • fix: visual bugs in apps\n\nView it on GitHub.", time: "Yesterday", folder: "inbox" },
  { from: "Calendar", avatar: "/img/avatar/a-11.jpg", subject: "Reminder: Sprint review", preview: "Design Sync starts in 30 minutes…", body: "Sprint review & Design Sync\nToday, 10:00 – 11:00 AM\nNyne HQ — Room 4\n\nJoin: waveos.link/sync", time: "Yesterday", folder: "inbox" },
  { from: "Apple Store", avatar: "/img/avatar/a-15.jpg", subject: "Your receipt", preview: "Thank you for your purchase. Total: $4.99…", body: "Dear Ian,\n\nThank you for your purchase.\n\n  Procreate Pocket — $4.99\n\nYour receipt is attached.\n\n— Apple", time: "Saturday", flagged: true, folder: "inbox" },
  { from: "Jordan Lee", avatar: "/img/avatar/a-5.jpg", subject: "Trip photos 📷", preview: "Here are all the shots from Big Sur — pick your favorites…", body: "Yo!\n\nFinally uploaded the Big Sur trip photos — 120 shots in the shared album.\nPick your favorites, I'm making prints.\n\n— J", time: "Saturday", folder: "inbox" },
  { from: "Me", to: "Design Team", avatar: "/img/contact-john.jpg", subject: "Re: WaveOS v2 glass", preview: "The spring curves look perfect — shipping the morph today…", body: "The spring curves look perfect — shipping the morph today.\n\nI'll send the tokens file over once the WASM build is green.\n\n— Ian", time: "9:02 AM", folder: "sent" },
  { from: "Me", to: "Sam Rivera", avatar: "/img/contact-john.jpg", subject: "Re: Big Sur prints", preview: "Pick shots 12, 34 and 87 — those are the keepers…", body: "Pick shots 12, 34 and 87 — those are the keepers.\n\nThanks for uploading them!\n\n— Ian", time: "Yesterday", folder: "sent" },
  { from: "Me", to: "Mom", avatar: "/img/contact-john.jpg", subject: "Sunday dinner", preview: "Count me in — I'll bring dessert…", body: "Count me in — I'll bring dessert.\n\nLove,\nIan", time: "Monday", folder: "sent" },
  { from: "Me", to: "Alex Morgan", avatar: "/img/contact-john.jpg", subject: "(no subject)", preview: "hey — still need the token values for…", body: "hey — still need the token values for", time: "10:04 AM", folder: "drafts" },
  { from: "Me", to: "Jordan Lee", avatar: "/img/contact-john.jpg", subject: "Print order", preview: "Can you also send the framing options…", body: "Can you also send the framing options for", time: "Yesterday", folder: "drafts" },
];

function mailDetail(host: HTMLElement, m: Mail, refresh: () => void, openComposer: (opts: { to: string; subject: string; body: string }) => void) {
  m.unread = false;
  pane(host, (close) => {
    const flagBtn = h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: m.flagged ? "#f59e0b" : "#2563eb" },
      onClick: (e) => {
        m.flagged = !m.flagged;
        (e.currentTarget as HTMLElement).style.color = m.flagged ? "#f59e0b" : "#2563eb";
        (e.currentTarget as HTMLElement).replaceChildren(svgIcon(I.flag, m.flagged ? "fill" : "", 16) as Node);
        refresh();
        toast(host, m.flagged ? "Flagged" : "Unflagged");
      } }, svgIcon(I.flag, m.flagged ? "fill" : "", 16));
    const who = m.folder === "sent" || m.folder === "drafts" ? `To: ${m.to}` : m.from;
    return h("div", { class: "pg", style: { background: "#f4f4f5", height: "100%", display: "flex", flexDirection: "column" } },
      h("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "60px 16px 10px" } },
        h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: () => { refresh(); close(); } }, svgIcon(I.chevronLeft, "", 18)),
        h("div", { style: { flex: "1" } }),
        flagBtn,
        ...([["archive", () => { m.archived = true; refresh(); close(); toast(host, "Archived"); }], ["trash2", () => { m.archived = true; refresh(); close(); toast(host, "Moved to Bin"); }], ["reply", () => { close(); openComposer({ to: m.folder === "inbox" ? m.from : (m.to ?? ""), subject: m.subject.startsWith("Re:") ? m.subject : `Re: ${m.subject}`, body: `\n\n—— Original message ——\n${m.body}` }); }]] as [keyof typeof I, () => void][]).map(([ic, fn]) =>
          h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }, onClick: fn }, svgIcon(I[ic], "", 16)))),
      h("div", { class: "no-sb", style: { flex: "1", overflowY: "auto", padding: "0 20px 40px" } },
        h("h2", { style: { fontSize: "22px", fontWeight: "700", letterSpacing: "-.01em", margin: "8px 0 14px" } }, m.subject),
        h("div", { class: "card-white", style: { display: "flex", alignItems: "center", gap: "12px", padding: "12px" } },
          img(m.avatar, "av rd"),
          h("div", { style: { flex: "1", minWidth: "0" } },
            h("div", { style: { fontWeight: "700", fontSize: "15px" } }, who),
            h("div", { style: { fontSize: "12px", color: "#9ca3af" } }, m.folder === "inbox" ? "To: ian.alexandre1@pm.me" : "From: ian.alexandre1@pm.me")),
          h("span", { style: { fontSize: "12px", color: "#9ca3af" } }, m.time)),
        h("div", { class: "card-white", style: { marginTop: "14px", padding: "18px" } },
          ...m.body.split("\n\n").map((p) => h("p", { style: { fontSize: "15px", lineHeight: "1.55", color: "#374151", marginBottom: "12px", whiteSpace: "pre-wrap" } }, p))),
        h("button", { class: "pressable", style: { width: "100%", marginTop: "14px", padding: "13px", borderRadius: "16px", background: "#2563eb", color: "#fff", fontWeight: "700", fontSize: "15px" },
          onClick: () => { close(); openComposer({ to: m.folder === "inbox" ? m.from : (m.to ?? ""), subject: m.subject.startsWith("Re:") ? m.subject : `Re: ${m.subject}`, body: `\n\n—— Original message ——\n${m.body}` }); } }, "Reply")));
  });
}

export function MailApp() {
  const root = h("div", { class: "pg", style: { height: "100%", display: "flex", flexDirection: "column", background: "#f4f4f5" } });
  const scroll = h("div", { class: "app-scroll no-sb", style: { padding: "0 16px 120px" } });
  let curTab = "inbox";

  const composer = (opts: { to?: string; subject?: string; body?: string; draft?: Mail } = {}) => {
    pane(root, (close) => {
      const to = h("input", { attrs: { placeholder: "To:" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "15px" } }) as HTMLInputElement;
      const subj = h("input", { attrs: { placeholder: "Subject:" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "15px" } }) as HTMLInputElement;
      const body = h("textarea", { attrs: { placeholder: "Write your message…" }, style: { flex: "1", border: "none", outline: "none", resize: "none", background: "none", fontSize: "15px", lineHeight: "1.5", padding: "14px 20px" } }) as HTMLTextAreaElement;
      to.value = opts.to ?? ""; subj.value = opts.subject ?? ""; body.value = opts.body ?? "";
      const fld = (inp: HTMLElement) => h("div", { style: { display: "flex", padding: "12px 20px", borderBottom: "1px solid rgba(0,0,0,.05)" } }, inp);
      const send = () => {
        if (!to.value.trim() && !subj.value.trim() && !body.value.trim()) { toast(root, "Empty message"); return; }
        if (opts.draft) MAILS.splice(MAILS.indexOf(opts.draft), 1);
        MAILS.unshift({
          from: "Me", to: to.value.trim() || "Unknown", avatar: "/img/contact-john.jpg",
          subject: subj.value.trim() || "(no subject)",
          preview: body.value.trim().split("\n")[0].slice(0, 60) || "(empty)",
          body: body.value.trim(), time: "now", folder: "sent",
        });
        close(); show(curTab); toast(root, "Message sent");
      };
      const dismiss = () => {
        if (to.value.trim() || subj.value.trim() || body.value.trim()) {
          if (opts.draft) {
            opts.draft.to = to.value.trim() || "Unknown";
            opts.draft.subject = subj.value.trim() || "(no subject)";
            opts.draft.body = body.value;
            opts.draft.preview = body.value.trim().split("\n")[0].slice(0, 60) || "(empty)";
          } else {
            MAILS.unshift({
              from: "Me", to: to.value.trim() || "Unknown", avatar: "/img/contact-john.jpg",
              subject: subj.value.trim() || "(no subject)",
              preview: body.value.trim().split("\n")[0].slice(0, 60) || "(empty)",
              body: body.value, time: "now", folder: "drafts",
            });
          }
          close(); show(curTab); toast(root, "Saved to drafts");
        } else close();
      };
      setTimeout(() => to.focus(), 80);
      return h("div", { class: "pg", style: { background: "#f4f4f5", height: "100%", display: "flex", flexDirection: "column" } },
        h("div", { style: { display: "flex", alignItems: "center", padding: "60px 16px 10px" } },
          h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: dismiss }, svgIcon(I.x, "", 16)),
          h("span", { style: { flex: "1", textAlign: "center", fontWeight: "700", fontSize: "17px" } }, "New Message"),
          h("button", { class: "pressable", style: { padding: "8px 18px", borderRadius: "999px", background: "#2563eb", color: "#fff", fontWeight: "700", fontSize: "14px" }, onClick: send }, "Send")),
        fld(to), fld(subj), body);
    });
  };

  const row = (m: Mail) => {
    const who = m.folder === "sent" || m.folder === "drafts" ? `To: ${m.to}` : m.from;
    return h("div", { class: "lrow pressable", onClick: () =>
      m.folder === "drafts"
        ? composer({ to: m.to, subject: m.subject === "(no subject)" ? "" : m.subject, body: m.body, draft: m })
        : mailDetail(root, m, () => show(curTab), composer) },
      img(m.avatar, "av rd"),
      h("div", { class: "tx" },
        h("div", { style: { display: "flex", gap: "6px", alignItems: "center" } },
          m.unread ? h("i", { style: { width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb", flex: "none" } }) : null,
          m.flagged ? h("span", { style: { color: "#f59e0b", display: "flex" } }, svgIcon(I.flag, "fill", 12)) : null,
          h("div", { class: "t1" }, who)),
        h("div", { class: "t1", style: { fontSize: "13px", fontWeight: "600", color: m.folder === "drafts" ? "#d97706" : "#4b5563" } }, m.subject),
        h("div", { class: "t2" }, m.preview)),
      h("span", { class: "rt" }, m.time));
  };

  const show = (tab: string) => {
    curTab = tab;
    scroll.replaceChildren();
    const input = h("input", { attrs: { placeholder: "Search" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "14px" } }) as HTMLInputElement;
    const list = h("div", { class: "card-white", style: { padding: "2px 14px" } });
    const box = tab === "sent" ? MAILS.filter((m) => m.folder === "sent" && !m.archived)
      : tab === "drafts" ? MAILS.filter((m) => m.folder === "drafts" && !m.archived)
      : tab === "flag" ? MAILS.filter((m) => m.flagged && !m.archived)
      : MAILS.filter((m) => m.folder === "inbox" && !m.archived);
    const draw = () => {
      const q = input.value.trim().toLowerCase();
      const hits = box.filter((m) => !q || (m.from + (m.to ?? "") + m.subject + m.preview).toLowerCase().includes(q));
      list.replaceChildren(...(hits.length ? hits.map(row) : [h("div", { style: { padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: "14px" } }, `No ${tab === "flag" ? "flagged" : tab} mail`)]));
    };
    input.addEventListener("input", draw); draw();
    scroll.append(h("div", { class: "search-pill", style: { margin: "2px 0 8px" } }, svgIcon(I.search), input), list);
  };

  const tabs = FloatingTabBar([
    { id: "inbox", icon: "mail", label: "Inbox" },
    { id: "sent", icon: "send", label: "Sent" },
    { id: "drafts", icon: "file", label: "Drafts" },
    { id: "flag", icon: "flag", label: "Flagged" },
  ], "inbox", show);

  show("inbox");
  root.append(
    GlassHeader("Inbox", { large: true }),
    scroll, tabs.el,
    h("button", { class: "app-fab", style: { width: "56px", height: "56px", right: "20px", bottom: "116px", background: "#2563eb", color: "#fff" },
      onClick: () => composer() }, svgIcon(I.pencil)));
  return root;
}
