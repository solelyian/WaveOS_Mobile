// host.tsx — pont React ↔ shell DOM. Chaque app RN est rendue dans un div
// hôte vivant dans .appbody ; la racine est détruite quand une autre app
// s'ouvre (AppWindow appelle unmountRN avant de remplacer le contenu).
import { createRoot, type Root } from "react-dom/client";
import type { ReactElement } from "react";
import { ThemeRoot } from "./theme";

let root: Root | null = null;

export function unmountRN(): void {
  if (root) { root.unmount(); root = null; }
}

/** Retourne un `content()` compatible AppDef : div hôte + racine React. */
export function rnApp(node: ReactElement): () => HTMLElement {
  return () => {
    const host = document.createElement("div");
    host.className = "rn-host";
    unmountRN();
    root = createRoot(host);
    root.render(<ThemeRoot>{node}</ThemeRoot>);
    return host;
  };
}
