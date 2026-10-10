// recents.ts — sélecteur d'apps récentes façon HarmonyOS/iOS : cards live
// (le vrai DOM de l'app rendu en miniature), tap = rouvrir, swipe-up = tuer.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { appMeta } from "../apps/registry";
import { renderApp } from "../apps";
import type { AppId } from "../system/state";

export interface RecentsCallbacks {
  /** tap sur une card : la shell ré-ouvre l'app en morphant depuis le rect fourni. */
  onOpen: (id: AppId, rect: DOMRect) => void;
  /** tap hors cards / drag vers le bas / pill : fermer le switcher. */
  onClose: () => void;
  /** card swipée vers le haut : retirer l'app de l'historique. */
  onKill: (id: AppId) => void;
}

export class RecentsSwitcher {
  el = h("div", { class: "rct" });
  private cards = new Map<AppId, HTMLElement>();

  constructor(ids: AppId[], cb: RecentsCallbacks) {
    const strip = h("div", { class: "rct-strip" });
    for (const id of ids) strip.append(this.card(id, cb));
    const hint = ids.length ? h("div", { class: "rct-hint" }, "Swipe up to close · tap outside to exit") : null;

    // fond + pill home : tout clic hors card referme
    this.el.addEventListener("click", (e) => {
      if (!(e.target as HTMLElement).closest(".rct-card")) cb.onClose();
    });
    this.el.append(
      h("div", { class: "rct-scrim" }),
      strip,
      ids.length ? hint! : h("div", { class: "rct-empty" }, "No recent apps"),
      h("div", { class: "rct-homebar", onClick: (e) => { e.stopPropagation(); cb.onClose(); } }, h("i")),
    );
    // entrée : strip glisse depuis le bas
    strip.style.transform = "translateY(60px)";
    strip.style.opacity = "0";
    requestAnimationFrame(() => {
      strip.style.transition = "transform .38s cubic-bezier(.2,.8,.3,1), opacity .3s";
      strip.style.transform = "none";
      strip.style.opacity = "1";
    });
  }

  private card(id: AppId, cb: RecentsCallbacks) {
    const m = appMeta(id);
    const inner = h("div", { class: "rct-inner" }, renderApp(id));
    const appBox = h("div", { class: "rct-app" }, inner);
    const card = h("div", { class: "rct-card" },
      h("div", { class: "rct-name" },
        h("span", { class: "ic", style: { background: m.color } }, svgIcon(I[m.icon])),
        h("span", {}, m.name)),
      appBox);
    this.cards.set(id, card);

    card.addEventListener("click", () => cb.onOpen(id, appBox.getBoundingClientRect()));

    // drag vertical sur la card -> kill (propre au switcher, hors routeur global)
    let dy = 0, dragging = false, py = 0, samples: { t: number; y: number }[] = [];
    card.addEventListener("pointerdown", (e) => {
      dragging = true; dy = 0; py = e.clientY;
      samples = [{ t: performance.now(), y: e.clientY }];
      card.setPointerCapture(e.pointerId);
      card.style.transition = "none";
    });
    card.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      dy = e.clientY - py;
      samples.push({ t: performance.now(), y: e.clientY });
      if (samples.length > 6) samples.shift();
      card.style.transform = `translateY(${Math.min(40, dy)}px) scale(${Math.max(.92, 1 - Math.abs(dy) / 2400)})`;
    });
    const finish = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      const now = performance.now();
      const rec = samples.filter((s) => now - s.t < 90);
      const vy = rec.length >= 2 ? (rec[rec.length - 1].y - rec[0].y) / (Math.max(1, rec[rec.length - 1].t - rec[0].t) / 1000) : 0;
      if (dy < -110 || vy < -500) {
        // kill : la card file vers le haut puis disparaît
        card.style.transition = "transform .28s cubic-bezier(.4,0,.8,.4), opacity .28s";
        card.style.transform = "translateY(-900px)";
        card.style.opacity = "0";
        setTimeout(() => { card.remove(); cb.onKill(id); }, 290);
      } else {
        card.style.transition = "transform .25s cubic-bezier(.3,.9,.4,1.2)";
        card.style.transform = "none";
      }
      dy = 0;
    };
    card.addEventListener("pointerup", finish);
    card.addEventListener("pointercancel", finish);
    return card;
  }
}
