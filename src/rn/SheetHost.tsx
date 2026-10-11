// SheetHost.tsx — hôte des sheets : monte translateY -850→0 (spring shade), fond frosted.
import * as React from "react";
import { View, StyleSheet } from "react-native";
import { useSys } from "./sys";
import { Spring, SPRINGS, onFrame, domOf } from "./fx";
import { NotificationCenter } from "./NotificationCenter";
import { ControlCenter } from "./ControlCenter";

const H = 850;

export function SheetHost() {
  const s = useSys();
  const wrap = React.useRef<View>(null);
  const sp = React.useMemo(() => new Spring(-H, SPRINGS.shade[0], SPRINGS.shade[1]), []);
  const last = React.useRef<"nc" | "cc" | null>(null);
  if (s.sheet === "nc" || s.sheet === "cc") last.current = s.sheet;

  const active = s.sheet === "nc" || s.sheet === "cc" ? s.sheet : last.current;
  React.useEffect(() => { sp.to(s.sheet ? 0 : -H); }, [s.sheet, sp]);
  // backdrop-filter n'est pas un style RNW — on l'applique au DOM.
  React.useEffect(() => {
    const el = domOf(wrap);
    const f = el?.querySelector<HTMLElement>("#sheet-frost");
    if (f) {
      f.style.backdropFilter = "blur(30px) saturate(160%)";
      (f.style as unknown as Record<string, string>).WebkitBackdropFilter = "blur(30px) saturate(160%)";
    }
  }, []);

  React.useEffect(() => { const off = onFrame((dt) => {
    const el = domOf(wrap); if (!el) return;
    sp.step(dt);
    el.style.transform = `translateY(${sp.v}px)`;
    el.style.visibility = sp.v <= -H + 1 && sp.settled ? "hidden" : "visible";
    el.style.opacity = `${Math.min(1, (sp.v + H) / (H * 0.6))}`;
  }); return () => { off(); }; }, [sp]);

  return (
    <View ref={wrap} style={st.wrap} pointerEvents="box-none">
      <View style={st.frost} nativeID="sheet-frost" pointerEvents="none" />
      {active === "nc" ? <NotificationCenter /> : <ControlCenter />}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 40, visibility: "hidden" } as object,
  frost: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(10,10,14,.45)",
  } as object,
});
