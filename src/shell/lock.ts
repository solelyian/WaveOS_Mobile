// lock.ts — écran de verrouillage gabarit HarmonyOS NEXT : petit cadenas en
// tête, horloge géante empilée HH / MM, date, puces d'état (alarme, météo,
// notifications), rangée du bas torche / pilule média / caméra. Quand le code
// PIN est activé dans Réglages, la montée révèle un pavé numérique dépoli.
import { el } from "../core/el";
import { glyph } from "../core/icons";
import { lucide } from "../core/lucide";
import { motion } from "../core/motion";
import { on, toggle } from "../system/state";

const PIN = "8520";

export class LockScreen {
  node: HTMLElement;
  onPinPass?: () => void;   // code correct → le shell déverrouille
  onPinDismiss?: () => void; // « Retour » → le shell ramène le face-lock
  pinOpen = false;
  private passed = false; // code accepté : la face reste éteinte pendant la sortie du pavé
  private hh: HTMLElement;
  private mm: HTMLElement;
  private dateEl: HTMLElement;
  private torchBtn: HTMLElement;
  private playBtn: HTMLElement;
  private playing = false;
  private pinpad: HTMLElement;
  private dots: HTMLElement[] = [];
  private buf = "";

  constructor(onUnlockHint: () => void) {
    const d = new Date();
    const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    this.dateEl = el("div", { id: "lock-date" },
      `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`);

    // Horloge empilée HH / MM — signature HarmonyOS : deux lignes géantes.
    this.hh = el("div", { class: "t-lockh" }, "13");
    this.mm = el("div", { class: "t-lockh" }, "38");

    // Puces d'état — petites capsules verre sous la date.
    const chips = el("div", { id: "lk-chips" },
      el("span", { class: "lk-chip g g-thin" }, lucide("alarm-clock"), "07:30"),
      el("span", { class: "lk-chip g g-thin" }, lucide("cloud-sun"), "19°"),
      el("span", { class: "lk-chip g g-thin" }, lucide("bell"), "2"));

    const clockWrap = el("div", { id: "lock-clock-wrap" },
      this.hh, this.mm, this.dateEl, chips);

    // Rangée du bas : torche | pilule média | caméra.
    this.torchBtn = el("button", { class: "lock-btn g g-regular", "aria-label": "Lampe torche" },
      glyph("flashlight"));
    this.torchBtn.addEventListener("click", (e) => { e.stopPropagation(); toggle("torch"); onUnlockHint(); });
    on("torch", (v) => { this.torchBtn.style.background = v ? "rgba(255,255,255,.85)" : ""; this.torchBtn.style.color = v ? "#14161F" : "#fff"; });

    this.playBtn = el("span", { role: "button", "aria-label": "Lecture" }, lucide("pause"));
    this.playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.playing = !this.playing;
      this.playBtn.replaceChildren(lucide(this.playing ? "play" : "pause"));
    });
    const mediaPill = el("div", { id: "lk-media", class: "g g-thin" },
      el("span", { class: "lma" }),
      el("span", { class: "lmt" }, "Sillage"),
      this.playBtn);

    const camBtn = el("button", { class: "lock-btn g g-regular", "aria-label": "Caméra" }, glyph("camera"));

    const face = el("div", { id: "lock-face" },
      el("div", { id: "lock-glyph" }, lucide("lock")),
      clockWrap,
      el("div", { id: "lock-hint" },
        el("div", { class: "caps" }, "Glisser vers le haut"),
        el("div", { class: "bar" })),
      el("div", { id: "lock-bottom" }, this.torchBtn, mediaPill, camBtn));

    this.pinpad = this.buildPinpad();

    this.node = el("div", { id: "layer-lock", class: "layer", role: "dialog", "aria-label": "Écran verrouillé" },
      face, this.pinpad);

    // « spatial clock » : l'heure flotte en parallaxe sous le pointeur,
    // au-dessus du plan du wallpaper — sensation de profondeur.
    this.node.addEventListener("pointermove", (e) => {
      const r = this.node.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      clockWrap.style.transform = `translate(${nx * 10}px, ${ny * 8}px)`;
    });
    this.node.addEventListener("pointerleave", () => { clockWrap.style.transform = ""; });
    this.face = face;
  }

  private face: HTMLElement;

  /** p = progression du déverrouillage 0→1 : la face s'élève et s'efface. */
  render(p: number): void {
    // Tant que le pavé PIN est ouvert (ou vient d'être validé), il pilote
    // l'affichage : la face reste estompée jusqu'à ce que le nœud se masque.
    if (this.pinOpen) { this.node.style.visibility = "visible"; return; }
    if (this.passed) {
      this.node.style.visibility = p >= 0.99 ? "hidden" : "visible";
      return;
    }
    const e = motion.easeOut(motion.clamp(p, 0, 1));
    this.face.style.transform = `translateY(${-170 * e}px)`;
    this.face.style.opacity = String(1 - motion.clamp(p * 1.5, 0, 1));
    // Le nœud ne disparaît que lorsqu'il n'y a plus rien à montrer (le pavé
    // PIN, lui, continue de couvrir l'écran quand la face est partie).
    this.node.style.visibility = (p >= 0.99 && !this.pinOpen) ? "hidden" : "visible";
  }

  /** Montre le pavé PIN (monté par-dessus la face). */
  showPin(): void {
    this.pinOpen = true;
    this.buf = ""; this.syncDots();
    this.pinpad.classList.add("show");
    this.face.style.opacity = "0";
    this.face.style.pointerEvents = "none";
    window.setTimeout(() => this.pinpad.querySelector("button")?.focus(), 350);
  }

  /** Repli du pavé sans callback — utilisé par relock(). */
  resetPin(): void {
    this.pinOpen = false;
    this.passed = false;
    this.pinpad.classList.remove("show");
    this.face.style.opacity = "";
    this.face.style.pointerEvents = "";
    this.buf = ""; this.syncDots();
  }

  private hidePin(passed: boolean): void {
    this.pinOpen = false;
    this.passed = passed;
    this.pinpad.classList.remove("show");
    if (!passed) { this.face.style.opacity = ""; this.face.style.pointerEvents = ""; }
    if (passed) this.onPinPass?.(); else this.onPinDismiss?.();
  }

  private buildPinpad(): HTMLElement {
    const dots = el("div", { class: "pin-dots" });
    for (let i = 0; i < 4; i++) this.dots.push(el("i"));
    dots.append(...this.dots);
    const keys = el("div", { class: "pin-keys" });
    const letters = ["", "ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ"];
    for (let n = 1; n <= 9; n++) {
      keys.append(el("button", { class: "pk", "aria-label": String(n) },
        el("b", {}, String(n)), el("i", {}, letters[n - 1])));
    }
    keys.append(el("span", { class: "pk-aux dim" }, "Urgence"));
    keys.append(el("button", { class: "pk", "aria-label": "0" }, el("b", {}, "0"), el("i")));
    const back = el("button", { class: "pk-aux", "aria-label": "Retour" }, "Retour");
    back.addEventListener("click", () => this.hidePin(false));
    keys.append(back);
    const pad = el("div", { id: "pinpad", class: "g g-thick", role: "dialog", "aria-label": "Code de déverrouillage" },
      el("div", { class: "pin-title" }, "Entrez le code"),
      dots, keys,
      el("div", { class: "pin-fp" }, lucide("fingerprint")));
    pad.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest(".pk");
      if (b) this.key((b as HTMLElement).querySelector("b")!.textContent!);
    });
    pad.addEventListener("keydown", (e) => {
      if (/^[0-9]$/.test(e.key)) this.key(e.key);
      if (e.key === "Backspace") { this.buf = this.buf.slice(0, -1); this.syncDots(); }
      if (e.key === "Escape") this.hidePin(false);
    });
    return pad;
  }

  private key(d: string): void {
    if (this.buf.length >= 4) return;
    this.buf += d;
    this.syncDots();
    if (this.buf.length === 4) {
      if (this.buf === PIN) {
        this.dots.forEach((i) => i.classList.add("ok"));
        window.setTimeout(() => this.hidePin(true), 240);
      } else {
        this.pinpad.classList.add("shake");
        window.setTimeout(() => { this.pinpad.classList.remove("shake"); this.buf = ""; this.syncDots(); }, 420);
      }
    }
  }

  private syncDots(): void {
    this.dots.forEach((i, n) => { i.classList.toggle("fill", n < this.buf.length); i.classList.remove("ok"); });
  }

  tick(): void {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, "0"), m = String(d.getMinutes()).padStart(2, "0");
    if (this.hh.textContent !== h) this.hh.textContent = h;
    if (this.mm.textContent !== m) this.mm.textContent = m;
  }
}
