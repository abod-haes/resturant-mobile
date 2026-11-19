import { ActivityIndicator, Pressable, Text, StyleSheet } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { radius, spacing, useAppTheme } from "../config/theme";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function AppButton({
  title, onPress, variant = "primary", disabled = false, loading = false, style, testID,
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
      <Text style={[styles.title, { color: foreground }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  title: { fontSize: 15, fontWeight: "700", textAlign: "center" },
});
