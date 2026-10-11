// Icon.tsx — glyphes Lucide vendorés (mêmes assets que main), rendus en stroke courant.
import * as React from "react";
import { I as ICONS } from "../core/lucide";

export function Icon({ name, size = 20, color = "#fff", strokeWidth = 2, style }: {
  name: string; size?: number; color?: string; strokeWidth?: number; style?: object;
}) {
  const svg = (ICONS as Record<string, string>)[name] ?? "";
  const html = svg
    .replace("<svg ", `<svg style="width:${size}px;height:${size}px;color:${color}" `)
    .replace(/stroke-width="[^"]*"/, `stroke-width="${strokeWidth}"`);
  return React.createElement("span", {
    style: { display: "inline-flex", lineHeight: 0, flexShrink: 0, ...style },
    dangerouslySetInnerHTML: { __html: html },
  });
}
