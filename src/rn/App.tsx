// App.tsx — coquille téléphone : wallpaper, boot NYNE, lockscreen, statusbar,
// DI, sheets, fenêtre d'app (morph) et switcher de recents.
import * as React from "react";
import { View, StyleSheet } from "react-native";
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
import { Spotlight } from "./Spotlight";
import { liquidGlassAll } from "./glass";
import { host, pushRecent, type AppRect } from "./host";
import { mountBoot } from "../system/bootAnimation";
import { domOf } from "./fx";

function Boot({ onDone }: { onDone: () => void }) {
  const ref = React.useRef<View>(null);
  React.useLayoutEffect(() => {
    const el = domOf(ref);
    if (el) return mountBoot(el, onDone);
    return undefined;
  }, [onDone]);
  return <View ref={ref} nativeID="boot" style={st.boot} />;
}

/** Rect écran → espace téléphone 400×850 (origine du morph). */
function elRect(el: HTMLElement): AppRect | null {
  const phone = document.getElementById("phone");
  if (!phone) return null;
  const pr = phone.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const sx = 400 / pr.width, sy = 850 / pr.height;
  return { x: (r.left - pr.left) * sx, y: (r.top - pr.top) * sy, w: r.width * sx, h: r.height * sy };
}

export default function App() {
  const s = useSys();
  const [booted, setBooted] = React.useState(false);
  const done = React.useCallback(() => setBooted(true), []);
  const [from, setFrom] = React.useState<AppRect | null>(null);
  const [spot, setSpot] = React.useState(false);
  const root = React.useRef<View>(null);

  const srcEl = React.useRef<HTMLElement | null>(null);

  const iconRect = React.useCallback((id: AppId): AppRect | null => {
    const tile = document.getElementById(`icon-${id}`) ?? document.getElementById(`dock-${id}`);
    return tile ? elRect(tile) : null;
  }, []);

  const openApp = React.useCallback((id: AppId, elOrRect?: HTMLElement | AppRect | null) => {
    if (sys.activeApp === id) return;
    if (sys.activeApp) { // « Open » depuis une app : fermer puis morph depuis la tuile
      appwinCtl.current?.close();
      setTimeout(() => openApp(id), 420);
      return;
    }
    const r = (elOrRect instanceof HTMLElement ? elRect(elOrRect) : elOrRect)
      ?? iconRect(id) ?? { x: 170, y: 380, w: 60, h: 60 };
    srcEl.current = elOrRect instanceof HTMLElement ? elOrRect
      : document.getElementById(`icon-${id}`) ?? document.getElementById(`dock-${id}`);
    if (srcEl.current) srcEl.current.style.opacity = "0"; // icône source masquée pendant le morph (maquette : setIconHidden)
    pushRecent(id);
    setFrom(r);
    set("activeApp", id);
    requestAnimationFrame(() => requestAnimationFrame(() => liquidGlassAll(document.getElementById("phone") ?? document)));
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
      openSwitcher: () => {
        if (!sys.recents.length) return;
        appwinCtl.current?.close(); // l'app remonte vers son icône derrière le switcher
        set("switcherOpen", true);
      },
      appDrag: (dy) => appwinCtl.current?.drag(dy),
      appRelease: (dy, vy) => { appwinCtl.current?.release(dy, vy); },
      isLocked: () => sys.locked,
      hasSheet: () => sys.sheet != null,
      hasApp: () => sys.activeApp != null,
      hasRecents: () => sys.recents.length > 0,
    });
  }, []);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() =>
      liquidGlassAll(document.getElementById("phone") ?? document)));
    return () => cancelAnimationFrame(id);
  }, [s.locked, spot]);
  React.useEffect(() => {
    const wallpaper = document.getElementById("wp");
    if (!wallpaper) return;
    const level = s.locked || s.sheet ? 2 : s.activeApp ? 1 : 0;
    const states = [
      { scale: 1, blur: 0, brightness: 1, saturation: 1 },
      { scale: 1.05, blur: 4, brightness: .6, saturation: 1 },
      { scale: 1.1, blur: 10, brightness: .7, saturation: 1.2 },
    ];
    const { scale, blur, brightness, saturation } = states[level];
    wallpaper.style.transition = "transform .5s ease, filter .5s ease";
    wallpaper.style.transform = `scale(${scale})`;
    wallpaper.style.filter = `blur(${blur}px) brightness(${brightness}) saturate(${saturation})`;
  }, [s.locked, s.sheet, s.activeApp]);
  return (
    <View ref={rootEl} style={st.phone}>
      <View style={st.wall} nativeID="wp" pointerEvents="none" />
      {!s.locked && <HomeGrid onOpen={(id, el) => openApp(id, el)} onSpot={() => setSpot(true)} />}
      {s.locked && <LockScreen />}
      {s.activeApp && from && (
        <AppWindow key={s.activeApp} id={s.activeApp} from={from}
          onClosed={() => { if (srcEl.current) srcEl.current.style.opacity = "1"; srcEl.current = null; set("activeApp", null); setFrom(null); }} />
      )}
      <SheetHost />
      {s.switcherOpen && <Recents onOpen={(id, r) => { set("switcherOpen", false); openApp(id, r); }} />}
      {spot && <Spotlight onOpen={(id) => { setSpot(false); openApp(id); }} onClose={() => setSpot(false)} />}
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
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
    backgroundColor: "#000", overflow: "hidden",
  },
});
