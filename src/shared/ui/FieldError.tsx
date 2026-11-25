import { Text, StyleSheet } from "react-native";
import { spacing, typeScale, useAppTheme } from "../config/theme";

/** Announce safe form errors without clipping at larger OS text sizes. */
export function FieldError({ message }: { message?: string | null }) {
  const { colors, typography } = useAppTheme();
  const styles = createStyles(typography);
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" accessibilityLiveRegion="assertive"
      allowFontScaling style={[styles.text, { color: colors.danger }]}>
      {message}
    </Text>
  );
}
const createStyles = (typography: import("../config/theme").AppTypography) => StyleSheet.create({
  text: { ...typography.regular, fontSize: typeScale.caption, textAlign: "right", marginTop: spacing.xs },
});
