// nc.ts — Centre de notifications : grande heure + date, cartes verre en
// cascade, glisser-gauche pour rejeter, « Effacer ». Respecte le mode Focus.
import { el } from "../core/el";
import { appIcon, G } from "../core/icons";
import { motion } from "../core/motion";
import { on } from "../system/state";
import type { GlyphName } from "../core/icons";

interface Notif { app: string; icon: GlyphName; tint: string; when: string; title: string; body: string }

const FEED: Notif[] = [
  { app: "Messages", icon: "messages", tint: "#1FA870", when: "il y a 2 min", title: "Camille", body: "On se retrouve à 19h au studio ?" },
  { app: "Messages", icon: "messages", tint: "#1FA870", when: "il y a 9 min", title: "Équipe Nyne", body: "La build WaveOS 0.9 est prête 🎉" },
  { app: "Mail", icon: "mail", tint: "#2B5CC9", when: "il y a 26 min", title: "Facture validée", body: "Votre paiement a été accepté." },
  { app: "Rappels", icon: "reminders", tint: "#E87E1E", when: "il y a 1 h", title: "Design review", body: "Aujourd'hui 16:00 — salle Rubans" },
  { app: "Météo", icon: "weather", tint: "#2B66C9", when: "il y a 2 h", title: "Pluie à 18h", body: "Averses attendues ce soir à Lyon." },
];

export class NotificationCenter {
  node: HTMLElement;
  onClose?: () => void;
  private list: HTMLElement;
  private clockEl: HTMLElement;
  private emptyEl: HTMLElement;
  private clearBtn: HTMLElement;
  private cards = new Map<HTMLElement, { dx: number; op: number; gone: boolean }>();

  constructor(private announce: (m: string) => void) {
    const d = new Date();
    const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
    this.clockEl = el("div", { class: "t-clock" }, "09:41");

    this.list = el("div", { id: "nc-list" });
    this.emptyEl = el("div", { id: "nc-empty", style: "display:none" }, "Aucune notification");
    this.clearBtn = el("button", { id: "nc-clear", class: "g g-thin" }, "Effacer");
    this.clearBtn.addEventListener("click", (e) => { e.stopPropagation(); this.clear(); });

    for (const n of FEED) this.list.append(this.card(n));

    this.node = el("div", { id: "layer-nc", class: "layer sheet", role: "dialog", "aria-label": "Notifications" },
      el("div", { class: "sheet-bg g g-thick" }),
      el("div", { class: "nc-head" },
        el("div", {}, this.clockEl, el("div", { class: "nc-date", style: "text-align:left;color:rgba(255,255,255,.75);font-size:calc(14px*var(--ts))" }, `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`)),
        this.clearBtn),
      this.list, this.emptyEl);

    this.node.addEventListener("click", (e) => {
      if (e.target === this.node || (e.target as HTMLElement).classList.contains("sheet-bg")) this.onClose?.();
    });
    on("focus", (v) => { this.list.style.opacity = v ? ".45" : "1"; });
  }

  private card(n: Notif): HTMLElement {
    const icon = appIcon(`nc-${n.icon}`, G[n.icon] as unknown as string[], n.tint, n.tint, 38);
    const c = el("div", { class: "nc-card g g-regular" }, icon,
      el("div", { class: "ntx" },
        el("div", { class: "nh" }, el("span", {}, n.app), el("span", {}, n.when)),
        el("b", {}, n.title), el("span", {}, n.body)));
    // glisser pour rejeter — dx est composé avec la cascade dans render()
    const st = { dx: 0, op: 1, gone: false };
    this.cards.set(c, st);
    let startX = 0;
    c.style.touchAction = "pan-y";
    c.addEventListener("pointerdown", (e) => {
      startX = e.clientX; st.dx = 0;
      c.setPointerCapture(e.pointerId);
      const mv = (ev: PointerEvent) => {
        st.dx = (ev.clientX - startX) * 0.9;
        st.op = 1 - Math.min(1, Math.abs(st.dx) / 200) * 0.7;
      };
      const up = () => {
        c.removeEventListener("pointermove", mv);
        if (st.dx < -110) {
          st.gone = true;
          st.dx = -393; st.op = 0;
          c.style.transition = "transform .28s cubic-bezier(.3,.8,.3,1), opacity .24s";
          window.setTimeout(() => { this.cards.delete(c); c.remove(); this.syncEmpty(); }, 280);
          this.announce("Notification rejetée");
        } else {
          st.dx = 0; st.op = 1;
          c.style.transition = "transform .34s cubic-bezier(.2,.9,.25,1.2), opacity .2s";
          window.setTimeout(() => { c.style.transition = ""; }, 360);
        }
      };
      c.addEventListener("pointermove", mv);
      c.addEventListener("pointerup", up, { once: true });
      c.addEventListener("pointercancel", up, { once: true });
    });
    return c;
  }

  private syncEmpty(): void {
    const left = this.list.children.length;
    this.emptyEl.style.display = left ? "none" : "block";
    this.clearBtn.style.display = left ? "flex" : "none";
  }

  private clear(): void {
    const kids = [...this.list.children] as HTMLElement[];
    kids.forEach((k, i) => {
      k.style.transition = `transform .3s ${i * 40}ms cubic-bezier(.4,.8,.3,1), opacity .26s ${i * 40}ms`;
      k.style.transform = "translateX(-120%)";
      k.style.opacity = "0";
    });
    window.setTimeout(() => { this.list.replaceChildren(); this.syncEmpty(); }, 380 + kids.length * 40);
    this.announce("Notifications effacées");
  }

  tick(): void {
    const d = new Date();
    const t = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    if (this.clockEl.textContent !== t) this.clockEl.textContent = t;
  }

  render(p: number): void {
    const e = motion.easeOut(motion.clamp(p, 0, 1));
    this.node.style.transform = `translateY(${-(1 - e) * 852}px)`;
    this.node.style.visibility = p <= 0.001 ? "hidden" : "visible";
    // cascade interne : les cartes tombent avec un léger décalage ; le dx de
    // rejet (glisser-gauche) est composé ici, pas en concurrence.
    const kids = this.list.children;
    for (let i = 0; i < kids.length; i++) {
      const k = kids[i] as HTMLElement;
      const st = this.cards.get(k);
      const dx = st?.dx ?? 0;
      const op = st?.op ?? 1;
      const pi = motion.clamp(p * 1.35 - i * 0.09, 0, 1);
      k.style.transform = `translateX(${dx}px) translateY(${(1 - motion.easeOut(pi)) * 26}px)`;
      k.style.opacity = String(op);
    }
  }
}
