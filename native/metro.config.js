const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const path = require("path");
const root = path.resolve(__dirname, "..");

module.exports = mergeConfig(getDefaultConfig(__dirname), {
  watchFolders: [root],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, "node_modules"),
      path.resolve(root, "node_modules"),
    ],
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === "react-native-web") {
        return context.resolveRequest(context, "react-native", platform);
      }
      if (moduleName.endsWith("?raw")) {
        return { filePath: path.join(__dirname, "emptyRaw.js"), type: "sourceFile" };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
});
