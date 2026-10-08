// index.ts — point d'entrée du kit RN Sillage.
export { ThemeRoot, useTheme, fs, type Palette } from "./theme";
export { Icon } from "./icons";
export {
  Scr, Nav, Group, Row, SecTitle, Search, Seg, Tg, Avatar, Badge,
  TabBar, Empty, Pill, Spark, AreaChart, Rings,
} from "./ui";
export { StackNav, useStack } from "./stack";
export { rnApp, unmountRN } from "./host";
