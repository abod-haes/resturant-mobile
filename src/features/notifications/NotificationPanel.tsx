import { useState } from "react";
import { Alert, Text, View, StyleSheet, Platform } from "react-native";
import { AppButton } from "../../shared/ui/AppButton";
import { AppCard } from "../../shared/ui/AppCard";
import { AppErrorNotice } from "../../shared/ui/AppErrorNotice";
import { useFeedback } from "../../shared/ui/AppToast";
import { ApiError } from "../../shared/api";
import { feedbackText, formatFeedback } from "../../shared/i18n/feedback";
import { useRetryCooldown } from "../../shared/api/use-retry-cooldown";
import { spacing, radius, typeScale, useAppTheme, typography } from "../../shared/config/theme";
import { useAppLayout } from "../../shared/config/useAppLayout";
import { strings } from "../../shared/config/strings";
import { prepareNotifications, type PreparationResult } from "./runtime";
import { usePushDevices } from "./usePushDevices";

type Status = "idle" | "loading" | PreparationResult | "error";

export function NotificationPanel({ employeeId }: { employeeId: string | null }) {
  const { colors } = useAppTheme();
  const layout = useAppLayout();
  const { showToast } = useFeedback();
  const { devices, remove, refresh } = usePushDevices(employeeId);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<unknown>(null);
  const cooldown = useRetryCooldown(error);

  async function prepare() {
    if (status === "loading" || cooldown > 0 || !employeeId) return;
    setStatus("loading");
    setError(null);
    try {
      const result = await prepareNotifications();
      setStatus(result);
      if (result === "registered") {
        await refresh();
        showToast({ message: feedbackText("notificationReady"), key: "device-registered" });
      }
    } catch (cause) {
      setError(cause instanceof ApiError
        ? cause
        : new ApiError("PUSH_SETUP_FAILED", 0, "Native push registration failed"));
      setStatus("error");
    }
  }

  function askRemove(id: string) {
    if (remove.isPending) return;
    if (Platform.OS === "web") return;
    Alert.alert(strings.removeDeviceTitle, strings.removeDeviceConfirmation, [
      { text: strings.cancel, style: "cancel" },
      {
        text: strings.removeDevice,
        style: "destructive",
        onPress: () => remove.mutate(id, {
          onSuccess: () => {
            setStatus("idle");
            showToast({ message: strings.deviceRemoved, key: "device-removed-" + id });
          },
        }),
      },
    ]);
  }

  const statusMessages = {
    idle: strings.notificationDescription,
    loading: strings.notificationDescription,
    "permission-denied": strings.notificationPermissionDenied,
    "missing-project": strings.notificationMissingProject,
    registered: strings.notificationRegistered,
    error: null,
  } satisfies Record<Status, string | null>;

  return (
    <AppCard>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{strings.notificationTitle}</Text>
        {statusMessages[status] && (
          <Text style={[styles.message, { color: colors.muted }]}>{statusMessages[status]}</Text>
        )}
      </View>
      <AppErrorNotice error={error} context="devices" onRetry={() => void prepare()} loading={status === "loading"} />
      <AppButton
        title={cooldown > 0 ? formatFeedback("retryAfter", { seconds: cooldown }) : strings.enableNotifications}
        variant="secondary"
        onPress={() => void prepare()}
        loading={status === "loading"}
        disabled={status === "registered" || cooldown > 0 || !employeeId}
      />
      <View style={styles.deviceSection}>
        <Text accessibilityRole="header" style={[styles.listTitle, { color: colors.text }]}>{strings.registeredDevices}</Text>
        {devices.isPending ? (
          <Text style={[styles.message, { color: colors.muted }]}>{strings.loading}</Text>
        ) : devices.isError ? (
          <AppErrorNotice error={devices.error} context="devices" onRetry={() => void devices.refetch()} />
        ) : devices.data.length === 0 ? (
          <Text style={[styles.message, { color: colors.muted }]}>{strings.noRegisteredDevices}</Text>
        ) : (
          devices.data.map((device) => (
            <View key={device.id} style={[styles.device, layout.compact && styles.compactDevice, { borderColor: colors.border }]}>
              <View style={[styles.deviceText, layout.compact && styles.compactDeviceText]}>
                <Text style={[styles.deviceName, { color: colors.text }]}>
                  {device.platform === "ios" ? "iOS" : "Android"} · {device.id.slice(-6)}
                </Text>
                <Text style={[styles.deviceDate, { color: colors.muted }]}>
                  {strings.deviceLastSeen}: {new Date(device.lastSeenAt).toLocaleDateString("ar-SY")}
                </Text>
              </View>
              {Platform.OS !== "web" && (
                <AppButton
                  title={strings.removeDevice}
                  accessibilityLabel={strings.removeDevice + ": " + device.platform + " " + device.id.slice(-6)}
                  style={layout.compact ? styles.compactDeviceButton : undefined}
                  variant="danger"
                  onPress={() => askRemove(device.id)}
                  loading={remove.isPending && remove.variables === device.id}
                  disabled={remove.isPending}
                />
              )}
            </View>
          ))
        )}
        <AppErrorNotice error={remove.error} context="devices" />
      </View>
    </AppCard>
  );
}
const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  title: { fontFamily: typography.extraBold, fontSize: typeScale.cardTitle, textAlign: "right" },
  message: { fontFamily: typography.regular, fontSize: typeScale.meta, textAlign: "right" },
  listTitle: { fontSize: typeScale.body, fontFamily: typography.extraBold, textAlign: "right" },
  deviceSection: { gap: spacing.md, paddingTop: spacing.sm },
  device: {
    flexDirection: "row-reverse", flexWrap: "wrap", gap: spacing.sm,
    alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderRadius: radius.sm, padding: spacing.md,
  },
  deviceText: { flex: 1, minWidth: 140, alignItems: "flex-end", gap: spacing.xs },
  compactDevice: { flexDirection: "column", alignItems: "stretch" },
  compactDeviceText: { flex: 0, minWidth: 0, width: "100%" },
  compactDeviceButton: { width: "100%" },
  deviceName: { fontSize: typeScale.body, fontFamily: typography.bold, textAlign: "right", flexShrink: 1 },
  deviceDate: { fontFamily: typography.regular, fontSize: typeScale.caption, textAlign: "right", flexShrink: 1 },
});
