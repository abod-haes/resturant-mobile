import { ActivityIndicator, Pressable, Text, StyleSheet } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { radius, spacing, typeScale, useAppTheme, typography } from "../config/theme";
import { layoutTokens } from "../config/layout";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
  foregroundColor?: string;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** The touch target and label grow with system text settings; never truncate CTAs. */
export function AppButton({
  title, onPress, variant = "primary", disabled = false, loading = false,
  accessibilityHint, accessibilityLabel, style, testID, foregroundColor,
}: Props) {
  const { colors, buttonPressed } = useAppTheme();
  const backgroundColor = variant === "primary"
    ? colors.button
    : variant === "danger" ? colors.dangerSurface : colors.surfaceAlt;
  const foreground = foregroundColor ?? (variant === "primary"
    ? colors.onPrimary
    : variant === "danger" ? colors.danger : colors.text);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed && variant === "primary" ? buttonPressed : backgroundColor, opacity: disabled ? 0.45 : pressed && variant !== "primary" ? 0.82 : 1 },
        style,
      ]}
    >
      {loading && <ActivityIndicator color={foreground} size="small" />}
      <Text allowFontScaling style={[styles.title, { color: foreground }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: layoutTokens.minTouchTarget + 2,
    minWidth: 0,
    maxWidth: "100%",
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: spacing.sm,
  },
  title: {
    fontSize: typeScale.control, fontFamily: typography.bold,
    textAlign: "center", textAlignVertical: "center", includeFontPadding: false,
    lineHeight: 24, flexShrink: 1,
  },
});
