import { useWindowDimensions } from "react-native";

/** Layout responds to both physical width and the user's system text size. */
export const layoutTokens = {
  compactWidth: 420,
  narrowWidth: 340,
  tabletWidth: 760,
  maxContentWidth: 760,
  maxFormWidth: 560,
  minTouchTarget: 48,
} as const;

export type AppLayout = {
  compact: boolean;
  narrow: boolean;
  largeText: boolean;
  contentPadding: number;
  formPadding: number;
  cardPadding: number;
  maxContentWidth: number;
  maxFormWidth: number;
};

/**
 * RN Text/TextInput scale themselves with accessibility settings. Do not scale
 * fontSize a second time; use effective width only to reflow the containers.
 */
export function resolveAppLayout(width: number, fontScale = 1): AppLayout {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 320;
  const safeScale = Number.isFinite(fontScale) && fontScale >= 1 ? fontScale : 1;
  const effectiveWidth = safeWidth / safeScale;
  const narrow = effectiveWidth < layoutTokens.narrowWidth;
  const compact = effectiveWidth < layoutTokens.compactWidth;
  return {
    compact,
    narrow,
    largeText: safeScale >= 1.3,
    contentPadding: narrow ? 12 : compact ? 16 : 20,
    formPadding: narrow ? 12 : compact ? 16 : 24,
    cardPadding: narrow ? 12 : compact ? 16 : 20,
    maxContentWidth: layoutTokens.maxContentWidth,
    maxFormWidth: layoutTokens.maxFormWidth,
  };
}

export function useAppLayout(): AppLayout {
  const { width, fontScale } = useWindowDimensions();
  return resolveAppLayout(width, fontScale);
}
