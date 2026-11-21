import type { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../config/theme";
import { OfflineBanner } from "./OfflineBanner";

/** One inset and offline-status boundary shared by all employee routes. */
export function AppScreen({ children }: PropsWithChildren) {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView edges={["top", "bottom", "left", "right"]}
      style={[styles.root, { backgroundColor: colors.background }]}>
      <OfflineBanner />
      {children}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ root: { flex: 1 } });
