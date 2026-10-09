// main.ts — boot : charge le moteur C (springs) + C++ (raster), monte le shell.
import "./styles.css";
import { loadWasm } from "./wasm/bridge";
import { Shell } from "./shell/shell";

async function boot() {
  await loadWasm();
  const phone = document.getElementById("phone")!;
  new Shell(phone);
}

boot();
