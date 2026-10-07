// nc.ts — Centre de notifications, inspiration HarmonyOS : notifications
// GROUPÉES par app (pile = carte de tête + repli, tap pour déplier), heure
// système en tête, « Effacer » global. Glisser-gauche rejette une carte.
// Respecte le mode Focus (atténuation).
import { el } from "../core/el";
import { appIcon } from "../core/icons";
import { lucide } from "../core/lucide";
import { motion } from "../core/motion";
import { on } from "../system/state";
import type { GlyphName } from "../core/icons";

interface Notif { title: string; body: string; when: string }
interface Group { app: string; icon: GlyphName; tint: string; items: Notif[] }

const FEED: Group[] = [
  {
    app: "Messages", icon: "messages", tint: "#1FA870",
    items: [
      { title: "Camille", body: "On se retrouve à 19h au studio ?", when: "il y a 2 min" },
      { title: "Équipe Nyne", body: "La build WaveOS 0.9 est prête 🎉", when: "il y a 9 min" },
    ],
  },
  {
    app: "Mail", icon: "mail", tint: "#2B5CC9",
    items: [{ title: "Facture validée", body: "Votre paiement de 49,00 € a été accepté.", when: "il y a 26 min" }],
  },
  {
    app: "Rappels", icon: "reminders", tint: "#E87E1E",
    items: [{ title: "Design review", body: "Aujourd'hui 16:00 — salle Rubans", when: "il y a 1 h" }],
  },
  {
    app: "Météo", icon: "weather", tint: "#2B66C9",
    items: [{ title: "Pluie à 18h", body: "Averses attendues ce soir à Lyon.", when: "il y a 2 h" }],
  },
];

interface CardState { dx: number; op: number; gone: boolean }

export class NotificationCenter {
  node: HTMLElement;
  onClose?: () => void;
  private list: HTMLElement;
  private clockEl: HTMLElement;
  private emptyEl: HTMLElement;
  private clearBtn: HTMLElement;
  private cards = new Map<HTMLElement, CardState>();

  constructor(private announce: (m: string) => void) {
    const d = new Date();
    const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
    this.clockEl = el("div", { class: "t-clock" }, "09:41");

    this.list = el("div", { id: "nc-list" });
    this.emptyEl = el("div", { id: "nc-empty", style: "display:none" },
      lucide("bell-off", "nc-bell"),
      el("div", { class: "e-t" }, "Aucune notification"),
      el("div", { class: "e-s" }, "Vous êtes à jour."));
    this.clearBtn = el("button", { id: "nc-clear", class: "g g-thin" },
      lucide("trash-2", "nc-trash"), "Tout effacer");
    this.clearBtn.addEventListener("click", (e) => { e.stopPropagation(); this.clear(); });

    for (const g of FEED) this.list.append(this.group(g));

    this.node = el("div", { id: "layer-nc", class: "layer sheet", role: "dialog", "aria-label": "Notifications" },
      el("div", { class: "sheet-bg g g-thick" }),
      el("div", { class: "nc-head" },
        el("div", {},
          this.clockEl,
          el("div", { class: "nc-date" }, `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`)),
        this.clearBtn),
      this.list, this.emptyEl);

    this.node.addEventListener("click", (e) => {
      if (e.target === this.node || (e.target as HTMLElement).classList.contains("sheet-bg")) this.onClose?.();
    });
    on("focus", (v) => { this.list.style.opacity = v ? ".45" : "1"; });
    this.syncEmpty();
  }

  /** Groupe empilé : carte de tête + repli « +N » derrière ; tap déplie. */
  private group(g: Group): HTMLElement {
    const wrap = el("div", { class: "nc-group" });
    const stack = el("div", { class: "nc-stack" });
    const cards = g.items.map((n) => this.card(g, n));
    // Repli : jusqu'à 2 cartes fantômes derrière la tête
    for (let i = 1; i < Math.min(3, cards.length); i++) {
      stack.append(el("div", { class: "nc-peek", style: `--i:${i}` }));
    }
    stack.append(cards[0]);
    const body = el("div", { class: "nc-expanded", style: "display:none" },
      ...cards.slice(1));
    wrap.append(this.groupHeader(g, cards.length, stack, body, wrap), stack, body);
    return wrap;
  }

  private groupHeader(g: Group, n: number, stack: HTMLElement, body: HTMLElement, wrap: HTMLElement): HTMLElement {
    const chev = lucide("chevron-down", "nc-chev");
    const count = el("span", { class: "nc-count" }, String(n));
    const h = el("button", { class: "nc-ghead" },
      appIcon(`nc-${g.icon}`, g.icon, g.tint, g.tint, 22),
      el("span", { class: "nc-gname" }, g.app), count, chev);
    let open = false;
    const apply = () => {
      open = !open;
      body.style.display = open ? "" : "none";
      wrap.classList.toggle("open", open);
      chev.style.transform = open ? "rotate(180deg)" : "";
      count.style.display = open ? "none" : "";
    };
    if (n > 1) h.addEventListener("click", (e) => { e.stopPropagation(); apply(); });
    else { count.style.display = "none"; chev.style.display = "none"; }
    return h;
  }

  private card(g: Group, n: Notif): HTMLElement {
    const c = el("div", { class: "nc-card g g-regular" },
      appIcon(`ncc-${g.icon}`, g.icon, g.tint, g.tint, 34),
      el("div", { class: "ntx" },
        el("div", { class: "nh" }, el("span", {}, n.title), el("span", {}, n.when)),
        el("span", { class: "nb" }, n.body)));
    const st: CardState = { dx: 0, op: 1, gone: false };
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
          st.gone = true; st.dx = -393; st.op = 0;
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
    const left = this.list.querySelectorAll(".nc-card").length;
    this.emptyEl.style.display = left ? "none" : "flex";
    this.clearBtn.style.display = left ? "flex" : "none";
  }

  private clear(): void {
    const groups = [...this.list.children] as HTMLElement[];
    groups.forEach((k, i) => {
      k.style.transition = `transform .3s ${i * 40}ms cubic-bezier(.4,.8,.3,1), opacity .26s ${i * 40}ms`;
      k.style.transform = "translateX(-120%)";
      k.style.opacity = "0";
    });
    window.setTimeout(() => { this.list.replaceChildren(); this.syncEmpty(); }, 380 + groups.length * 40);
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
    // cascade : chaque groupe descend avec décalage ; le dx de rejet est
    // composé carte par carte.
    const kids = this.list.children;
    for (let i = 0; i < kids.length; i++) {
      const k = kids[i] as HTMLElement;
      const pi = motion.clamp(p * 1.4 - i * 0.08, 0, 1);
      k.style.transform = `translateY(${(1 - motion.easeOut(pi)) * 30}px)`;
      k.style.opacity = String(Math.min(1, pi * 1.7));
    }
    for (const [c, st] of this.cards) {
      if (st.gone) continue;
      c.style.transform = `translateX(${st.dx}px)`;
      c.style.opacity = String(st.op);
    }
  }
}
