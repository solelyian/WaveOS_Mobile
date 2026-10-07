// switcher.ts — multitâche : cartes horizontales avec inertie et snap,
// toucher = ouvrir, glisser-haut sur une carte = tuer. La miniature est la
// coque de l'app re-rendue en réduction (pas un snapshot pixel — plus net).
import { el } from "../core/el";
import { motion } from "../core/motion";
import { iconFor, type AppDef } from "../apps/registry";

interface Card { app: AppDef; node: HTMLElement }

export const CARD_W = 240;
const GAP = 26;

export class Switcher {
  node: HTMLElement;
  onClose?: () => void;
  onOpenApp?: (app: AppDef, from: DOMRect) => void;
  private track: HTMLElement;
  private cards: Card[] = [];
  private offset = 0;          // scroll x (px logiques)
  private startOffset = 0;
  private killY = new Map<HTMLElement, number>();
  private killCard: HTMLElement | null = null;

  constructor(private onAppTap: (app: AppDef) => void) {
    this.track = el("div", { id: "sw-track" });
    this.node = el("div", { id: "layer-switcher", class: "layer", role: "dialog", "aria-label": "Applications récentes" }, this.track);
    this.node.addEventListener("click", (e) => {
      if (e.target === this.track || e.target === this.node) this.onClose?.();
    });
  }

  setRunning(apps: AppDef[]): void {
    this.track.replaceChildren();
    this.killY.clear();
    this.cards = apps.map((app) => {
      const mini = el("div", { class: "sw-frame" },
        el("div", { style: "padding:58px 18px 0;height:100%;background:var(--abysses);display:flex;flex-direction:column" },
          el("div", { style: "display:flex;align-items:center;gap:9px;color:#fff" },
            iconFor(app, 26), el("b", { style: "font-size:15px;font-weight:600" }, app.name)),
          el("div", { style: "margin-top:16px;flex:1;display:flex;flex-direction:column;gap:12px" },
            el("div", { style: `height:150px;border-radius:20px;background:linear-gradient(150deg,${app.c0},${app.c1})` }),
            ...[62, 88, 74, 40].map((w) =>
              el("div", { style: `width:${w}%;height:12px;border-radius:6px;background:rgba(255,255,255,.13)` })))));
      const c = el("div", { class: "sw-card", role: "button", tabindex: "0", "aria-label": `Ouvrir ${app.name}` }, mini,
        el("div", { class: "sw-meta" }, iconFor(app, 30), el("span", {}, app.name)));
      c.addEventListener("click", () => this.onAppTap(app));
      this.track.append(c);
      return { app, node: c };
    });
    const span = Math.max(0, (this.cards.length - 1) * (CARD_W + GAP));
    this.offset = span; // carte la plus récente en dernier
  }

  dragStart(): void { this.startOffset = this.offset; this.killCard = null; }

  /** Carte sous le point de départ du geste (pour le kill vertical). */
  cardAt(x: number): HTMLElement | null {
    for (let i = 0; i < this.cards.length; i++) {
      const cx = 196.5 - CARD_W / 2 + i * (CARD_W + GAP) - this.offset;
      if (x >= cx && x <= cx + CARD_W) return this.cards[i].node;
    }
    return null;
  }

  drag(dx: number): void {
    const span = Math.max(0, (this.cards.length - 1) * (CARD_W + GAP));
    const raw = this.startOffset - dx;
    this.offset = raw < 0 ? -motion.rubber(-raw, 140) : raw > span ? span + motion.rubber(raw - span, 140) : raw;
  }

  /** Drag vertical appliqué à une carte précise (geste de kill). */
  killDrag(node: HTMLElement, dy: number): void {
    this.killCard = node;
    this.killY.set(node, Math.min(0, dy));
  }

  commitScroll(vx: number): void {
    const span = Math.max(0, (this.cards.length - 1) * (CARD_W + GAP));
    const projected = this.offset - vx * 0.18;
    const i = Math.round(projected / (CARD_W + GAP));
    this.offset = motion.clamp(i * (CARD_W + GAP), 0, span);
  }

  commitKill(node: HTMLElement, vy: number): void {
    const dy = this.killY.get(node) ?? 0;
    this.killY.delete(node);
    this.killCard = null;
    if (dy < -110 || vy < -850) {
      const i = this.cards.findIndex((c) => c.node === node);
      if (i >= 0) this.cards.splice(i, 1);
      const span = Math.max(0, (this.cards.length - 1) * (CARD_W + GAP));
      this.offset = motion.clamp(this.offset, 0, span);
      node.style.transition = "transform .3s cubic-bezier(.3,.8,.3,1), opacity .25s";
      node.style.transform += " translateY(-700px)";
      node.style.opacity = "0";
      window.setTimeout(() => node.remove(), 300);
    }
  }

  get killed(): HTMLElement | null { return this.killCard; }

  cardRect(app: AppDef): DOMRect | null {
    return this.cards.find((c) => c.app.id === app.id)?.node.getBoundingClientRect() ?? null;
  }

  runningIds(): string[] { return this.cards.map((c) => c.app.id); }

  render(p: number): void {
    const e = motion.easeOut(motion.clamp(p, 0, 1));
    this.node.style.visibility = p <= 0.001 ? "hidden" : "visible";
    const yOff = (1 - e) * 320;
    for (let i = 0; i < this.cards.length; i++) {
      const c = this.cards[i];
      const x = 196.5 - CARD_W / 2 + i * (CARD_W + GAP) - this.offset;
      const dist = Math.abs(x + CARD_W / 2 - 196.5) / 393;
      const sc = (0.9 - Math.min(0.16, dist * 0.34)) * (0.94 + 0.06 * e);
      const ky = this.killY.get(c.node) ?? 0;
      c.node.style.transform = `translate(${x - 196.5}px, ${yOff + ky}px) scale(${sc})`;
      c.node.style.opacity = String(Math.min(1, e * 1.6));
      c.node.style.zIndex = String(10 - i);
    }
  }
}
