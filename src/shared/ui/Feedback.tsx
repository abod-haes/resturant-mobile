import { ActivityIndicator, Text, View, StyleSheet } from "react-native";
import { spacing, useAppTheme } from "../config/theme";
import { AppButton } from "./AppButton";

export function Feedback({
  message, retry, loading = false,
}: { message: string; retry?: () => void; loading?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.wrapper}>
      {loading && <ActivityIndicator color={colors.primary} />}
      <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
      {retry && <AppButton title="إعادة المحاولة" onPress={retry} variant="secondary" />}
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: { alignItems: "center", justifyContent: "center", padding: spacing.xxl, gap: spacing.lg },
  message: { fontSize: 14, lineHeight: 22, textAlign: "center" },
});
