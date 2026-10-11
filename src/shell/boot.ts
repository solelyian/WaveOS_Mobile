import { h } from "../core/el";
import { mountBoot } from "../system/bootAnimation";

export function runBoot(phone: HTMLElement): Promise<void> {
  return new Promise((done) => {
    const el = h("div", { class: "boot" });
    phone.append(el);
    mountBoot(el, () => { el.remove(); done(); });
  });
}
