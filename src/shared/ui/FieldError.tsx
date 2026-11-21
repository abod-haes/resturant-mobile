import { Text, StyleSheet } from "react-native";
import { spacing, typeScale, useAppTheme } from "../config/theme";

/** Announce safe form errors without clipping at larger OS text sizes. */
export function FieldError({ message }: { message?: string | null }) {
  const { colors } = useAppTheme();
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" accessibilityLiveRegion="assertive"
      allowFontScaling style={[styles.text, { color: colors.danger }]}>
      {message}
    </Text>
  );
}
const styles = StyleSheet.create({
  text: { fontSize: typeScale.caption, textAlign: "right", marginTop: spacing.xs },
});
