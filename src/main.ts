// main.ts — point d'entrée : charge le WASM, monte le shell, séquence de boot.
import "./styles.css";
import { initWasm } from "./wasm/bridge";
import { Shell } from "./shell/shell";
import { el, svgEl } from "./core/el";
import { set } from "./system/state";

// Échelle d'affichage : le téléphone 393×852 tient dans la fenêtre.
function fitStage(): void {
  const s = Math.min(1.12, (window.innerHeight - 110) / 852, (window.innerWidth - 48) / 393);
  const stage = document.getElementById("stage")!;
  stage.style.transform = `scale(${Math.max(0.5, s)})`;
}

function buildBoot(): void {
  const boot = document.getElementById("boot")!;
  const ring = svgEl("svg", { viewBox: "0 0 96 96" },
    svgEl("circle", { cx: 48, cy: 48, r: 44, class: "obase" }),
    svgEl("circle", { cx: 48, cy: 48, r: 44, class: "o" }));
  boot.append(
    el("div", { class: "brand" }, "Nyne"),
    el("div", { class: "ring" }, ring as unknown as Node),
    el("div", { class: "word" }, "WaveOS"),
    el("div", { class: "tagline" }, "Sillage — prototype 0.9"),
  );
  const done = () => boot.classList.add("done");
  boot.addEventListener("click", done, { once: true });
  window.setTimeout(done, 2900);
}

async function main(): Promise<void> {
  await initWasm();
  fitStage();
  window.addEventListener("resize", fitStage);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) set("reduced", true);
  buildBoot();
  new Shell();
}

main().catch((e) => {
  const n = document.getElementById("stage-note")!;
  n.textContent = `Échec d'initialisation : ${e instanceof Error ? e.message : e}`;
  n.style.color = "#FF6B57";
});
