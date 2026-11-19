import { View, Text, StyleSheet } from "react-native";
import type { ServiceCall } from "../../shared/api";
import { AppCard } from "../../shared/ui/AppCard";
import { radius, spacing, useAppTheme } from "../../shared/config/theme";
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
          <Text style={[styles.typeText, { color: colors.primary }]}>
            {isHookah ? strings.hookah : strings.waiter}
          </Text>
        </View>
        <Text style={[styles.table, { color: colors.text }]}>{strings.callTitle}</Text>
      </View>
      <Text style={[styles.location, { color: colors.muted }]}>
        {strings.tableIdentifier}: {call.tableId}
      </Text>
      <Text style={[styles.location, { color: colors.muted }]}>{strings.locationUnavailable}</Text>
      <Text style={[styles.date, { color: colors.muted }]}>{dateLabel}</Text>
    </AppCard>
  );
}
const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: spacing.md },
  table: { fontSize: 17, fontWeight: "800", textAlign: "right" },
  type: { borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  typeText: { fontSize: 12, fontWeight: "700" },
  location: { textAlign: "right", fontSize: 13 },
  date: { textAlign: "right", fontSize: 12 },
});
