// index.js — entrée React Native réelle : WaveOS natif, pas de WebView.
import { AppRegistry, Dimensions } from "react-native";

// Shim minimal pour les restes DOM dans les fichiers partagés non encore portés.
const el = () => ({
  style: {}, dataset: {}, children: [], classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  append() {}, prepend() {}, remove() {}, setAttribute() {}, removeAttribute() {},
  addEventListener() {}, removeEventListener() {},
  getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 }),
  querySelector: () => null, querySelectorAll: () => [], closest: () => null, matches: () => false,
  offsetWidth: 0, offsetHeight: 0, offsetLeft: 0, offsetTop: 0, isConnected: true,
});
global.document = global.document ?? {
  createElement: el, createElementNS: el, getElementById: () => null,
  querySelector: () => null, querySelectorAll: () => [],
  body: { append() {}, prepend() {}, style: {}, dataset: {} },
  documentElement: { style: { setProperty() {} }, dataset: {} },
  addEventListener() {}, removeEventListener() {},
};
const { width, height } = Dimensions.get("window");
global.window = global.window ?? global;
global.innerWidth = width;
global.innerHeight = height;
global.requestAnimationFrame = global.requestAnimationFrame ?? ((f) => setTimeout(() => f(Date.now()), 16));
global.performance = global.performance ?? { now: () => Date.now() };
global.location = global.location ?? { search: "?native" };
global.getComputedStyle = global.getComputedStyle ?? (() => ({ getPropertyValue: () => "", borderTopLeftRadius: "0px", width: "0", height: "0", boxSizing: "border-box", position: "static" }));
global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} };
global.MutationObserver = global.MutationObserver ?? class { observe() {} disconnect() {} };
global.ImageData = global.ImageData ?? class { constructor(px, w, h) { this.data = px; this.width = w; this.height = h; } };

import App from "../src/rn/App.native";
AppRegistry.registerComponent("WaveOS", () => App);
