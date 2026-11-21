import { View, Text, StyleSheet } from "react-native";
import { AppButton } from "./AppButton";
import { getErrorPresentation } from "../api/error-presentation";
import { useRetryCooldown } from "../api/use-retry-cooldown";
import type { FeedbackContext, ErrorAction } from "../api/error-presentation";
import type { AppLocale } from "../i18n/feedback";
import { feedbackText } from "../i18n/feedback";
import { radius, spacing, useAppTheme } from "../config/theme";

/** Reusable inline/screen error; any contextual CTA is wired explicitly by its owner. */
type Props = {
  error: unknown;
  context?: FeedbackContext;
  locale?: AppLocale;
  onRetry?: () => void;
  onAction?: (action: ErrorAction) => void;
  loading?: boolean;
  variant?: "inline" | "screen";
  showRequestId?: boolean;
};

export function AppErrorNotice({
  error, context = "generic", locale = "ar", onRetry, onAction,
  loading = false, variant = "inline", showRequestId = true,
}: Props) {
  const { colors } = useAppTheme();
  const remaining = useRetryCooldown(error);

  if (error === null || error === undefined) return null;
  const presentation = getErrorPresentation(error, { context, locale, remainingSeconds: remaining });
  const allowed = !loading && remaining === 0;
  const canAct = presentation.action === "retry" ? Boolean(onRetry && allowed) :
    Boolean(onAction && presentation.action !== "none" && allowed);
  const callback = presentation.action === "retry"
    ? onRetry
    : onAction ? () => onAction(presentation.action) : undefined;

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.container, variant === "screen" && styles.screen,
        {
          backgroundColor: presentation.severity === "error" ? colors.dangerSurface : colors.surfaceAlt,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.message, { color: colors.text }]}>{presentation.message}</Text>
      {showRequestId && presentation.requestId && (
        <Text selectable style={[styles.reference, { color: colors.muted }]}>
          {feedbackText("supportId", locale)}: {presentation.requestId}
        </Text>
      )}
      {callback && presentation.actionLabel && (
        <AppButton
          title={presentation.actionLabel}
          variant="secondary"
          loading={loading}
          disabled={!canAct}
          onPress={callback}
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "stretch", minWidth: 0, borderWidth: 1,
    borderRadius: radius.md, padding: spacing.md, gap: spacing.sm,
  },
  screen: { padding: spacing.xl },
  message: { fontSize: 14, lineHeight: 23, textAlign: "right", flexShrink: 1 },
  reference: { fontSize: 11, textAlign: "right" },
  action: { alignSelf: "flex-end", minWidth: 128 },
});
