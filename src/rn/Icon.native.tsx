// Icon.native.tsx — mêmes glyphes Lucide en composants react-native-svg natifs.
import * as React from "react";
import { icons } from "lucide-react-native";

export function Icon({ name, n, size = 20, color = "#fff", strokeWidth = 2, filled = false, style }: {
  name?: string; n?: string; size?: number; color?: string; strokeWidth?: number; filled?: boolean; style?: object;
}) {
  const key = n ?? name ?? "";
  const Comp = (icons as Record<string, React.ComponentType<{
    size?: number; color?: string; strokeWidth?: number; fill?: string; style?: object;
  }>>)[key.charAt(0).toUpperCase() + key.slice(1)] ?? icons.Circle;
  return <Comp size={size} color={color} strokeWidth={strokeWidth} fill={filled ? color : "none"} style={style} />;
}
