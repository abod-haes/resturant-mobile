import { ActivityIndicator, Text, View, StyleSheet } from "react-native";
import { spacing, typeScale, useAppTheme } from "../config/theme";
import { feedbackText } from "../i18n/feedback";
import { AppButton } from "./AppButton";

export function Feedback({
  message, retry, loading = false, retryLabel = feedbackText("retry"),
}: { message: string; retry?: () => void; loading?: boolean; retryLabel?: string }) {
  const { colors, typography } = useAppTheme();
  const styles = createStyles(typography);
  return (
    <View style={styles.wrapper}>
      {loading && <ActivityIndicator accessibilityLabel={message} color={colors.primary} />}
      <Text accessibilityLiveRegion="polite" allowFontScaling
        style={[styles.message, { color: colors.muted }]}>{message}</Text>
      {retry && <AppButton title={retryLabel} onPress={retry} variant="secondary" />}
    </View>
  );
}
const createStyles = (typography: import("../config/theme").AppTypography) => StyleSheet.create({
  wrapper: { minWidth: 0, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.lg },
  message: { ...typography.regular, fontSize: typeScale.body, textAlign: "center" },
});
