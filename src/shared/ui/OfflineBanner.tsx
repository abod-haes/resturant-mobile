import { useSyncExternalStore } from "react";
import { Text, View, StyleSheet } from "react-native";
import { onlineManager } from "@tanstack/react-query";
import { feedbackText } from "../i18n/feedback";
import { spacing, useAppTheme } from "../config/theme";

const subscribeOnline = (callback: () => void) => onlineManager.subscribe(callback);
const isOnline = () => onlineManager.isOnline();
const serverSnapshot = () => true;

/** Appears only when NetInfo positively establishes offline status. */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribeOnline, isOnline, serverSnapshot);
  const { colors } = useAppTheme();
  if (online) return null;
  return (
    <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: colors.dangerSurface, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.danger }]}>{feedbackText("offline")}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  banner: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderBottomWidth: 1 },
  text: { textAlign: "center", fontSize: 12, lineHeight: 20 },
});
