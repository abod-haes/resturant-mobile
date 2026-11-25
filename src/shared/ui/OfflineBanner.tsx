import { useSyncExternalStore } from "react";
import { View, Text, StyleSheet } from "react-native";
import { onlineManager } from "@tanstack/react-query";
import { feedbackText } from "../i18n/feedback";
import { spacing, typeScale, useAppTheme, typography } from "../config/theme";

const subscribeOnline = (callback: () => void) => onlineManager.subscribe(callback);
const isOnline = () => onlineManager.isOnline();
const serverSnapshot = () => true;

/** AppScreen owns safe area; banner stays inside the screen content bounds. */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribeOnline, isOnline, serverSnapshot);
  const { colors } = useAppTheme();
  if (online) return null;
  return (
    <View style={[styles.banner, { backgroundColor: colors.dangerSurface, borderColor: colors.border }]}>
      <Text accessibilityRole="alert" accessibilityLiveRegion="polite" allowFontScaling
        style={[styles.text, { color: colors.danger }]}>{feedbackText("offline")}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  banner: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderBottomWidth: 1 },
  text: { textAlign: "center", fontFamily: typography.regular, fontSize: typeScale.caption },
});
