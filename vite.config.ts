import { defineConfig } from "vite";

export default defineConfig({
  server: { host: true, port: 5173 },
  build: { target: "es2022", sourcemap: true },
  resolve: {
    // Les apps sont écrites en React Native pur ; dans le prototype web,
    // react-native-web traduit les primitives en DOM.
    alias: { "react-native": "react-native-web" }
  },
  optimizeDeps: { include: ["react", "react-dom", "react-native-web"] }
});
