import { Text, StyleSheet } from "react-native";
import { spacing, useAppTheme } from "../config/theme";

/** Reusable form-level validation message with automatic font scaling. */
export function FieldError({ message }: { message?: string | null }) {
  const { colors } = useAppTheme();
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" style={[styles.text, { color: colors.danger }]}>
      {message}
    </Text>
  );
}
const styles = StyleSheet.create({
  text: { fontSize: 12, lineHeight: 20, textAlign: "right", marginTop: spacing.xs },
});
