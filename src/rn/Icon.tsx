// Icon.tsx — glyphes Lucide vendorés (mêmes assets que main), rendus en stroke courant.
import * as React from "react";
import { I as ICONS } from "../core/lucide";

export function Icon({ name, n, size = 20, color = "#fff", strokeWidth = 2, style }: {
  name?: string; n?: string; size?: number; color?: string; strokeWidth?: number; style?: object;
}) {
  const svg = (ICONS as Record<string, string>)[n ?? name ?? ""] ?? "";
  // lucide-static émet `<svg\n  class=...` — l'attribut va après le premier « > ».
  const html = svg
    .replace(/<svg(\s[^>]*)?>/, `<svg style="width:${size}px;height:${size}px;color:${color}"$1>`)
    .replace(/stroke-width="[^"]*"/, `stroke-width="${strokeWidth}"`);
  return React.createElement("span", {
    style: { display: "inline-flex", lineHeight: 0, flexShrink: 0, color, ...style },
    dangerouslySetInnerHTML: { __html: html },
  });
}
