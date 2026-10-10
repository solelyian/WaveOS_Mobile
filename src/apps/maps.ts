// maps.ts — Plans : fond raster rendu par le moteur C++ (wavegfx.cpp),
// recherche glass, chips, repère Union Square, carte du bas (maquette).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { W } from "../wasm/bridge";
import { shell } from "../shell/api";
import { img } from "./ui";

let mapData: Uint8ClampedArray | null = null;
const MW = 480, MH = 850;

function ensureMap() {
  if (mapData) return;
  const w = W();
  w.wg_map_size(MW, MH);
  w.wg_map_render();
  const ptr = w.wg_map_ptr();
  mapData = new Uint8ClampedArray(w.memory.buffer, ptr, MW * MH * 4);
}

export function MapsApp() {
  const canvas = h("canvas", { style: { position: "absolute", inset: "0", width: "100%", height: "100%", filter: "grayscale(.2)" } }) as HTMLCanvasElement;
  canvas.width = MW; canvas.height = MH;
  const ctx = canvas.getContext("2d")!;
  try {
    ensureMap();
    ctx.putImageData(new ImageData(mapData!.slice(), MW, MH), 0, 0);
  } catch {
    canvas.style.background = "#e5e3df";
  }

  return h("div", { style: { height: "100%", position: "relative", background: "#e5e3df", overflow: "hidden" } },
    canvas,
    // barre de recherche
    h("div", { style: { position: "absolute", top: "56px", left: "16px", right: "16px", zIndex: "20" } },
      h("div", { class: "g-light", style: { borderRadius: "24px", height: "48px", display: "flex", alignItems: "center", padding: "0 16px", gap: "12px", background: "rgba(255,255,255,.4)" } },
        h("button", { class: "pressable", style: { padding: "4px", background: "rgba(255,255,255,.6)", borderRadius: "50%", border: "1px solid rgba(255,255,255,.4)", display: "flex" }, onClick: () => shell.closeApp() }, svgIcon(I.chevronLeft, "", 16)),
        svgIcon(I.search, "", 18),
        h("input", { attrs: { type: "text", placeholder: "Search Maps" }, style: { background: "transparent", outline: "none", border: "none", flex: "1", fontSize: "14px", fontWeight: "500", color: "#000" } }),
        h("div", { style: { width: "32px", height: "32px", borderRadius: "50%", background: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", boxShadow: "inset 0 1px 1px rgba(255,255,255,.4)", flexShrink: "0" } }, "JD")),
      h("div", { class: "no-sb", style: { display: "flex", gap: "8px", marginTop: "12px", overflowX: "auto", paddingLeft: "4px" } },
        ...["Restaurants", "Gas", "Groceries", "Hotels"].map((c) =>
          h("button", { class: "pressable g-light", style: { padding: "6px 16px", background: "rgba(255,255,255,.6)", borderRadius: "999px", fontSize: "12px", fontWeight: "700", color: "#1f2937", whiteSpace: "nowrap" } }, c)))),
    // repère central
    h("div", { style: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: "10", display: "flex", flexDirection: "column", alignItems: "center" } },
      h("div", { style: { background: "rgba(255,255,255,.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,.5)", padding: "6px 12px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,.15)", fontSize: "12px", fontWeight: "700", marginBottom: "4px", whiteSpace: "nowrap", color: "#111" } }, "Union Square"),
      h("div", { style: { color: "#ef4444", filter: "drop-shadow(0 10px 15px rgba(0,0,0,.3))" } }, svgIcon(I.mapPin, "fill", 36))),
    // carte du bas
    h("div", { class: "g-light", style: { position: "absolute", bottom: "32px", left: "16px", right: "16px", background: "rgba(255,255,255,.6)", borderRadius: "32px", padding: "20px 20px 32px", zIndex: "20" } },
      h("div", { style: { width: "48px", height: "4px", background: "rgba(0,0,0,.2)", borderRadius: "2px", margin: "0 auto 16px" } }),
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" } },
        h("div", {},
          h("h2", { style: { fontSize: "20px", fontWeight: "700", color: "rgba(0,0,0,.9)" } }, "Union Square"),
          h("p", { style: { fontSize: "14px", color: "rgba(0,0,0,.6)" } }, "Public Plaza • 0.2 mi away")),
        h("button", { class: "pressable", style: { width: "48px", height: "48px", borderRadius: "50%", background: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 15px -3px rgba(59,130,246,.3)", border: "1px solid #60a5fa" } }, svgIcon(I.navigation, "fill", 20))),
      h("div", { class: "no-sb", style: { display: "flex", gap: "16px", overflowX: "auto" } },
        ...[1, 2, 3].map((i) =>
          h("div", { style: { width: "96px", height: "96px", flexShrink: "0", borderRadius: "16px", background: "#e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.1)", border: "1px solid rgba(255,255,255,.5)" } },
            (() => { const im = img(`/img/maps-${i}.jpg`); im.style.cssText = "width:100%;height:100%;object-fit:cover"; return im; })())))));
}
