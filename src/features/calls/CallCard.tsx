import { View, Text, StyleSheet } from "react-native";
import { BellRing } from "lucide-react-native";
import type { ServiceCall } from "../../shared/api";
import { AppCard } from "../../shared/ui/AppCard";
import { radius, spacing, typeScale, useAppTheme } from "../../shared/config/theme";
import { strings } from "../../shared/config/strings";

export function CallCard({ call }: { call: ServiceCall }) {
  const { colors, typography } = useAppTheme();
  const styles = createStyles(typography);
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
        <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}><BellRing size={24} color={colors.primary} /></View>
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
const createStyles = (typography: import("../../shared/config/theme").AppTypography) => StyleSheet.create({
  card: { gap: spacing.sm, minWidth: 0, padding: spacing.md },
  icon: { width: 48, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: spacing.md },
  type: { borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxWidth: "100%" },
  typeText: { fontSize: typeScale.cardTitle, ...typography.bold, textAlign: "right", flexShrink: 1 },
  location: { textAlign: "right", ...typography.regular, fontSize: typeScale.meta, flexShrink: 1 },
  date: { textAlign: "right", ...typography.regular, fontSize: typeScale.caption, flexShrink: 1 },
});
