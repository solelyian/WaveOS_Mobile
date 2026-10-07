// a11y.ts — accessibilité du prototype : mouvement réduit, taille de texte
// dynamique, annonces. Réglages→Accessibilité pilote ces deux flags en vrai.
import { motion } from "./motion";
import { tokens } from "../tokens.gen";

let textScale = 1;
let reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const a11y = {
  get reduceMotion() { return reduceMotion; },
  setReduceMotion(on: boolean): void {
    reduceMotion = on;
    motion.setReduced(on);
    document.getElementById("phone")?.classList.toggle("rm", on);
  },
  get textScale() { return textScale; },
  setTextScale(s: number): void {
    textScale = Math.min(tokens.type.maxScale, Math.max(tokens.type.minScale, s));
    document.getElementById("phone")?.style.setProperty("--ts", String(textScale));
  },
  /** Annonce polie pour les lecteurs d'écran (overlay ouvert/fermé, etc.). */
  announce(msg: string): void {
    let n = document.getElementById("a11y-live");
    if (!n) {
      n = document.createElement("div");
      n.id = "a11y-live";
      n.setAttribute("aria-live", "polite");
      n.className = "sr-only";
      document.body.append(n);
    }
    n.textContent = "";
    requestAnimationFrame(() => { n.textContent = msg; });
  },
};
