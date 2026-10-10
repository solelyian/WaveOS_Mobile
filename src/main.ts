// main.ts — boot : charge le moteur C (springs) + C++ (raster), monte le shell.
import "./styles.css";
import { loadWasm } from "./wasm/bridge";
import { Shell } from "./shell/shell";
import { runBoot } from "./shell/boot";

async function boot() {
  const phone = document.getElementById("phone")!;
  const splash = runBoot(phone);           // animation par-dessus tout
  await loadWasm();
  new Shell(phone);
  await splash;                            // le lockscreen est déjà rendu dessous
}

boot();
