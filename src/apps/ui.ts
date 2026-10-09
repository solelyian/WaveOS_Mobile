// ui.ts — composants partagés des apps (GlassHeader, FloatingTabBar) — maquette 1:1.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import type { IconName } from "../core/lucide";
import { shell } from "../shell/api";

export function GlassHeader(title: string, opts: { large?: boolean; action?: IconName; onBack?: () => void } = {}) {
  const back = h("button", { class: "bk g-btn", onClick: () => (opts.onBack ?? shell.closeApp)() }, svgIcon(I.chevronLeft));
  const row = h("div", { class: "row" }, back,
    opts.action ? h("button", { class: "act g-btn" }, svgIcon(I[opts.action])) : h("span"));
  const el = h("div", { class: "ghdr" }, row,
    opts.large ? h("h1", {}, title) : h("div", { class: "ttl-sm" }, title));
  return el;
}

export function FloatingTabBar(
  tabs: { id: string; icon: IconName; label: string }[],
  active: string,
  onTab: (id: string) => void,
  dark = false,
) {
  const inEl = h("div", { class: "in " + (dark ? "g-dark" : "g-light") });
  const pill = h("div", { class: "pill" });
  const dot = h("div", { class: "dot" });
  const btns: HTMLElement[] = [];
  for (const t of tabs) {
    const b = h("button", { class: t.id === active ? "on" : "", onClick: () => onTab(t.id) },
      svgIcon(I[t.icon]));
    btns.push(b);
    inEl.append(b);
  }
  inEl.append(pill, dot);
  const el = h("div", { class: "tabbar " + (dark ? "darkb" : "light") }, inEl);
  const place = () => {
    const i = tabs.findIndex((t) => t.id === active);
    const b = btns[i];
    if (!b) { pill.style.display = "none"; dot.style.display = "none"; return; }
    pill.style.display = dot.style.display = "";
    pill.style.left = `${b.offsetLeft + b.offsetWidth / 2 - 24}px`;
    pill.style.top = `${b.offsetTop + 6}px`;
    dot.style.left = `${b.offsetLeft + b.offsetWidth / 2 - 2}px`;
    dot.style.bottom = "";
    dot.style.top = `${b.offsetTop + 52}px`;
  };
  requestAnimationFrame(place);
  return el;
}

export const img = (src: string, cls = "") => h("img", { class: cls, attrs: { src, alt: "", draggable: "false" } });
