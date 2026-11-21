import type { PropsWithChildren } from "react";
import { View, StyleSheet } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { radius, spacing, useAppTheme } from "../config/theme";
import { useAppLayout } from "../config/useAppLayout";

/** Uniform themeable card; compact padding follows screen width AND font scaling. */
export function AppCard({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { colors } = useAppTheme();
  const { cardPadding } = useAppLayout();
  return (
    <View style={[styles.card, {
      padding: cardPadding,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    }, style]}>
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    minWidth: 0, borderRadius: radius.lg, borderWidth: 1,
    gap: spacing.md,
  },
});
