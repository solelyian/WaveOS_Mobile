// nc.ts — Centre de notifications, calqué sur la référence HarmonyOS 7 :
// liste PLATE de cartes (icône app + titre + texte + heure à droite), grande
// horloge en tête, poubelle circulaire flottante en bas. Le rejet d'une carte
// la « dissipe » en particules lumineuses — signature « light particles ».
// Respecte le mode Focus (atténuation de la liste).
import { el } from "../core/el";
import { appIcon } from "../core/icons";
import { lucide } from "../core/lucide";
import { motion } from "../core/motion";
import { spotlight } from "../core/spotlight";
import { on } from "../system/state";
import type { GlyphName } from "../core/icons";

interface Notif { app: string; icon: GlyphName; tint: string; title: string; body: string; when: string }
interface CardState { dx: number; op: number; gone: boolean }

const FEED: Notif[] = [
  { app: "Messages", icon: "messages", tint: "#1FA870", title: "Camille", body: "On se retrouve à 19h au studio ?", when: "19:02" },
  { app: "Messages", icon: "messages", tint: "#1FA870", title: "Équipe Nyne", body: "La build WaveOS 0.9 est prête 🎉", when: "18:55" },
  { app: "Mail", icon: "mail", tint: "#2B5CC9", title: "Facture validée", body: "Votre paiement de 49,00 € a été accepté.", when: "18:41" },
  { app: "Rappels", icon: "reminders", tint: "#E87E1E", title: "Design review", body: "Aujourd'hui 16:00 — salle Rubans", when: "18:10" },
  { app: "Météo", icon: "weather", tint: "#2B66C9", title: "Pluie à 18h", body: "Averses attendues ce soir à Lyon.", when: "17:32" },
];

export class NotificationCenter {
  node: HTMLElement;
  onClose?: () => void;
  private list: HTMLElement;
  private clockEl: HTMLElement;
  private mt: SVGTextElement;
  private rt: SVGTextElement;
  private emptyEl: HTMLElement;
  private trashBtn: HTMLElement;
  private cards = new Map<HTMLElement, CardState>();

  constructor(private announce: (m: string) => void) {
    const d = new Date();
    const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
    // Horloge « liquid glass » : les chiffres réfractent réellement le fond —
    // un masque SVG (userSpaceOnUse) n'applique le backdrop-filter et le reflet
    // QUE dans les glyphes ; un texte calqué dessus ajoute le liseré lumineux.
    const SVGNS = "http://www.w3.org/2000/svg";
    const defs = document.createElementNS(SVGNS, "svg");
    defs.setAttribute("width", "0"); defs.setAttribute("height", "0");
    defs.setAttribute("aria-hidden", "true");
    defs.classList.add("nc-clk-defs");
    defs.innerHTML =
      `<defs><mask id="nc-clkm" maskUnits="userSpaceOnUse" x="0" y="0" width="349" height="104">` +
      `<text x="174.5" y="83" text-anchor="middle" class="clkmt">09:41</text></mask></defs>`;
    this.mt = defs.querySelector(".clkmt") as unknown as SVGTextElement;
    const rim = document.createElementNS(SVGNS, "svg");
    rim.setAttribute("viewBox", "0 0 349 104");
    rim.setAttribute("aria-hidden", "true");
    rim.classList.add("clkr");
    rim.innerHTML = `<text x="174.5" y="83" text-anchor="middle" class="clkrt">09:41</text>`;
    this.rt = rim.querySelector(".clkrt") as unknown as SVGTextElement;
    this.clockEl = el("div", { class: "nc-clock" }, defs,
      el("div", { class: "clkg", style: "-webkit-mask:url(#nc-clkm);mask:url(#nc-clkm)" }), rim);

    this.list = el("div", { id: "nc-list" });
    this.emptyEl = el("div", { id: "nc-empty", style: "display:none" },
      lucide("bell-off", "nc-bell"),
      el("div", { class: "e-t" }, "Aucune notification"),
      el("div", { class: "e-s" }, "Vous êtes à jour."));
    this.trashBtn = el("button", { id: "nc-trash", class: "g g-regular", "aria-label": "Tout effacer" },
      lucide("trash-2", "nc-trash"));
    this.trashBtn.addEventListener("click", (e) => { e.stopPropagation(); this.clear(); });

    for (const n of FEED) this.list.append(this.card(n));

    this.node = el("div", { id: "layer-nc", class: "layer sheet", role: "dialog", "aria-label": "Notifications" },
      el("div", { class: "sheet-bg g g-thick" }),
      el("div", { class: "nc-head" },
        this.clockEl,
        el("div", { class: "nc-date" }, `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`)),
      this.list, this.emptyEl, this.trashBtn);

    this.node.addEventListener("click", (e) => {
      if (e.target === this.node || (e.target as HTMLElement).classList.contains("sheet-bg")) this.onClose?.();
    });
    on("focus", (v) => { this.list.style.opacity = v ? ".45" : "1"; });
    this.syncEmpty();
  }

