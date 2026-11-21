import { useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { AppButton } from "../../shared/ui/AppButton";
import { AppCard } from "../../shared/ui/AppCard";
import { AppErrorNotice } from "../../shared/ui/AppErrorNotice";
import { useFeedback } from "../../shared/ui/AppToast";
import { ApiError } from "../../shared/api";
import { feedbackText } from "../../shared/i18n/feedback";
import { spacing, useAppTheme } from "../../shared/config/theme";
import { strings } from "../../shared/config/strings";
import { prepareNotifications, type PreparationResult } from "./runtime";

type Status = "idle" | "loading" | PreparationResult | "error";

export function NotificationPanel() {
  const { colors } = useAppTheme();
  const { showToast } = useFeedback();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<unknown>(null);

  async function prepare() {
    if (status === "loading") return;
    setStatus("loading");
    setError(null);
    try {
      const result = await prepareNotifications();
      setStatus(result);
      if (result === "registered") {
        // Only report success AFTER POST /employee/devices succeeds.
        showToast({ message: feedbackText("notificationReady"), key: "device-registered" });
      }
    } catch (cause) {
      setError(cause instanceof ApiError
        ? cause
        : new ApiError("PUSH_SETUP_FAILED", 0, "Native push registration failed"));
      setStatus("error");
    }
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
        <Text style={[styles.title, { color: colors.text }]}>{strings.notificationTitle}</Text>
        {statusMessages[status] && (
          <Text style={[styles.message, { color: colors.muted }]}>{statusMessages[status]}</Text>
        )}
      </View>
      <AppErrorNotice error={error} context="devices" onRetry={() => void prepare()} loading={status === "loading"} />
      <AppButton
        title={strings.enableNotifications}
        variant="secondary"
        onPress={() => void prepare()}
        loading={status === "loading"}
        disabled={status === "registered"}
      />
    </AppCard>
  );
}
const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  title: { fontWeight: "800", fontSize: 16, textAlign: "right" },
  message: { fontSize: 13, lineHeight: 22, textAlign: "right" },
});
