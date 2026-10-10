// main.ts — boot : charge le moteur C (springs) + C++ (raster), monte le shell.
import "./styles.css";
import { loadWasm } from "./wasm/bridge";
import { Shell } from "./shell/shell";
import { runBoot } from "./shell/boot";

async function boot() {
  const phone = document.getElementById("phone")!;
  // le téléphone se met à l'échelle pour remplir la fenêtre (desktop redimensionnable)
  // 428×878 = 400×850 du #phone + bezel 14px de chaque côté
  const fit = () => {
    const s = Math.min(1.6, innerWidth / 428, innerHeight / 878);
    phone.style.transform = `scale(${s.toFixed(4)})`;
  };
  addEventListener("resize", fit);
  fit();
  const splash = runBoot(phone);           // animation par-dessus tout
  await loadWasm();
  new Shell(phone);
  await splash;                            // le lockscreen est déjà rendu dessous
}

boot();