  private card(n: Notif): HTMLElement {
    const c = el("div", { class: "nc-card g g-regular" },
      appIcon(`ncc-${n.icon}`, n.icon, n.tint, n.tint, 34),
      el("div", { class: "ntx" },
        el("div", { class: "nh" }, el("span", {}, n.title), el("span", { class: "nwhen" }, n.when)),
        el("span", { class: "nb" }, n.body)));
    spotlight(c);
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
        if (st.dx < -110) this.dissipate(c, st);
        else {
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

  /** Dissipation « light particles » : la carte file, un essaim de points
   *  lumineux dérive dans le sens du balayage puis s'éteint. */
  private dissipate(c: HTMLElement, st: CardState): void {
    st.gone = true; st.dx = -393; st.op = 0;
    this.burst(c, -1, 12);
    c.style.transition = "transform .3s cubic-bezier(.3,.8,.3,1), opacity .24s";
    window.setTimeout(() => { this.cards.delete(c); c.remove(); this.syncEmpty(); }, 300);
    this.announce("Notification rejetée");
  }

  private burst(anchor: HTMLElement, dirX: number, n = 10): void {
    const lr = this.node.getBoundingClientRect();
    const r = anchor.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const p = el("span", { class: "nc-part" });
      p.style.left = `${r.left - lr.left + r.width * (0.15 + Math.random() * 0.7)}px`;
      p.style.top = `${r.top - lr.top + r.height * (0.2 + Math.random() * 0.6)}px`;
      p.style.setProperty("--px", `${dirX * (40 + Math.random() * 110)}px`);
      p.style.setProperty("--py", `${(Math.random() - 0.55) * 120}px`);
      p.style.setProperty("--pd", `${430 + Math.random() * 280}ms`);
      this.node.append(p);
      window.setTimeout(() => p.remove(), 760);
    }
  }

  private syncEmpty(): void {
    const left = this.list.querySelectorAll(".nc-card").length;
    this.emptyEl.style.display = left ? "none" : "flex";
    this.trashBtn.style.display = left ? "flex" : "none";
  }

  private clear(): void {
    const kids = [...this.list.children] as HTMLElement[];
    kids.forEach((k, i) => {
      window.setTimeout(() => this.burst(k, -1, 7), i * 55);
      k.style.transition = `transform .3s ${i * 45}ms cubic-bezier(.4,.8,.3,1), opacity .24s ${i * 45}ms`;
      k.style.transform = "translateX(-115%)";
      k.style.opacity = "0";
    });
    window.setTimeout(() => { this.list.replaceChildren(); this.cards.clear(); this.syncEmpty(); }, 400 + kids.length * 45);
    this.announce("Notifications effacées");
  }

  tick(): void {
    const d = new Date();
    const t = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    if (this.mt.textContent !== t) { this.mt.textContent = t; this.rt.textContent = t; }
  }

  render(p: number): void {
    const e = motion.easeOut(motion.clamp(p, 0, 1));
    this.node.style.transform = `translateY(${-(1 - e) * 852}px)`;
    this.node.style.visibility = p <= 0.001 ? "hidden" : "visible";
    // cascade : chaque carte descend avec décalage ; le dx de rejet est
    // composé carte par carte au-dessus.
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
