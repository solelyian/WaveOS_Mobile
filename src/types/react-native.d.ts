// react-native.d.ts — types du sous-ensemble RN utilisé par les apps du
// prototype. react-native-web ne publie pas de types (Flow only) : on
// déclare l'API qu'on consomme, calée sur la surface RN réelle. Les styles
// acceptent les noms RN (paddingHorizontal, borderRadius…) — RNW les
// traduit en CSS ; `background`/`backdropFilter` passent aussi (web).
declare module "react-native" {
  import type { CSSProperties, ReactNode, Ref } from "react";

  export type Style = Record<string, unknown>;
  // StyleProp volontairement permissif (les noms RN sont traduits en CSS au
  // runtime) mais distinct de `unknown` pour préserver le typage contextuel
  // des fonctions style Pressable ({pressed}).
  export type StyleProp = object | false | null | undefined;

  export interface PressableState { pressed: boolean; hovered?: boolean }

  export interface ViewProps {
    children?: ReactNode;
    style?: StyleProp;
    pointerEvents?: "auto" | "none" | "box-none";
    testID?: string;
    role?: string;
    ref?: Ref<HTMLElement>;
  }
  export const View: (p: ViewProps) => ReactNode;

  export interface TextProps {
    children?: ReactNode;
    style?: StyleProp;
    numberOfLines?: number;
    selectable?: boolean;
  }
  export const Text: (p: TextProps) => ReactNode;

  export interface PressableProps {
    children?: ReactNode;
    onPress?: () => void;
    onLongPress?: () => void;
    onHoverIn?: () => void;
    onHoverOut?: () => void;
    disabled?: boolean;
    style?: StyleProp | ((s: PressableState) => StyleProp);
    hitSlop?: number;
    accessibilityLabel?: string;
    ref?: Ref<HTMLElement>;
  }
  export const Pressable: (p: PressableProps) => ReactNode;

  export interface ScrollViewProps {
    children?: ReactNode;
    style?: StyleProp;
    contentContainerStyle?: StyleProp;
    horizontal?: boolean;
    showsVerticalScrollIndicator?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    onContentSizeChange?: () => void;
    keyboardShouldPersistTaps?: "always" | "handled" | "never";
    ref?: Ref<ScrollViewHandle>;
  }
  export interface ScrollViewHandle {
    scrollToEnd(o?: { animated?: boolean }): void;
    scrollTo(o: { x?: number; y?: number; animated?: boolean }): void;
  }
  export const ScrollView: (p: ScrollViewProps) => ReactNode;

  export interface FlatListProps<T> {
    data: T[];
    renderItem: (info: { item: T; index: number }) => ReactNode;
    keyExtractor?: (item: T, index: number) => string;
    style?: StyleProp;
    contentContainerStyle?: StyleProp;
    numColumns?: number;
    columnWrapperStyle?: StyleProp;
    ListHeaderComponent?: ReactNode | (() => ReactNode);
    ListFooterComponent?: ReactNode | (() => ReactNode);
    ItemSeparatorComponent?: ReactNode | (() => ReactNode);
    showsVerticalScrollIndicator?: boolean;
    ListEmptyComponent?: ReactNode | (() => ReactNode);
    stickyHeaderIndices?: number[];
  }
  export const FlatList: <T>(p: FlatListProps<T>) => ReactNode;

  export interface TextInputProps {
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    multiline?: boolean;
    autoFocus?: boolean;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
    onSubmitEditing?: () => void;
    returnKeyType?: string;
    style?: StyleProp;
    ref?: Ref<HTMLInputElement>;
  }
  export const TextInput: (p: TextInputProps) => ReactNode;

  export interface SwitchProps {
    value: boolean;
    onValueChange: (v: boolean) => void;
    trackColor?: { false?: string; true?: string };
    thumbColor?: string;
    disabled?: boolean;
    style?: StyleProp;
  }
  export const Switch: (p: SwitchProps) => ReactNode;

  export interface ImageProps {
    source: { uri: string } | number;
    style?: StyleProp;
    resizeMode?: "cover" | "contain" | "stretch" | "center";
    ref?: Ref<HTMLImageElement>;
  }
  export const Image: (p: ImageProps) => ReactNode;

  export interface ImageBackgroundProps extends ImageProps {
    children?: ReactNode;
    imageStyle?: StyleProp;
  }
  export const ImageBackground: (p: ImageBackgroundProps) => ReactNode;

  export const StyleSheet: {
    create<T extends Record<string, Style>>(s: T): T;
    hairlineWidth: number;
  };

  export const Animated: unknown;
  export const Platform: { OS: string; select<T>(o: Record<string, T>): T };
}
