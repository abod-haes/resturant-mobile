/** Restaurant Suite tenant theme contract v1.0.0.
 * Framework-independent, deterministic; canonical source: retuarant-dash/packages/ui/src/restaurant-theme.ts.
 * Keep byte-identical mirrors in mobile and customer. No DOM or native dependencies.
 */
export const THEME_CONTRACT_VERSION = "1.0.0" as const;
export type ThemeMode = "light" | "dark";
export type ThemeFont = "cairo" | "system";
export interface ThemeBranding {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  fontFamily?: string | null;
}
export const PLATFORM_BRANDING = {
  primaryColor: "#8B2E3C", secondaryColor: "#D9A441", fontFamily: "cairo",
} as const;
const HEX = /^#[0-9A-Fa-f]{6}$/;
function normalize(value: string | null | undefined, fallback: string): string {
  return typeof value === "string" && HEX.test(value) ? value.toUpperCase() : fallback;
}
function rgb(hex: string): number[] {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
}
function blend(from: string, to: string, amount: number): string {
  const a = rgb(from), b = rgb(to);
  return "#" + a.map((value, i) => Math.round(value + (b[i] - value) * amount).toString(16).padStart(2, "0")).join("").toUpperCase();
}
function luminance(hex: string): number {
  const c = rgb(hex).map(v => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
/** WCAG relative luminance contrast; inputs are validated six-digit HEX. */
export function contrastRatio(a: string, b: string): number {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function foreground(background: string): string {
  return contrastRatio(background, "#FFFFFF") >= contrastRatio(background, "#000000") ? "#FFFFFF" : "#000000";
}
/** Preserve original hue as far as possible; choose first readable blend. */
function readable(color: string, against: string, target = 4.5): string {
  if (contrastRatio(color, against) >= target) return color;
  const end = foreground(against);
  for (let step = 1; step <= 100; step++) {
    const next = blend(color, end, step / 100);
    if (contrastRatio(next, against) >= target) return next;
  }
  return end;
}
export function deriveRestaurantTheme(branding?: ThemeBranding | null, mode: ThemeMode = "light") {
  const dark = mode === "dark";
  const primary = normalize(branding?.primaryColor, PLATFORM_BRANDING.primaryColor);
  const secondary = normalize(branding?.secondaryColor, PLATFORM_BRANDING.secondaryColor);
  const fontFamily: ThemeFont = branding?.fontFamily === "system" ? "system" : "cairo";
  const surface = dark ? "#242424" : "#FFFFFF";
  const background = dark ? "#171717" : "#F8F7F5";
  const text = dark ? "#F5F5F5" : "#242424";
  const primaryStrong = readable(primary, "#FFFFFF");
  const primaryHover = blend(primaryStrong, "#000000", 0.08);
  const primaryPressed = blend(primaryStrong, "#000000", 0.16);
  const primarySoft = blend(surface, primary, dark ? 0.18 : 0.12);
  const secondarySoft = blend(surface, secondary, dark ? 0.18 : 0.12);
  const primaryText = readable(primary, surface);
  return {
    version: THEME_CONTRACT_VERSION, mode, fontFamily,
    primary, secondary, primaryStrong, primaryHover, primaryPressed, primarySoft,
    primaryText, onPrimary: "#FFFFFF", onPrimaryRaw: foreground(primary),
    onPrimarySoft: readable(primary, primarySoft),
    secondarySoft, secondaryText: readable(secondary, surface),
    onSecondary: foreground(secondary),
    sidebar: primaryStrong, sidebarForeground: "#FFFFFF",
    focus: readable(primary, surface, 3), background, surface, text,
    muted: dark ? "#BFBFBF" : "#616161",
    border: blend(surface, primary, dark ? 0.30 : 0.20),
    input: surface, skeleton: blend(surface, primary, dark ? 0.14 : 0.08),
    success: dark ? "#83D8AD" : "#167353",
    successSurface: dark ? "#244A3C" : "#E0F3E8",
    danger: dark ? "#FF949A" : "#B91C1C",
    dangerSurface: dark ? "#3C292D" : "#FFF0F0",
    warning: dark ? "#FCD34D" : "#92400E",
    warningSurface: dark ? "#493711" : "#FEF3C7",
  } as const;
}
export type RestaurantTheme = ReturnType<typeof deriveRestaurantTheme>;
