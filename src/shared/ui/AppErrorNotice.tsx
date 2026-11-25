import { View, Text, StyleSheet } from "react-native";
import { AppButton } from "./AppButton";
import { getErrorPresentation } from "../api/error-presentation";
import { useRetryCooldown } from "../api/use-retry-cooldown";
import type { FeedbackContext, ErrorAction } from "../api/error-presentation";
import type { AppLocale } from "../i18n/feedback";
import { feedbackText } from "../i18n/feedback";
import { radius, spacing, typeScale, useAppTheme } from "../config/theme";

/** Accessible error text remains separate from nested retry and support actions. */
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
  const { colors, typography } = useAppTheme();
  const styles = createStyles(typography);
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
      style={[
        styles.container,
        variant === "screen" && styles.screen,
        {
          backgroundColor: presentation.severity === "error" ? colors.dangerSurface : colors.surfaceAlt,
          borderColor: colors.border,
        },
      ]}
    >
      <Text accessibilityRole="alert" accessibilityLiveRegion="assertive"
        allowFontScaling style={[styles.message, { color: colors.text }]}>
        {presentation.message}
      </Text>
      {showRequestId && presentation.requestId && (
        <Text selectable allowFontScaling style={[styles.reference, { color: colors.muted }]}>
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
const createStyles = (typography: import("../config/theme").AppTypography) => StyleSheet.create({
  container: {
    alignItems: "stretch", minWidth: 0, borderWidth: 1,
    borderRadius: radius.md, padding: spacing.md, gap: spacing.sm,
  },
  screen: { padding: spacing.xl },
  message: { ...typography.regular, fontSize: typeScale.body, textAlign: "right", flexShrink: 1 },
  reference: { ...typography.regular, fontSize: typeScale.caption, textAlign: "right", flexShrink: 1 },
  action: { alignSelf: "flex-end", minWidth: 128 },
});
