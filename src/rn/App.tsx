// App.tsx — coquille téléphone : wallpaper, boot NYNE, lockscreen, statusbar, DI.
import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSys, set } from "./sys";
import { LockScreen } from "./LockScreen";
import { StatusBar } from "./StatusBar";
import { DynamicIsland } from "./DynamicIsland";
import { HomeGrid } from "./HomeGrid";
import { attachGestures } from "./gestures";
import { sys } from "../system/state";

function Boot({ onDone }: { onDone: () => void }) {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = (now - t0) / 2600;
      setT(Math.min(1, k));
      if (k < 1) raf = requestAnimationFrame(step); else onDone();
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);
  return (
    <View style={st.boot} onStartShouldSetResponder={() => { onDone(); return true; }}>
      <View style={{ flexDirection: "row" }}>
        {"NYNE".split("").map((l, i) => (
          <Text key={i} style={[st.bootL, { opacity: Math.max(0, Math.min(1, (t - i * 0.12) / 0.3)) }]}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  const s = useSys();
  const [booted, setBooted] = React.useState(false);
  const done = React.useCallback(() => setBooted(true), []);
  const root = React.useRef<View>(null);
  const rootEl = React.useCallback((n: View | null) => {
    (root as { current: View | null }).current = n;
    const el = n as unknown as HTMLElement | null;
    if (el) attachGestures(el, {
      unlock: () => set("locked", false),
      openSheet: (x) => set("sheet", x as never),
      closeSheet: () => set("sheet", null),
      openSwitcher: () => {},
      closeApp: () => set("activeApp", null),
      isLocked: () => sys.locked,
      hasSheet: () => sys.sheet != null,
      hasApp: () => sys.activeApp != null,
    });
  }, []);
  return (
    <View ref={rootEl} style={st.phone}>
      <View style={st.wall} pointerEvents="none" />
      {!s.locked && <HomeGrid onOpen={() => {}} onSpot={() => {}} />}
      {s.locked && <LockScreen />}
      <StatusBar />
      <DynamicIsland />
      {!booted && <Boot onDone={done} />}
    </View>
  );
}

const st = StyleSheet.create({
  phone: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", borderRadius: 50 },
  wall: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: "url(/img/wallpaper.jpg)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  } as object,
  boot: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99,
    backgroundColor: "#050505", alignItems: "center", justifyContent: "center",
  },
  bootL: { color: "#fff", fontSize: 44, fontWeight: "200", letterSpacing: 18 },
  homeStub: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
});
