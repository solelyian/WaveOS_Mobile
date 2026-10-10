// ui.ts — composants partagés des apps (GlassHeader, FloatingTabBar) — maquette 1:1.
import { h, svgIcon } from "../core/el";
import { Spring } from "../core/motion";
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

export interface TabBarCtl { el: HTMLElement; setActive: (id: string) => void }

// FloatingTabBar — pill + dot portés par un seul nœud animé par le ressort C
// (maquette : layoutId spring bounce .2 / .6s — preset « pill »).
export function FloatingTabBar(
  tabs: { id: string; icon: IconName; label: string }[],
  active: string,
  onTab: (id: string) => void,
  dark = false,
): TabBarCtl {
  const inEl = h("div", { class: "in " + (dark ? "g-dark" : "g-light") });
  const pill = h("div", { class: "pill" });
  const dot = h("div", { class: "dot" });
  const btns = new Map<string, HTMLElement>();
  const sx = new Spring(0, "pill");
  let cur = active;
  let raf = 0;

  const center = (id: string) => {
    const b = btns.get(id);
    return b ? b.offsetLeft + b.offsetWidth / 2 : -1;
  };
  const apply = () => {
    const x = sx.v;
    pill.style.transform = `translateX(${x - 24}px)`;
    dot.style.transform = `translateX(${x - 2}px)`;
  };
  const kick = () => {
    if (raf) return;
    const step = () => { apply(); raf = sx.settled() ? 0 : requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  };

  const setActive = (id: string) => {
    if (id === cur) return;
    cur = id;
    for (const [tid, b] of btns) b.classList.toggle("on", tid === cur);
    const c = center(id);
    if (c >= 0) { pill.style.display = dot.style.display = ""; sx.to(c); kick(); }
  };

  for (const t of tabs) {
    const b = h("button", {
      class: t.id === active ? "on" : "",
      onClick: () => { setActive(t.id); onTab(t.id); },
    }, svgIcon(I[t.icon]));
    btns.set(t.id, b);
    inEl.append(b);
  }
  inEl.append(pill, dot);
  const el = h("div", { class: "tabbar " + (dark ? "darkb" : "light") }, inEl);

  // position initiale : épingle le ressort sans animation
  requestAnimationFrame(() => {
    const c = center(cur);
    if (c < 0) { pill.style.display = dot.style.display = "none"; return; }
    sx.set(c);
    apply();
  });
  return { el, setActive };
}

export const img = (src: string, cls = "") => h("img", { class: cls, attrs: { src, alt: "", draggable: "false" } });

// pane — sous-page qui glisse depuis la droite (detail iOS : Mail, Réglages…)
export function pane(host: HTMLElement, build: (close: () => void) => HTMLElement) {
  const wrap = h("div", { class: "pane" });
  const close = () => { wrap.classList.remove("on"); setTimeout(() => wrap.remove(), 340); };
  wrap.append(build(close));
  host.append(wrap);
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add("on")));
  return wrap;
}

// switchEl — interrupteur iOS.
export function switchEl(on: boolean, onFlip: (v: boolean) => void) {
  const el = h("button", { class: "sw" + (on ? " on" : ""), onClick: () => {
    const v = !el.classList.contains("on");
    el.classList.toggle("on", v);
    onFlip(v);
  } }, h("i"));
  return el;
}

// setRow — ligne de liste Réglages : icône carrée colorée, libellé, valeur, chevron.
export function setRow(icon: IconName, bg: string, label: string, opts: { value?: string; onClick?: () => void; end?: HTMLElement } = {}) {
  const el = h("div", { class: "set-row" + (opts.onClick ? " pressable" : "") },
    h("div", { class: "set-ic", style: { background: bg } }, svgIcon(I[icon])),
    h("span", { class: "set-lbl" }, label),
    opts.value ? h("span", { class: "set-val" }, opts.value) : null,
    opts.end ?? (opts.onClick ? h("span", { class: "chev" }, svgIcon(I.chevronLeft)) : null));
  if (opts.onClick) el.addEventListener("click", opts.onClick);
  return el;
}

// toast — pastille éphémère en bas de l'app (confirmation d'action).
export function toast(host: HTMLElement, text: string) {
  const el = h("div", { class: "toast g-dark" }, text);
  host.append(el);
  requestAnimationFrame(() => el.classList.add("on"));
  setTimeout(() => { el.classList.remove("on"); setTimeout(() => el.remove(), 300); }, 1600);
}
