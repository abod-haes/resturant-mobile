import { useColorScheme } from "react-native";

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, huge: 32,
} as const;

export const radius = { sm: 12, md: 16, lg: 22, xl: 28 } as const;

const palettes = {
  light: {
    background: "#F5F7F7",
    surface: "#FFFFFF",
    surfaceAlt: "#EDF3F1",
    primary: "#075E53",
    primaryPressed: "#064B43",
    accent: "#D9ECE5",
    text: "#132F30",
    muted: "#667C7C",
    border: "#DAE4E0",
    danger: "#B73E43",
    dangerSurface: "#FFF0F0",
    success: "#167353",
    successSurface: "#E0F3E8",
    onPrimary: "#FFFFFF",
    input: "#FFFFFF",
  },
  dark: {
    background: "#101B1C",
    surface: "#1B292A",
    surfaceAlt: "#233736",
    primary: "#6BC8AD",
    primaryPressed: "#89DCC3",
    accent: "#29483E",
    text: "#ECF5F2",
    muted: "#A2B9B5",
    border: "#344948",
    danger: "#FF949A",
    dangerSurface: "#3C292D",
    success: "#83D8AD",
    successSurface: "#244A3C",
    onPrimary: "#102421",
    input: "#1B292A",
  },
};
export type AppColors = typeof palettes.light;
export function useAppTheme(): { colors: AppColors; dark: boolean } {
  const dark = useColorScheme() === "dark";
  return { colors: dark ? palettes.dark : palettes.light, dark };
}
