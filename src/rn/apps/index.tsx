// apps/index.tsx — registre RN : métadonnées (réutilise le registry pur TS de
// main) + rendu des apps construites une par une ; Stub pour le reste.
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { APPS, EXTRA_APPS } from "../../apps/registry";
import type { AppMeta } from "../../apps/registry";
import type { AppId } from "../../system/state";
import { Icon } from "../Icon";
import { SettingsApp } from "./SettingsApp";
import { MessagesApp } from "./MessagesApp";

export function appMeta(id: AppId): AppMeta {
  return APPS.find((a) => a.id === id) ?? EXTRA_APPS.find((a) => a.id === id)!;
}

function StubApp({ id }: { id: AppId }) {
  const m = appMeta(id);
  return (
    <View style={[sb.root, { backgroundColor: "#f4f4f5" }]}>
      <View style={[sb.ic, { backgroundColor: m.color.startsWith("#") ? m.color : "#666" }]}>
        <Icon n={m.icon} size={40} color="#fff" />
      </View>
      <Text style={sb.name}>{m.name}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  ic: { width: 90, height: 90, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 20, fontWeight: "700", color: "#111" },
});

export function renderApp(id: AppId): React.ReactNode {
  switch (id) {
    case "settings": return <SettingsApp />;
    case "messages": return <MessagesApp />;
    default: return <StubApp id={id} />;
  }
}
