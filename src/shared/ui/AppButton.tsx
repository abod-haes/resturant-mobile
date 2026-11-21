import { ActivityIndicator, Pressable, Text, StyleSheet } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { radius, spacing, typeScale, useAppTheme } from "../config/theme";
import { layoutTokens } from "../config/layout";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** The touch target and label grow with system text settings; never truncate CTAs. */
export function AppButton({
  title, onPress, variant = "primary", disabled = false, loading = false,
  accessibilityHint, style, testID,
}: Props) {
  const { colors } = useAppTheme();
  const backgroundColor = variant === "primary"
    ? colors.primary
    : variant === "danger" ? colors.dangerSurface : colors.surfaceAlt;
  const foreground = variant === "primary"
    ? colors.onPrimary
    : variant === "danger" ? colors.danger : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: disabled ? 0.45 : pressed ? 0.82 : 1 },
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
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  title: {
    fontSize: typeScale.control, fontWeight: "700",
    textAlign: "center", flexShrink: 1,
  },
});
