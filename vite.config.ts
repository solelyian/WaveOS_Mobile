import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: { "react-native": "react-native-web" },
  },
  server: { host: true, port: 5173 },
  build: { target: "es2022", sourcemap: true }
});
