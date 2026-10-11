// HomeGrid.tsx — 2 widgets, grille 4×3, pill recherche, dock 4, homebar.
import * as React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Icon } from "./Icon";
import { glassStyle, domOf, lg } from "./fx";
import type { AppId } from "../system/state";
import { APPS, INSTALLED, EXTRA_APPS } from "../apps/registry";
import { appMeta } from "./apps";

export const DOCK: AppId[] = ["phone", "safari", "messages", "music"];

function Tile({ id, inDock, onOpen }: { id: AppId; inDock?: boolean; onOpen: (id: AppId, el: HTMLElement | null) => void }) {
  const a = appMeta(id);
  const tileRef = React.useRef<View>(null);
  React.useEffect(() => {
    const el = domOf(tileRef);
    if (el) el.style.background = a.color; // dégradés via DOM (RN ne sait pas)
  }, [a.color]);
  return (
    <Pressable onPress={() => onOpen(id, domOf(tileRef))} style={s.icon}>
      <View ref={tileRef} nativeID={inDock ? `dock-${id}` : `icon-${id}`} style={s.tile}>
        <Icon name={a.icon} size={30} color="#fff" />
      </View>
      {!inDock && <Text style={s.nm} numberOfLines={1}>{a.name}</Text>}
    </Pressable>
  );
}

export function HomeGrid({ onOpen, onSpot }: { onOpen: (id: AppId, el: HTMLElement | null) => void; onSpot: () => void }) {
  return (
    <View style={s.home} nativeID="home">
      <View style={s.wdgRow}>
        <View {...lg} style={[s.wdg, glassStyle(0.05) as object]}>
          <View style={s.wt}>
            <Text style={s.wtTx}>SAN FRANCISCO</Text>
            <Icon name="sun" size={14} color="rgba(255,255,255,.85)" />
          </View>
          <View>
            <Text style={s.wdgTemp}>72°</Text>
            <Text style={s.wdgSub}>Mostly Clear</Text>
          </View>
        </View>
        <View {...lg} style={[s.wdg, glassStyle(0.05) as object]}>
          <Text style={s.wtTx}>CALENDAR SAT 6</Text>
          <View>
            <Text style={s.wdgEvtT1}>Design{"\n"}Review</Text>
            <Text style={s.wdgEvtT2}>10:00 – 11:30</Text>
          </View>
        </View>
      </View>

      <View style={s.grid}>
        {APPS.concat(EXTRA_APPS.filter((a) => INSTALLED.has(a.id))).map((a) => <Tile key={a.id} id={a.id} onOpen={onOpen} />)}
      </View>

      <Pressable onPress={onSpot} nativeID="search-capsule" {...lg} style={[s.search, glassStyle(0.05) as object]}>
        <Icon name="search" size={14} color="rgba(255,255,255,.8)" />
        <Text style={s.searchTx}>Search</Text>
      </Pressable>

      <View {...lg} style={[s.dock, glassStyle(0.05) as object]}>
        {DOCK.map((id) => <Tile key={id} id={id} inDock onOpen={onOpen} />)}
      </View>

      <View style={s.homebar} pointerEvents="none" />
    </View>
  );
}

const s = StyleSheet.create({
  home: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, paddingTop: 96, paddingHorizontal: 24, zIndex: 10 },
  wdgRow: { flexDirection: "row", gap: 16, marginBottom: 40 },
  wdg: { flex: 1, height: 160, borderRadius: 30, padding: 20, justifyContent: "space-between", overflow: "hidden" },
  wt: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  wtTx: { fontSize: 14, fontWeight: "700", letterSpacing: 0.3, color: "#fff" },
  wdgTemp: { fontSize: 48, fontWeight: "200", letterSpacing: -1.9, color: "#fff", lineHeight: 48 },
  wdgSub: { fontSize: 12, fontWeight: "600", color: "#fff", marginTop: 4 },
  wdgEvtT1: { fontSize: 18, fontWeight: "700", color: "#fff", lineHeight: 22 },
  wdgEvtT2: { fontSize: 12, color: "#fff", marginTop: 4, fontWeight: "500" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 32 },
  icon: { width: 73, alignItems: "center", gap: 8 },
  tile: {
    width: 68, height: 68, borderRadius: 22, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,.2)",
    boxShadow: "inset 0 1px 1px rgba(255,255,255,.5), 0 8px 16px rgba(0,0,0,.2)",
  } as object,
  nm: { fontSize: 12, fontWeight: "600", color: "#fff", letterSpacing: 0.24 },
  search: {
    alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, marginTop: "auto", marginBottom: 12,
  },
  searchTx: { color: "#fff", fontSize: 13, fontWeight: "600" },
  // capsule élargie (margin -8) + space-between : les icônes tombent sous
  // les colonnes de la grille, espacement identique au springboard.
  dock: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 16, paddingHorizontal: 10,
    borderRadius: 40, marginBottom: 32, marginHorizontal: -10,
  },
  homebar: {
    position: "absolute", left: "50%", bottom: 10, width: 134, height: 5,
    marginLeft: -67, borderRadius: 3, backgroundColor: "rgba(255,255,255,.9)",
  },
});
