// rnw.d.ts — typage minimal de la surface react-native-web utilisée.
declare module "react-native-web" {
  import * as React from "react";
  export type Style = object | object[] | null | undefined;
  export interface GestureEvent {
    nativeEvent: { pageX: number; pageY: number; locationX?: number; locationY?: number };
  }
  export interface ViewProps {
    children?: React.ReactNode;
    style?: Style;
    className?: string;
    nativeID?: string;
    pointerEvents?: "auto" | "none" | "box-none" | "box-only";
    onLayout?: (e: { nativeEvent: { layout: { x: number; y: number; width: number; height: number } } }) => void;
    onStartShouldSetResponder?: (e: GestureEvent) => boolean;
    onMoveShouldSetResponder?: (e: GestureEvent) => boolean;
    onResponderGrant?: (e: GestureEvent) => void;
    onResponderMove?: (e: GestureEvent) => void;
    onResponderRelease?: (e: GestureEvent) => void;
    onResponderTerminate?: (e: GestureEvent) => void;
  }
  export class View extends React.Component<ViewProps> {}
  export interface TextProps { children?: React.ReactNode; style?: Style; numberOfLines?: number; className?: string; }
  export class Text extends React.Component<TextProps> {}
  export interface ImageProps { source: { uri: string } | number; style?: Style; resizeMode?: string; }
  export class Image extends React.Component<ImageProps> {}
  export interface PressableProps extends ViewProps {
    onPress?: () => void; onLongPress?: () => void; onPressIn?: () => void; onPressOut?: () => void;
    disabled?: boolean; accessibilityRole?: string; accessibilityLabel?: string;
  }
  export class Pressable extends React.Component<PressableProps> {}
  export class Press extends React.Component<PressableProps> {}
  export interface ScrollViewProps extends ViewProps { horizontal?: boolean; showsVerticalScrollIndicator?: boolean; showsHorizontalScrollIndicator?: boolean; contentContainerStyle?: Style; scrollEventThrottle?: number; onScroll?: (e: unknown) => void; }
  export class ScrollView extends React.Component<ScrollViewProps> {}
  export interface TextInputProps { style?: Style; value?: string; defaultValue?: string; placeholder?: string; placeholderTextColor?: string; autoFocus?: boolean; multiline?: boolean; onChangeText?: (t: string) => void; onSubmitEditing?: () => void; keyboardType?: string; returnKeyType?: string; }
  export class TextInput extends React.Component<TextInputProps> { focus(): void; blur(): void; }
  export const StyleSheet: {
    create<T extends Record<string, object>>(s: T): T;
    absoluteFill: Style;
    hairlineWidth: number;
  };
  export const AppRegistry: {
    registerComponent(name: string, getComp: () => React.ComponentType): void;
    runApplication(name: string, opts: { rootTag: Element | null }): void;
  };
  export const Animated: unknown;
  export function useWindowDimensions(): { width: number; height: number };
}
declare module "react-native" {
  export * from "react-native-web";
}
