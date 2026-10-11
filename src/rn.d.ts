/// <reference types="vite/client" />

// 'react-native' est aliasé sur react-native-web (vite.config) —
// les types sont ceux de RNW.
declare module "react-native" {
  export * from "react-native-web";
}
