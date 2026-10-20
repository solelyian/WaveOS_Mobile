// GlassClock.native.tsx — horloge native : texte fin, pas de canvas/WASM.
// Le rendu Aqua Glass des chiffres arrivera avec wavegfx via NDK.
import * as React from "react";
import { Text } from "react-native";
import { fmtTime } from "../system/state";

export function GlassClock({ size = 188 }: { size?: number }) {
  const [, tick] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <Text
      style={{
        fontSize: size * 0.44,
        fontWeight: "200",
        letterSpacing: -size * 0.44 * 0.045,
        color: "rgba(255,255,255,.92)",
        fontVariant: ["tabular-nums"],
        includeFontPadding: false,
        textAlign: "center",
      }}
    >
      {fmtTime()}
    </Text>
  );
}
