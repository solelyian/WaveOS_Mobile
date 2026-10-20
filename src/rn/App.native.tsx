// App.native.tsx — coquille téléphone native : wallpaper, lockscreen,
// statusbar, DI, sheets, fenêtre d'app (morph) et switcher de recents.
import * as React from "react";
import { View, StyleSheet, ImageBackground, Text, ScrollView } from "react-native";
import { useSys, set } from "./sys";
import { LockScreen, lockCtl } from "./LockScreen";
import { StatusBar } from "./StatusBar";
import { DynamicIsland } from "./DynamicIsland";
import { HomeGrid } from "./HomeGrid";
import { useGestures } from "./gestures.native";
import { sys } from "../system/state";
import type { AppId } from "../system/state";
import { SheetHost, sheetCtl } from "./SheetHost";
import { AppWindow, appwinCtl } from "./AppWindow";
import { Recents } from "./Recents";
import { Spotlight } from "./Spotlight";
import { host, pushRecent, type AppRect } from "./host";

const wallpaper = require("../../native/assets/wallpaper.jpg");

function AppImpl() {
  const s = useSys();
  const [from, setFrom] = React.useState<AppRect | null>(null);
  const [spot, setSpot] = React.useState(false);
  const srcEl = React.useRef<unknown>(null);

  const openApp = React.useCallback((id: AppId, rect?: AppRect | null) => {
    if (sys.activeApp === id) return;
    if (sys.activeApp) { appwinCtl.current?.close(); setTimeout(() => openApp(id), 420); return; }
    const r = rect ?? { x: 170, y: 380, w: 60, h: 60 };
    pushRecent(id);
    setFrom(r);
    set("activeApp", id);
  }, []);

  React.useEffect(() => {
    host.openApp = (id) => openApp(id);
    host.closeApp = () => appwinCtl.current?.close();
  }, [openApp]);

  const pan = useGestures({
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
      appwinCtl.current?.close();
      set("switcherOpen", true);
    },
    appDrag: (dy) => appwinCtl.current?.drag(dy),
    appRelease: (dy, vy) => { appwinCtl.current?.release(dy, vy); },
    isLocked: () => sys.locked,
    hasSheet: () => sys.sheet != null,
    hasApp: () => sys.activeApp != null,
    hasRecents: () => sys.recents.length > 0,
  });

  return (
    <View style={st.phone} {...pan}>
      <ImageBackground source={wallpaper} style={st.wall} resizeMode="cover" />
      {!s.locked && <HomeGrid onOpen={(id) => openApp(id)} onSpot={() => setSpot(true)} />}
      {s.locked && <LockScreen />}
      {s.activeApp && from && (
        <AppWindow key={s.activeApp} id={s.activeApp} from={from}
          onClosed={() => { set("activeApp", null); setFrom(null); }} />
      )}
      <SheetHost />
      {s.switcherOpen && <Recents onOpen={(id) => { set("switcherOpen", false); openApp(id); }} />}
      {spot && <Spotlight onOpen={(id) => { setSpot(false); openApp(id); }} onClose={() => setSpot(false)} />}
      <StatusBar />
      <DynamicIsland />
    </View>
  );
}

const st = StyleSheet.create({
  phone: { flex: 1, backgroundColor: "#0a0a0c", overflow: "hidden" },
  wall: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
});

// En release une erreur JS tue le processus sans trace — la boundary la rend
// visible à l'écran pour le debug du port.
class ErrBoundary extends React.Component<
  { children: React.ReactNode },
  { err: unknown }
> {
  state = { err: null as unknown };
  static getDerivedStateFromError(err: unknown) { return { err }; }
  render() {
    if (this.state.err) {
      const e = this.state.err;
      return (
        <View style={{ flex: 1, backgroundColor: "#0a0a0c", padding: 28, paddingTop: 80 }}>
          <Text style={{ color: "#ff6b6b", fontSize: 15, fontWeight: "600", marginBottom: 12 }}>
            WaveOS — erreur de rendu
          </Text>
          <ScrollView>
            <Text style={{ color: "#fff", fontSize: 11, fontFamily: "monospace" }}>
              {String((e as Error)?.stack ?? e)}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrBoundary>
      <AppImpl />
    </ErrBoundary>
  );
}
