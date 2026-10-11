// App.tsx — coquille téléphone : wallpaper, boot NYNE, lockscreen, statusbar,
// DI, sheets, fenêtre d'app (morph) et switcher de recents.
import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSys, set } from "./sys";
import { LockScreen, lockCtl } from "./LockScreen";
import { StatusBar } from "./StatusBar";
import { DynamicIsland } from "./DynamicIsland";
import { HomeGrid } from "./HomeGrid";
import { attachGestures } from "./gestures";
import { sys } from "../system/state";
import type { AppId } from "../system/state";
import { SheetHost, sheetCtl } from "./SheetHost";
import { AppWindow, appwinCtl } from "./AppWindow";
import { Recents } from "./Recents";
import { host, pushRecent, type AppRect } from "./host";

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
  const [from, setFrom] = React.useState<AppRect | null>(null);
  const root = React.useRef<View>(null);

  const iconRect = React.useCallback((id: AppId): AppRect | null => {
    const phone = root.current as unknown as HTMLElement | null;
    const tile = document.getElementById(`icon-${id}`) ?? document.getElementById(`dock-${id}`);
    if (!phone || !tile) return null;
    const pr = phone.getBoundingClientRect();
    const r = tile.getBoundingClientRect();
    const sx = 400 / pr.width, sy = 850 / pr.height;
    return { x: (r.left - pr.left) * sx, y: (r.top - pr.top) * sy, w: r.width * sx, h: r.height * sy };
  }, []);

  const openApp = React.useCallback((id: AppId, rect?: AppRect | null) => {
    const r = rect ?? iconRect(id) ?? { x: 170, y: 380, w: 60, h: 60 };
    pushRecent(id);
    setFrom(r);
    set("activeApp", id);
  }, [iconRect]);

  React.useEffect(() => {
    host.openApp = (id) => openApp(id);
    host.closeApp = () => appwinCtl.current?.close();
  }, [openApp]);

  const rootEl = React.useCallback((n: View | null) => {
    (root as { current: View | null }).current = n;
    const el = n as unknown as HTMLElement | null;
    if (el) {
      el.style.userSelect = "none";
      (el.style as unknown as Record<string, string>).webkitUserSelect = "none";
    }
    if (el) attachGestures(el, {
      unlock: () => set("locked", false),
      lockDrag: (dy) => lockCtl.drag(dy),
      lockReset: () => lockCtl.reset(),
      sheetDrag: (dy) => sheetCtl.track(dy),
      sheetPreview: (w, dy) => sheetCtl.preview(w, dy),
      sheetPreviewEnd: (commit) => sheetCtl.previewEnd(commit),
      closeSwitcher: () => set("switcherOpen", false),
      hasSwitcher: () => sys.switcherOpen,
      openSheet: (x) => set("sheet", x as never),
      closeSheet: () => set("sheet", null),
      openSwitcher: () => { if (sys.recents.length) set("switcherOpen", true); },
      appDrag: (dy) => appwinCtl.current?.drag(dy),
      appRelease: (dy, vy) => { appwinCtl.current?.release(dy, vy); },
      isLocked: () => sys.locked,
      hasSheet: () => sys.sheet != null,
      hasApp: () => sys.activeApp != null,
      hasRecents: () => sys.recents.length > 0,
    });
  }, []);

  return (
    <View ref={rootEl} style={st.phone}>
      <View style={st.wall} nativeID="wp" pointerEvents="none" />
      {!s.locked && <HomeGrid onOpen={(id) => openApp(id)} onSpot={() => {}} />}
      {s.locked && <LockScreen />}
      {s.activeApp && from && (
        <AppWindow id={s.activeApp} from={from} onClosed={() => { set("activeApp", null); setFrom(null); }} />
      )}
      <SheetHost />
      {s.switcherOpen && <Recents onOpen={(id, r) => { set("switcherOpen", false); openApp(id, r); }} />}
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
});
