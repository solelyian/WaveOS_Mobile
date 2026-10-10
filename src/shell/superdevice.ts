// superdevice.ts — panneau « Super Device » façon HarmonyOS : icône phone au
// centre, appareils proches en orbite ; glisser un appareil vers le centre le
// connecte, puis actions par type (partage d'écran, envoi de fichier,
// routage audio, sync montre).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { Spring, tween } from "../core/motion";

type DevKind = "screen" | "audio" | "companion";
interface Dev {
  id: string; name: string; icon: string; kind: DevKind;
  el: HTMLElement; home: { x: number; y: number }; connected: boolean;
}

const DEVICES: Array<{ id: string; name: string; icon: string; kind: DevKind }> = [
  { id: "mbp",   name: "MacBook Pro",    icon: I.laptop,     kind: "screen" },
  { id: "ipad",  name: "iPad Air",       icon: I.tablet,     kind: "screen" },
  { id: "tv",    name: "Living Room TV", icon: I.tv,         kind: "screen" },
  { id: "buds",  name: "Nyne Buds",      icon: I.headphones, kind: "audio" },
  { id: "watch", name: "Nyne Watch",     icon: I.watch,      kind: "companion" },
];

const H = 850, R_OUT = 130, R_IN = 60, BUB = 62;

export class SuperDevice {
  el = h("div", { class: "sheet", attrs: { id: "sd" } });
  /** y : -H fermé → 0 ouvert (ressort shade, comme cc/nc). */
  sy = new Spring(-H, "shade");
  private orbit = h("div", { class: "sd-orbit" });
  private stage = h("div", { class: "sd-stage" });
  private centerEl = h("button", { class: "sd-dev sd-phone" },
    svgIcon(I.phone, "", 26), h("span", { class: "lbl" }, "WaveOS"));
  private actions = h("div", { class: "sd-actions" });
  private devs: Dev[] = [];
  private docked = 0;

  constructor() {
    const n = DEVICES.length;
    DEVICES.forEach((d, i) => {
      const a = -90 + (i * 360) / n;
      const x = 200 + R_OUT * Math.cos((a * Math.PI) / 180) - BUB / 2;
      const y = 300 + R_OUT * Math.sin((a * Math.PI) / 180) - BUB / 2;
      const el = h("button", { class: "sd-dev" },
        svgIcon(d.icon, "", 24), h("span", { class: "lbl" }, d.name));
      el.style.left = `${x}px`; el.style.top = `${y}px`;
      const dev: Dev = { ...d, el, home: { x, y }, connected: false };
      this.devs.push(dev);
      this.stage.append(el);
      this.bindDrag(dev);
    });
    this.centerEl.style.left = `${200 - BUB / 2}px`;
    this.centerEl.style.top = `${300 - BUB / 2}px`;
    this.stage.append(this.centerEl);
    this.orbit.append(this.stage);
    this.el.append(
      h("div", { class: "sd-head" },
        h("h2", {}, "Super Device"),
        h("p", {}, "Drag a device to the center to connect")),
      this.orbit, this.actions,
      h("div", { class: "handle" }, h("i")));
  }

