import { Text, View, StyleSheet } from "react-native";
import type { Shift } from "../../shared/api";
import { AppButton } from "../../shared/ui/AppButton";
import { AppCard } from "../../shared/ui/AppCard";
import { spacing, radius, useAppTheme } from "../../shared/config/theme";
import { strings } from "../../shared/config/strings";

type Props = {
  shift: Shift | null | undefined;
  loading: boolean;
  changing: boolean;
  error: string | null;
  onToggle(): void;
  onRetry(): void;
};
export function ShiftPanel({ shift, loading, changing, error, onToggle, onRetry }: Props) {
  const { colors } = useAppTheme();
  const active = Boolean(shift);
  const autoEnd = shift ? new Date(shift.autoEndAt).toLocaleTimeString("ar-SY", {
    hour: "2-digit", minute: "2-digit",
  }) : null;
  return (
    <AppCard>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: active ? colors.success : colors.muted }]} />
        <Text style={[styles.heading, { color: colors.text }]}>{strings.shiftTitle}</Text>
      </View>
      {loading ? (
        <Text style={[styles.state, { color: colors.muted }]}>{strings.loading}</Text>
      ) : error && shift === undefined ? (
        <AppButton title={strings.retry} variant="secondary" onPress={onRetry} />
      ) : (
        <>
          <View style={[styles.status, { backgroundColor: active ? colors.successSurface : colors.surfaceAlt }]}>
            <Text style={[styles.state, { color: active ? colors.success : colors.muted }]}>
              {active ? strings.onShift : strings.offShift}
            </Text>
            {autoEnd && (
              <Text style={[styles.state, { color: colors.muted }]}>
                {strings.autoEndLabel} {autoEnd}
              </Text>
            )}
          </View>
          {error && <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{error}</Text>}
          <AppButton
            title={active ? strings.endShift : strings.startShift}
            variant={active ? "secondary" : "primary"}
            loading={changing}
            onPress={onToggle}
            disabled={shift === undefined}
          />
        </>
      )}
    </AppCard>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.sm },
  dot: { width: 9, height: 9, borderRadius: 5 },
  heading: { fontSize: 17, fontWeight: "800", textAlign: "right" },
  status: { borderRadius: radius.sm, padding: spacing.lg, gap: spacing.sm },
  state: { textAlign: "right", fontSize: 14, fontWeight: "600" },
  error: { fontSize: 12, lineHeight: 20, textAlign: "right" },
});
