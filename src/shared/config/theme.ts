import { useColorScheme } from "react-native";
import { colorPalettes } from "./palettes";
import type { AppColors } from "./palettes";

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, huge: 32,
} as const;

export const radius = { sm: 12, md: 16, lg: 22, xl: 28 } as const;

/** Native Text scaling stays enabled; tokens are base dp at 1x system scale. */
export const typeScale = {
  caption: 12, meta: 13, body: 14, control: 15,
  cardTitle: 17, sectionTitle: 18, title: 26, hero: 32,
} as const;

export type { AppColors };
export function useAppTheme(): { colors: AppColors; dark: boolean } {
  const dark = useColorScheme() === "dark";
  return { colors: dark ? colorPalettes.dark : colorPalettes.light, dark };
}

/** Loaded once by the root layout; use named static faces rather than synthesized weights. */
export const typography = {
  regular: "Cairo_400Regular",
  medium: "Cairo_500Medium",
  semibold: "Cairo_600SemiBold",
  bold: "Cairo_700Bold",
  extraBold: "Cairo_800ExtraBold",
} as const;