  // ---------- drag : bulle → centre = connexion ----------
  private bindDrag(dev: Dev) {
    dev.el.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      dev.el.setPointerCapture(e.pointerId);
      const sr = this.stage.getBoundingClientRect();
      const sx = e.clientX, sy = e.clientY;
      const ox = parseFloat(dev.el.style.left), oy = parseFloat(dev.el.style.top);
      let dx = 0, dy = 0;
      const mv = (ev: PointerEvent) => {
        dx = ev.clientX - sx; dy = ev.clientY - sy;
        dev.el.style.transform = `translate(${dx}px,${dy}px)`;
        const cx = ox + dx + BUB / 2, cy = oy + dy + BUB / 2;
        const near = Math.hypot(cx - 200, cy - 300) < 78;
        this.centerEl.classList.toggle("hot", near && !dev.connected);
      };
      const up = (ev: PointerEvent) => {
        dev.el.removeEventListener("pointermove", mv);
        dev.el.removeEventListener("pointerup", up);
        dx = ev.clientX - sx; dy = ev.clientY - sy;
        this.centerEl.classList.remove("hot");
        const cx = ox + dx + BUB / 2, cy = oy + dy + BUB / 2;
        if (!dev.connected && Math.hypot(cx - 200, cy - 300) < 78) this.connect(dev);
        else this.flyBack(dev);
      };
      dev.el.addEventListener("pointermove", mv);
      dev.el.addEventListener("pointerup", up);
      void sr;
    });
  }

  private flyTo(dev: Dev, tx: number, ty: number, done?: () => void) {
    const ox = parseFloat(dev.el.style.left), oy = parseFloat(dev.el.style.top);
    const dx = parseFloat(dev.el.style.transform.match(/translate\((-?\d+\.?\d*)px/)?.[1] ?? "0");
    const dy = parseFloat(dev.el.style.transform.match(/translate\([^,]+,\s*(-?\d+\.?\d*)px\)/)?.[1] ?? "0");
    const fromX = ox + dx, fromY = oy + dy;
    tween(300, (v) => {
      dev.el.style.transform = `translate(${(fromX + (tx - fromX) * v - ox).toFixed(1)}px,${(fromY + (ty - fromY) * v - oy).toFixed(1)}px)`;
    }, { done });
  }

  private flyBack(dev: Dev) {
    dev.el.style.zIndex = "";
    this.flyTo(dev, dev.home.x, dev.home.y);
  }

  private connect(dev: Dev) {
    const a = -90 + this.docked * 72;
    const tx = 200 + R_IN * Math.cos((a * Math.PI) / 180) - BUB / 2;
    const ty = 300 + R_IN * Math.sin((a * Math.PI) / 180) - BUB / 2;
    this.docked++;
    dev.connected = true;
    dev.el.classList.add("on");
    this.flyTo(dev, tx, ty);
    this.centerEl.classList.add("linked");
    this.pulse();
    this.showActions(dev);
  }

  private disconnect(dev: Dev) {
    dev.connected = false;
    dev.el.classList.remove("on");
    this.docked = Math.max(0, this.docked - 1);
    if (!this.devs.some((d) => d.connected)) this.centerEl.classList.remove("linked");
    this.flyBack(dev);
    this.actions.replaceChildren();
  }

  private pulse() {
    this.centerEl.classList.remove("pulse");
    void this.centerEl.offsetWidth;
    this.centerEl.classList.add("pulse");
  }

  // ---------- actions par type d'appareil ----------
  private showActions(dev: Dev) {
    const card = h("div", { class: "sd-card g-dark" });
    const status = h("div", { class: "st" }, `Connected — ${dev.name}`);
    const btn = (icon: string, label: string, onClick: () => void) =>
      h("button", { class: "sd-act", onClick: (e) => { e.stopPropagation(); onClick(); } },
        svgIcon(icon, "", 18), h("span", {}, label));
    card.append(h("div", { class: "hd" }, svgIcon(dev.icon, "", 20), h("b", {}, dev.name), status));
    if (dev.kind === "screen") {
      const mirror = h("div", { class: "sd-mirror" },
        h("div", { class: "live" }, h("i"), "MIRRORING"),
        h("div", { class: "mn" }, `to ${dev.name}`));
      const bar = h("div", { class: "sd-prog" }, h("i"));
      const lbl = h("div", { class: "sd-prog-t" }, "");
      card.append(
        h("div", { class: "row" },
          btn(I.airplay, "Share screen", () => { mirror.classList.toggle("on"); }),
          btn(I.fileUp, "Send file", () => {
            lbl.textContent = "Sending…";
            tween(2400, (v) => { (bar.firstChild as HTMLElement).style.width = `${(v * 100).toFixed(0)}%`; },
              { done: () => { lbl.textContent = "Sent ✓"; } });
          })),
        mirror, bar, lbl);
    } else if (dev.kind === "audio") {
      const routed = h("div", { class: "st ok" });
      card.append(
        h("div", { class: "row" },
          btn(I.volume2, "Route audio", () => {
            routed.textContent = routed.textContent ? "" : `Audio routed to ${dev.name}`;
          }),
          btn(I.music, "Play on device", () => { routed.textContent = `Now playing on ${dev.name}`; })),
        routed);
    } else {
      const st = h("div", { class: "st ok" });
      card.append(
        h("div", { class: "row" },
          btn(I.rotateCcw, "Sync now", () => {
            st.textContent = "Syncing…";
            tween(1400, () => {}, { done: () => { st.textContent = "Synced ✓"; } });
          }),
          btn(I.bell, "Ping device", () => { st.textContent = `${dev.name} is ringing`; })),
        st);
    }
    card.append(h("button", { class: "sd-disc", onClick: () => this.disconnect(dev) }, "Disconnect"));
    this.actions.replaceChildren(card);
  }

  open() { this.sy.to(0); }
  close() { this.sy.to(-H); }
  /** retourne true quand le panneau est complètement sorti (à retirer du DOM). */
  render(): boolean {
    this.el.style.transform = `translateY(${this.sy.v.toFixed(1)}px)`;
    return this.sy.v <= -H + 1 && this.sy.settled();
  }
}
