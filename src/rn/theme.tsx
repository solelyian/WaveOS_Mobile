// theme.tsx — pont thème Sillage → React Native.
// Lit le thème et le facteur de texte du système (état sys + attributs du
// #phone) et les expose en palette aux apps RN. Tout l'arbre RN est monté
// sous <ThemeRoot> par host.tsx.
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { sys } from "../system/state";

export interface Palette {
  dark: boolean;
  bg: string;        // fond d'app (grouped background iOS)
  card: string;      // carte / liste groupée
  card2: string;     // carte survolée / élevée
  text: string;
  sub: string;       // texte secondaire
  faint: string;     // texte tertiaire / placeholder
  sep: string;       // séparateurs
  tint: string;      // accent système (opale / opale profond en clair)
  jade: string; ambre: string; corail: string; violet: string;
  field: string;     // fond de champ de saisie
  bubbleIn: string;  // bulle message reçu
  ts: number;        // facteur taille de texte (Réglages → Lisibilité)
}

const DARK: Omit<Palette, "ts"> = {
  dark: true,
  bg: "#0B0F22",
  card: "rgba(255,255,255,.10)",
  card2: "rgba(255,255,255,.15)",
  text: "#F2F4FB",
  sub: "rgba(255,255,255,.60)",
  faint: "rgba(255,255,255,.38)",
  sep: "rgba(255,255,255,.10)",
  tint: "#7DA2FF",
  jade: "#2FCC92", ambre: "#F0A02E", corail: "#FF6B57", violet: "#8A7CFF",
  field: "rgba(255,255,255,.12)",
  bubbleIn: "rgba(255,255,255,.14)",
};

const LIGHT: Omit<Palette, "ts"> = {
  dark: false,
  bg: "#EFECE6",
  card: "rgba(255,255,255,.72)",
  card2: "rgba(255,255,255,.9)",
  text: "#14161F",
  sub: "rgba(20,22,31,.55)",
  faint: "rgba(20,22,31,.36)",
  sep: "rgba(20,22,31,.10)",
  tint: "#5570D6",
  jade: "#0FA872", ambre: "#D8880F", corail: "#E8533C", violet: "#6B5AE0",
  field: "rgba(20,22,31,.07)",
  bubbleIn: "rgba(255,255,255,.85)",
};

const ThemeCtx = createContext<Palette>({ ...DARK, ts: 1 });
export const useTheme = (): Palette => useContext(ThemeCtx);

/** Taille de texte × facteur de lisibilité système. */
export const fs = (n: number, p: Palette): number => Math.round(n * p.ts * 10) / 10;

export function ThemeRoot({ children }: { children: ReactNode }): ReactNode {
  const [p, setP] = useState<Palette>({ ...(sys.theme === "dark" ? DARK : LIGHT), ts: sys.textScale });
  useEffect(() => {
    const ph = document.getElementById("phone");
    if (!ph) return;
    const sync = () => {
      setP({ ...(ph.dataset.theme === "light" ? LIGHT : DARK), ts: sys.textScale });
    };
    const mo = new MutationObserver(sync);
    mo.observe(ph, { attributes: true });
    sync();
    return () => mo.disconnect();
  }, []);
  return <ThemeCtx.Provider value={p}>{children}</ThemeCtx.Provider>;
}
