import { createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import { deriveRestaurantTheme } from "./restaurant-theme";
import type { RestaurantIdentity } from "../api/types";
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
export const RestaurantIdentityContext = createContext<RestaurantIdentity | null>(null);
export function useRestaurantIdentity() { return useContext(RestaurantIdentityContext); }
export function useAppTheme() {
  const identity = useRestaurantIdentity();
  const dark = useColorScheme() === "dark";
  const base = dark ? colorPalettes.dark : colorPalettes.light;
  const t = identity ? deriveRestaurantTheme(identity.branding, dark ? "dark" : "light") : null;
  const colors: AppColors = t ? {
    background: t.background, surface: t.surface, surfaceAlt: t.primarySoft,
    primary: t.primaryText, primaryPressed: t.primaryPressed, accent: t.secondarySoft,
    text: t.text, muted: t.muted, border: t.border, danger: t.danger,
    dangerSurface: t.dangerSurface, success: t.success, successSurface: t.successSurface,
    button: t.primaryStrong, gold: t.secondary, onPrimary: t.onPrimary, input: t.input,
  } : base;
  return { colors, dark, identity, typography: t?.fontFamily === "system" ? systemTypography : cairoTypography, fontFamily: t?.fontFamily ?? "cairo",
    skeleton: t?.skeleton ?? base.surfaceAlt, buttonPressed: t?.primaryPressed ?? base.primaryPressed };
}

/** Loaded once by the root layout; use named static faces rather than synthesized weights. */
export const typography = {
  regular: "Cairo_400Regular",
  medium: "Cairo_500Medium",
  semibold: "Cairo_600SemiBold",
  bold: "Cairo_700Bold",
  extraBold: "Cairo_800ExtraBold",
} as const;

type FontStyle = { fontFamily?: string; fontWeight?: "400" | "500" | "600" | "700" | "800" };
export type AppTypography = Record<keyof typeof typography, FontStyle>;
const cairoTypography: AppTypography = {
  regular: { fontFamily: typography.regular }, medium: { fontFamily: typography.medium },
  semibold: { fontFamily: typography.semibold }, bold: { fontFamily: typography.bold },
  extraBold: { fontFamily: typography.extraBold },
};
const systemTypography: AppTypography = {
  regular: { fontWeight: "400" }, medium: { fontWeight: "500" },
  semibold: { fontWeight: "600" }, bold: { fontWeight: "700" },
  extraBold: { fontWeight: "800" },
};
