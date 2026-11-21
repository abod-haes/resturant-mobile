import { View, Text, StyleSheet } from "react-native";
import type { ServiceCall } from "../../shared/api";
import { AppCard } from "../../shared/ui/AppCard";
import { radius, spacing, typeScale, useAppTheme } from "../../shared/config/theme";
import { strings } from "../../shared/config/strings";

export function CallCard({ call }: { call: ServiceCall }) {
  const { colors } = useAppTheme();
  const isHookah = call.type === "hookah";
  const timestamp = new Date(call.createdAt);
  const dateLabel = Number.isNaN(timestamp.getTime())
    ? "—"
    : timestamp.toLocaleString("ar-SY", { dateStyle: "medium", timeStyle: "short" });

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.type, { backgroundColor: isHookah ? colors.accent : colors.surfaceAlt }]}>
          <Text allowFontScaling style={[styles.typeText, { color: colors.primary }]}>
            {isHookah ? strings.hookah : strings.waiter}
          </Text>
        </View>
        <Text accessibilityRole="header" style={[styles.table, { color: colors.text }]}>{strings.callTitle}</Text>
      </View>
      <Text selectable accessibilityLabel={strings.tableIdentifier + ": " + call.tableId}
        style={[styles.location, { color: colors.muted }]}>
        {strings.tableIdentifier}: {call.tableId}
      </Text>
      <Text style={[styles.location, { color: colors.muted }]}>{strings.locationUnavailable}</Text>
      <Text style={[styles.date, { color: colors.muted }]}>{dateLabel}</Text>
    </AppCard>
  );
}
const styles = StyleSheet.create({
  card: { gap: spacing.sm, minWidth: 0 },
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: spacing.md },
  table: { fontSize: typeScale.cardTitle, fontWeight: "800", textAlign: "right", flexShrink: 1 },
  type: { borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxWidth: "100%" },
  typeText: { fontSize: typeScale.caption, fontWeight: "700", textAlign: "right", flexShrink: 1 },
  location: { textAlign: "right", fontSize: typeScale.meta, flexShrink: 1 },
  date: { textAlign: "right", fontSize: typeScale.caption, flexShrink: 1 },
});
