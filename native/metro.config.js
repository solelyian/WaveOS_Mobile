const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const path = require("path");
const root = path.resolve(__dirname, "..");
const SINGLE_COPY_PKGS = new Set(["react", "react-native", "react-native-svg", "lucide-react-native"]);

module.exports = mergeConfig(getDefaultConfig(__dirname), {
  watchFolders: [root],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, "node_modules"),
      path.resolve(root, "node_modules"),
    ],
    // Une seule copie de react/react-native : sinon src/* (racine) et RN
    // (native/) chargent deux React → dispatcher null, "useReducer of null".
    extraNodeModules: {
      react: path.resolve(__dirname, "node_modules/react"),
      "react-native": path.resolve(__dirname, "node_modules/react-native"),
      "react-native-svg": path.resolve(__dirname, "node_modules/react-native-svg"),
      "lucide-react-native": path.resolve(__dirname, "node_modules/lucide-react-native"),
    },
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === "react-native-web") {
        return context.resolveRequest(context, "react-native", platform);
      }
      if (SINGLE_COPY_PKGS.has(moduleName)) {
        // Force la copie native : un src/* trouverait sinon root/node_modules.
        return context.resolveRequest(
          { ...context, originModulePath: path.join(__dirname, "index.js") },
          moduleName, platform);
      }
      if (moduleName.endsWith("?raw")) {
        return { filePath: path.join(__dirname, "emptyRaw.js"), type: "sourceFile" };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
});
