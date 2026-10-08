// icons.tsx — icône Lucide côté React. Rend un <svg> inline ; sur natif,
// l'équivalent serait react-native-svg (même markup de paths vendored).
import type { ReactNode } from "react";
import { lucideInner } from "../core/lucide";

export function Icon({ name, size = 20, color = "currentColor", sw = 2 }: {
  name: string; size?: number; color?: string; sw?: number;
}): ReactNode {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: lucideInner(name) }}
      style={{ display: "block", flexShrink: 0 }}
    />
  );
}
