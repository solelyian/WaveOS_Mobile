// main.ts — entrée web : styles du stage + mount de l'app RN dans #phone.
import { AppRegistry } from "react-native-web";
import App from "./rn/App";

const PHONE_W = 400, PHONE_H = 850;

function layoutStage() {
  const stage = document.getElementById("stage")!;
  const phone = document.getElementById("phone")!;
  const s = Math.min(1.6, innerWidth / 428, innerHeight / 878);
  Object.assign(document.body.style, { margin: "0", background: "#050505", overflow: "hidden" });
  Object.assign(stage.style, {
    position: "fixed", inset: "0", display: "flex",
    alignItems: "center", justifyContent: "center",
  });
  Object.assign(phone.style, {
    position: "relative", width: `${PHONE_W}px`, height: `${PHONE_H}px`,
    transform: `scale(${s})`, flexShrink: "0",
    background: "#0a0a0c", borderRadius: "60px",
    boxShadow: "0 0 0 10px #0a0a0c, 0 0 0 11px #1c1c22, 0 40px 80px rgba(0,0,0,.6)",
  });
}
addEventListener("resize", layoutStage);
layoutStage();

AppRegistry.registerComponent("waveos", () => App);
AppRegistry.runApplication("waveos", { rootTag: document.getElementById("phone") });
