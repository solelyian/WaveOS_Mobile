// mail.ts — boîte de réception vivante : mails distincts, détail réel,
// recherche, composer, archiver/supprimer.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { GlassHeader, FloatingTabBar, img, pane, toast } from "./ui";

interface Mail { from: string; avatar: string; subject: string; preview: string; body: string; time: string; unread?: boolean; archived?: boolean }

const MAILS: Mail[] = [
  { from: "Nyne Support", avatar: "/img/avatar/a-1.jpg", subject: "New Login Detected", preview: "We noticed a new sign-in to your account from San Francisco, CA…", body: "Hi Ian,\n\nWe noticed a new sign-in to your Nyne account from San Francisco, CA on a Mac.\n\nIf this was you, you can safely ignore this email. If not, secure your account immediately.\n\n— Nyne Support", time: "9:41 AM", unread: true },
  { from: "Design Team", avatar: "/img/avatar/a-4.jpg", subject: "Figma: WaveOS v2 ready", preview: "The new glass components are ready for review…", body: "Hey!\n\nThe WaveOS v2 components are now in Figma — new glass tiles, the app store templates and the dynamic island states.\n\nTake a look when you can!\n\n— Design Team", time: "8:52 AM", unread: true },
  { from: "GitHub", avatar: "/img/avatar/a-9.jpg", subject: "[WaveOS_Mobile] PR #2 updated", preview: "devin pushed 3 new commits to the branch…", body: "devin pushed 3 new commits to devin/1791534600-calque-react:\n\n  • feat: enrich apps with interactive content\n  • feat: add App Store\n  • fix: visual bugs in apps\n\nView it on GitHub.", time: "Yesterday" },
  { from: "Calendar", avatar: "/img/avatar/a-11.jpg", subject: "Reminder: Sprint review", preview: "Design Sync starts in 30 minutes…", body: "Sprint review & Design Sync\nToday, 10:00 – 11:00 AM\nNyne HQ — Room 4\n\nJoin: waveos.link/sync", time: "Yesterday" },
  { from: "Apple Store", avatar: "/img/avatar/a-15.jpg", subject: "Your receipt", preview: "Thank you for your purchase. Total: $4.99…", body: "Dear Ian,\n\nThank you for your purchase.\n\n  Procreate Pocket — $4.99\n\nYour receipt is attached.\n\n— Apple", time: "Saturday" },
  { from: "Jordan Lee", avatar: "/img/avatar/a-5.jpg", subject: "Trip photos 📷", preview: "Here are all the shots from Big Sur — pick your favorites…", body: "Yo!\n\nFinally uploaded the Big Sur trip photos — 120 shots in the shared album.\nPick your favorites, I'm making prints.\n\n— J", time: "Saturday" },
];

function mailDetail(host: HTMLElement, m: Mail, onArchive: () => void) {
  m.unread = false;
  pane(host, (close) => {
    const reply = () => { toast(host, "Reply composer opened"); };
    return h("div", { class: "pg", style: { background: "#f4f4f5", height: "100%", display: "flex", flexDirection: "column" } },
      h("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "60px 16px 10px" } },
        h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: close }, svgIcon(I.chevronLeft, "", 18)),
        h("div", { style: { flex: "1" } }),
        ...([["archive", () => { m.archived = true; onArchive(); close(); toast(host, "Archived"); }], ["trash2", () => { m.archived = true; onArchive(); close(); toast(host, "Moved to Bin"); }], ["reply", reply]] as [keyof typeof I, () => void][]).map(([ic, fn]) =>
          h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }, onClick: fn }, svgIcon(I[ic], "", 16)))),
      h("div", { class: "no-sb", style: { flex: "1", overflowY: "auto", padding: "0 20px 40px" } },
        h("h2", { style: { fontSize: "22px", fontWeight: "700", letterSpacing: "-.01em", margin: "8px 0 14px" } }, m.subject),
        h("div", { class: "card-white", style: { display: "flex", alignItems: "center", gap: "12px", padding: "12px" } },
          img(m.avatar, "av rd"),
          h("div", { style: { flex: "1", minWidth: "0" } },
            h("div", { style: { fontWeight: "700", fontSize: "15px" } }, m.from),
            h("div", { style: { fontSize: "12px", color: "#9ca3af" } }, "To: ian.alexandre1@pm.me")),
          h("span", { style: { fontSize: "12px", color: "#9ca3af" } }, m.time)),
        h("div", { class: "card-white", style: { marginTop: "14px", padding: "18px" } },
          ...m.body.split("\n\n").map((p) => h("p", { style: { fontSize: "15px", lineHeight: "1.55", color: "#374151", marginBottom: "12px", whiteSpace: "pre-wrap" } }, p))),
        h("button", { class: "pressable", style: { width: "100%", marginTop: "14px", padding: "13px", borderRadius: "16px", background: "#2563eb", color: "#fff", fontWeight: "700", fontSize: "15px" }, onClick: reply }, "Reply")));
  });
}

