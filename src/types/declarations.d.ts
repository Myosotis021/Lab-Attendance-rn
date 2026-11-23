declare module 'expo-linear-gradient' {
  export interface LinearGradientProps {
    colors: readonly string[] | string[];
    start?: { x: number; y: number } | [number, number];
    end?: { x: number; y: number } | [number, number];
    locations?: readonly number[] | number[];
    style?: any;
    children?: any;
    pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
  }
  export const LinearGradient: React.ComponentType<LinearGradientProps>;
}

declare module '@expo/vector-icons' {
  export interface IconProps {
    name: any;
    size?: number;
    color?: string;
    style?: any;
  }
  export const Feather: React.ComponentType<IconProps>;
  export const Ionicons: React.ComponentType<IconProps>;
  export const MaterialIcons: React.ComponentType<IconProps>;
  export const MaterialCommunityIcons: React.ComponentType<IconProps>;
  export const AntDesign: React.ComponentType<IconProps>;
}
