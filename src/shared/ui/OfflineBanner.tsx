import { useSyncExternalStore } from "react";
import { Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { onlineManager } from "@tanstack/react-query";
import { feedbackText } from "../i18n/feedback";
import { spacing, typeScale, useAppTheme } from "../config/theme";

const subscribeOnline = (callback: () => void) => onlineManager.subscribe(callback);
const isOnline = () => onlineManager.isOnline();
const serverSnapshot = () => true;

/** Network banner is inset below a device notch/status bar, not obscured by it. */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribeOnline, isOnline, serverSnapshot);
  const { colors } = useAppTheme();
  if (online) return null;
  return (
    <SafeAreaView edges={["top"]}
      style={[styles.banner, { backgroundColor: colors.dangerSurface, borderColor: colors.border }]}>
      <Text accessibilityRole="alert" accessibilityLiveRegion="polite" allowFontScaling
        style={[styles.text, { color: colors.danger }]}>{feedbackText("offline")}</Text>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  banner: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderBottomWidth: 1 },
  text: { textAlign: "center", fontSize: typeScale.caption },
});
