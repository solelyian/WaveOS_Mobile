// main.ts — entrée web : styles du stage + mount de l'app RN dans #phone.
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import App from "./rn/App";
import { loadWasm } from "./wasm/bridge";
import { initTheme } from "./rn/theme";
import { NATIVE } from "./platform";

const PHONE_W = 400, PHONE_H = 850;

function layoutStage() {
  const stage = document.getElementById("stage")!;
  const phone = document.getElementById("phone")!;
  Object.assign(document.body.style, {
    margin: "0", background: "#050505", overflow: "hidden",
    overscrollBehavior: "none",
    WebkitTapHighlightColor: "transparent",
    WebkitTouchCallout: "none",
  });
  Object.assign(stage.style, { position: "fixed", inset: "0" });
  if (NATIVE) {
    // natif : le viewport EST l'écran du téléphone — pas de bezel ni de body.
    Object.assign(stage.style, { display: "block" });
    Object.assign(phone.style, {
      position: "relative", width: `${PHONE_W}px`, height: `${PHONE_H}px`,
      transform: `scale(${innerWidth / PHONE_W}, ${innerHeight / PHONE_H})`,
      transformOrigin: "0 0",
      background: "#0a0a0c",
      borderRadius: "0", boxShadow: "none",
    });
    return;
  }
  const s = Math.min(1.6, innerWidth / 428, innerHeight / 878);
  Object.assign(stage.style, {
    display: "flex",
    alignItems: "center", justifyContent: "center",
  });
  Object.assign(phone.style, {
    position: "relative", width: `${PHONE_W}px`, height: `${PHONE_H}px`,
    transform: `scale(${s})`, flexShrink: "0", transformOrigin: "",
    background: "#0a0a0c", borderRadius: "60px",
    boxShadow: "0 0 0 10px #0a0a0c, 0 0 0 11px #1c1c22, 0 40px 80px rgba(0,0,0,.6)",
  });
}
addEventListener("resize", layoutStage);
layoutStage();
// Tactile : manipulation garde le pan natif (les drags shell sont protégés
// par le preventDefault du routeur de gestes) et bloque le double-tap zoom.
document.getElementById("phone")!.style.touchAction = "manipulation";

createRoot(document.getElementById("phone")!).render(createElement(App));
loadWasm(); // moteur C++ : raster Maps, surfaces verre
initTheme(); // moteur Monet : palette extraite du wallpaper → accents système
