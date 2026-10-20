// theme.native.ts — Monet natif : palette extraite du wallpaper en C++ WASM
// côté web ; ici palette fixe (même source d'accent que le build web).
import * as React from "react";

const Ctx = React.createContext({ accent: "#307bf6", accentSoft: "rgba(48,123,246,.25)" });
export const useTheme = () => React.useContext(Ctx);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <Ctx.Provider value={{ accent: "#307bf6", accentSoft: "rgba(48,123,246,.25)" }}>{children}</Ctx.Provider>;
}
export function initTheme() { }
