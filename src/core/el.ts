// el.ts — helper DOM minimal : h(tag, props, ...children)
type Props = {
  class?: string;
  style?: Partial<CSSStyleDeclaration> | string;
  onClick?: (e: MouseEvent) => void;
  onPointerDown?: (e: PointerEvent) => void;
  onInput?: (e: Event) => void;
  attrs?: Record<string, string>;
  html?: string;
};

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: (Node | string | null | undefined)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props.class) el.className = props.class;
  if (props.style) {
    if (typeof props.style === "string") el.style.cssText = props.style;
    else Object.assign(el.style, props.style);
  }
  if (props.onClick) el.addEventListener("click", props.onClick as EventListener);
  if (props.onPointerDown) el.addEventListener("pointerdown", props.onPointerDown as EventListener);
  if (props.onInput) el.addEventListener("input", props.onInput);
  if (props.attrs) for (const [k, v] of Object.entries(props.attrs)) el.setAttribute(k, v);
  if (props.html !== undefined) el.innerHTML = props.html;
  for (const c of children) {
    if (c == null) continue;
    el.append(c as Node | string);
  }
  return el;
}

export function svgIcon(svg: string, cls = ""): HTMLElement {
  const w = h("span", { class: "icon " + cls, html: svg });
  const s = w.querySelector("svg");
  if (s) { s.setAttribute("width", "100%"); s.setAttribute("height", "100%"); }
  return w;
}
