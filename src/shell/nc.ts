// nc.ts — Notification Center : date + horloge 7xl + cartes glass (maquette).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { Spring } from "../core/motion";
import { fmtDate, fmtTime } from "../system/state";

const NOTIFS = [
  { user: "Sarah Connor", text: "The future is not set. There is no fate but what we make for ourselves.", time: "2m ago", icon: I.messageCircle, color: "#22c55e" },
  { user: "Nyne ID", text: "New login detected on MacBook Pro.", time: "15m ago", icon: I.mail, color: "#3b82f6" },
  { user: "Security", text: "Front door motion detected.", time: "1h ago", icon: I.lock, color: "#f97316" },
  { user: "Up Next", text: "Design Review in 30 mins.", time: "1h ago", icon: I.calendar, color: "#ef4444" },
  { user: "Music", text: "Your daily mix is ready.", time: "3h ago", icon: I.music, color: "#ec4899" },
];

export class NotificationCenter {
  el = h("div", { class: "sheet", attrs: { id: "nc" } });
  sy = new Spring(-850, "shade");
  private clockEl = h("div", { class: "nc-clock" });
  private dateEl = h("div", { class: "nc-date" });
  private list = h("div", { class: "nc-list no-sb" });

  constructor() {
    const head = h("div", { class: "nc-head" }, this.dateEl, this.clockEl);
    this.buildList();
    const clearBtn = h("div", { class: "nc-clear" },
      h("button", { class: "pressable", onClick: () => this.clear() }, svgIcon(I.trash2)));
    const handle = h("div", { class: "handle" }, h("i"));
    this.el.append(head, this.list, clearBtn, handle);
    this.tick();
  }

  private buildList() {
    this.list.replaceChildren();
    if (NOTIFS.length === 0) {
      this.list.append(h("div", { class: "nc-empty" }, svgIcon(I.bell), h("span", {}, "No New Notifications")));
      return;
    }
    for (const [i, n] of NOTIFS.entries()) {
      const card = h("div", { class: "nc-card g-dark", style: { opacity: "0", transform: "translateX(-50px) scale(.9)", transition: `opacity .3s ${i * 0.05}s, transform .3s ${i * 0.05}s` } },
        h("div", { class: "bd", style: { background: n.color } }, svgIcon(n.icon)),
        h("div", { class: "tx" },
          h("div", { class: "r1" }, h("span", { class: "app" }, n.user), h("span", { class: "tm" }, n.time)),
          h("div", { class: "txt" }, n.text)));
      this.list.append(card);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        card.style.opacity = "1"; card.style.transform = "none";
      }));
    }
  }
  private clear() { NOTIFS.length = 0; this.buildList(); }

  open() { this.sy.to(0); }
  close() { this.sy.to(-850); }
  tick() { this.clockEl.textContent = fmtTime(); this.dateEl.textContent = fmtDate(); }
  render(): boolean {
    this.el.style.transform = `translateY(${this.sy.v.toFixed(1)}px)`;
    return this.sy.v <= -849 && this.sy.settled();
  }
}
