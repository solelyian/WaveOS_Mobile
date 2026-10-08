// Camera.tsx — viseur réaliste : scène « rubans » en fond (rendu CSS
// dégradé + silhouettes), modes PHOTO/VIDÉO/PANO, zoom ×1/×2/×5,
// déclencheur avec flash écran, pellicule des dernières prises (compteur),
// flash auto, grille optionnelle.
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { fs, Icon, useTheme } from "../rn";

const MODES = ["PANO", "PHOTO", "VIDÉO"] as const;

function Scene(): ReactNode {
  // Viseur simulé : dégradé ciel + rubans du wallpaper + skyline.
  return (
    <View style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <View style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#141a3a 0%,#23306b 45%,#5a4a8a 75%,#8a5a7a 100%)" } as object} />
      <View style={{
        position: "absolute", left: -40, top: "30%", width: "200%", height: 90,
        background: "linear-gradient(90deg,transparent,#7DA2FF55,transparent)",
        transform: [{ rotate: "-16deg" }],
      } as object} />
      <View style={{
        position: "absolute", left: -40, top: "55%", width: "200%", height: 60,
        background: "linear-gradient(90deg,transparent,#2FCC9244,transparent)",
        transform: [{ rotate: "-16deg" }],
      } as object} />
      {/* skyline */}
      {[14, 22, 30, 18, 26, 12, 20].map((h, i) => (
        <View key={i} style={{
          position: "absolute", bottom: 0, left: `${i * 16}%`, width: "14%",
          height: `${h + 30}%`, backgroundColor: "rgba(6,8,20,.85)",
          borderTopLeftRadius: 3, borderTopRightRadius: 3,
        }} />
      ))}
    </View>
  );
}

export function CameraApp(): ReactNode {
  const p = useTheme();
  const [mode, setMode] = useState<(typeof MODES)[number]>("PHOTO");
  const [zoom, setZoom] = useState(1);
  const [flash, setFlash] = useState(false);
  const [shots, setShots] = useState(0);
  const [rec, setRec] = useState(false);
  const [recT, setRecT] = useState(0);
  const [grid, setGrid] = useState(false);
  const iv = useRef<ReturnType<typeof setInterval> | null>(null);

  const shoot = () => {
    if (mode === "VIDÉO") {
      setRec(r => {
        const nr = !r;
        if (nr) { setRecT(0); iv.current = setInterval(() => setRecT(t => t + 1), 1000); }
        else if (iv.current) { clearInterval(iv.current); iv.current = null; setShots(s => s + 1); }
        return nr;
      });
      return;
    }
    setFlash(true);
    setTimeout(() => setFlash(false), 160);
    setShots(s => s + 1);
  };
  useEffect(() => () => { if (iv.current) clearInterval(iv.current); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Scene />
      {/* grille optionnelle */}
      {grid ? (
        <View style={{ position: "absolute", inset: 0 }} pointerEvents="none">
          {[1, 2].map(i => <View key={"v" + i} style={{ position: "absolute", left: `${i * 33.33}%`, top: 0, bottom: 0, width: 0.5, backgroundColor: "rgba(255,255,255,.28)" }} />)}
          {[1, 2].map(i => <View key={"h" + i} style={{ position: "absolute", top: `${i * 33.33}%`, left: 0, right: 0, height: 0.5, backgroundColor: "rgba(255,255,255,.28)" }} />)}
        </View>
      ) : null}
      {/* flash capture */}
      {flash ? <View style={{ position: "absolute", inset: 0, backgroundColor: "#fff" }} pointerEvents="none" /> : null}
      {/* REC */}
      {rec ? (
        <View style={{ position: "absolute", top: 62, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,.5)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B30" }} />
          <Text style={{ color: "#fff", fontSize: 14, fontVariant: ["tabular-nums" as never] }}>{`${Math.floor(recT / 60)}:${String(recT % 60).padStart(2, "0")}`}</Text>
        </View>
      ) : null}
      {/* barre haute */}
      <View style={{ position: "absolute", top: 58, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 22 }}>
        <Icon name="zap" size={18} color="#fff" sw={2.2} />
        <Icon name="moon" size={17} color="#fff" sw={2.2} />
        <Pressable onPress={() => setGrid(g => !g)}><Icon name="layout-grid" size={17} color={grid ? "#F0C040" : "#fff"} sw={2.2} /></Pressable>
        <Icon name="switch-camera" size={18} color="#fff" sw={2.2} />
      </View>
      {/* zoom */}
      <View style={{ position: "absolute", bottom: 170, alignSelf: "center", flexDirection: "row", gap: 8 }}>
        {[1, 2, 5].map(z => (
          <Pressable key={z} onPress={() => setZoom(z)} style={{
            width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center",
            backgroundColor: zoom === z ? "rgba(255,255,255,.85)" : "rgba(0,0,0,.45)",
          }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: zoom === z ? "#000" : "#fff" }}>×{z}</Text>
          </Pressable>
        ))}
      </View>
      {/* modes */}
      <View style={{ position: "absolute", bottom: 128, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 26 }}>
        {MODES.map(m => (
          <Pressable key={m} onPress={() => setMode(m)}>
            <Text style={{ fontSize: fs(13, p), fontWeight: m === mode ? "700" : "500", color: m === mode ? "#F0C040" : "rgba(255,255,255,.75)", letterSpacing: 0.4 }}>{m}</Text>
          </Pressable>
        ))}
      </View>
      {/* rangée déclencheur */}
      <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
        {/* pellicule */}
        <View style={{ width: 42, height: 42, borderRadius: 10, overflow: "hidden", backgroundColor: "#23306b", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{shots || ""}</Text>
        </View>
        <Pressable onPress={shoot} style={{
          width: 72, height: 72, borderRadius: 36, borderWidth: 5, borderColor: "#fff",
          alignItems: "center", justifyContent: "center",
        }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: rec ? "#FF3B30" : mode === "VIDÉO" ? "#FF3B30" : "#fff" }} />
        </Pressable>
        <View style={{ width: 42, alignItems: "center" }}>
          <Icon name="switch-camera" size={26} color="#fff" sw={2} />
        </View>
      </View>
    </View>
  );
}