function composer(host: HTMLElement) {
  pane(host, (close) => {
    const to = h("input", { attrs: { placeholder: "To:" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "15px" } }) as HTMLInputElement;
    const subj = h("input", { attrs: { placeholder: "Subject:" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "15px" } }) as HTMLInputElement;
    const body = h("textarea", { attrs: { placeholder: "Write your message…" }, style: { flex: "1", border: "none", outline: "none", resize: "none", background: "none", fontSize: "15px", lineHeight: "1.5", padding: "14px 20px" } }) as HTMLTextAreaElement;
    const fld = (inp: HTMLElement) => h("div", { style: { display: "flex", padding: "12px 20px", borderBottom: "1px solid rgba(0,0,0,.05)" } }, inp);
    setTimeout(() => to.focus(), 80);
    return h("div", { class: "pg", style: { background: "#f4f4f5", height: "100%", display: "flex", flexDirection: "column" } },
      h("div", { style: { display: "flex", alignItems: "center", padding: "60px 16px 10px" } },
        h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: close }, svgIcon(I.x, "", 16)),
        h("span", { style: { flex: "1", textAlign: "center", fontWeight: "700", fontSize: "17px" } }, "New Message"),
        h("button", { class: "pressable", style: { padding: "8px 18px", borderRadius: "999px", background: "#2563eb", color: "#fff", fontWeight: "700", fontSize: "14px" },
          onClick: () => { close(); toast(host, "Message sent"); } }, "Send")),
      fld(to), fld(subj), body);
  });
}

export function MailApp() {
  const root = h("div", { class: "pg", style: { height: "100%", display: "flex", flexDirection: "column", background: "#f4f4f5" } });
  const scroll = h("div", { class: "app-scroll no-sb", style: { padding: "0 16px 120px" } });

  const row = (m: Mail) => h("div", { class: "lrow pressable", onClick: () => mailDetail(root, m, () => show("inbox")) },
    img(m.avatar, "av rd"),
    h("div", { class: "tx" },
      h("div", { style: { display: "flex", gap: "6px", alignItems: "center" } },
        m.unread ? h("i", { style: { width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb", flex: "none" } }) : null,
        h("div", { class: "t1" }, m.from)),
      h("div", { class: "t1", style: { fontSize: "13px", fontWeight: "600", color: "#4b5563" } }, m.subject),
      h("div", { class: "t2" }, m.preview)),
    h("span", { class: "rt" }, m.time));

  const show = (tab: string) => {
    scroll.replaceChildren();
    const input = h("input", { attrs: { placeholder: "Search" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "14px" } }) as HTMLInputElement;
    const list = h("div", { class: "card-white", style: { padding: "2px 14px" } });
    const box = tab === "sent" ? MAILS.slice(2, 4) : tab === "drafts" ? MAILS.slice(4, 5) : MAILS.filter((m) => !m.archived);
    const draw = () => {
      const q = input.value.trim().toLowerCase();
      const hits = box.filter((m) => !q || (m.from + m.subject + m.preview).toLowerCase().includes(q));
      list.replaceChildren(...(hits.length ? hits.map(row) : [h("div", { style: { padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: "14px" } }, "No mail")]));
    };
    input.addEventListener("input", draw); draw();
    scroll.append(h("div", { class: "search-pill", style: { margin: "2px 0 8px" } }, svgIcon(I.search), input), list);
  };

  const tabs = FloatingTabBar([
    { id: "inbox", icon: "mail", label: "Inbox" },
    { id: "sent", icon: "send", label: "Sent" },
    { id: "drafts", icon: "pencil", label: "Drafts" },
    { id: "flag", icon: "star", label: "Flagged" },
  ], "inbox", show);

  show("inbox");
  root.append(
    GlassHeader("Inbox", { large: true }),
    scroll, tabs.el,
    h("button", { class: "app-fab", style: { width: "56px", height: "56px", right: "20px", bottom: "116px", background: "#2563eb", color: "#fff" },
      onClick: () => composer(root) }, svgIcon(I.pencil)));
  return root;
}
