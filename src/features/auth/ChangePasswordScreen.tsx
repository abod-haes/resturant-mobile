import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../shared/ui/AppButton";
import { AppCard } from "../../shared/ui/AppCard";
import { AppInput } from "../../shared/ui/AppInput";
import { AppErrorNotice } from "../../shared/ui/AppErrorNotice";
import { getErrorPresentation } from "../../shared/api/error-presentation";
import type { AppField, FieldErrors } from "../../shared/api/error-presentation";
import { useRetryCooldown } from "../../shared/api/use-retry-cooldown";
import { feedbackText, formatFeedback } from "../../shared/i18n/feedback";
import { spacing, useAppTheme } from "../../shared/config/theme";
import { strings } from "../../shared/config/strings";
import { useSession } from "./SessionProvider";

export function ChangePasswordScreen() {
  const { changePassword } = useSession();
  const { colors } = useAppTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fields, setFields] = useState<FieldErrors>({});
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const cooldown = useRetryCooldown(error);

  function clear(field: AppField) {
    setError(null);
    setFields((previous) => ({ ...previous, [field]: undefined }));
  }
  async function submit() {
    if (pending || cooldown > 0) return;
    const next: FieldErrors = {};
    if (!currentPassword) next.currentPassword = feedbackText("formRequired");
    if (newPassword.length < 12) next.newPassword = feedbackText("newPasswordInvalid");
    if (!confirmation) next.confirmation = feedbackText("formRequired");
    else if (confirmation !== newPassword) next.confirmation = feedbackText("confirmationInvalid");
    if (Object.keys(next).length) {
      setFields(next);
      setError(null);
      return;
    }
    setPending(true);
    setFields({});
    setError(null);
    try {
      await changePassword({ currentPassword, newPassword });
    } catch (cause) {
      setError(cause);
      setFields(getErrorPresentation(cause, { context: "change-password" }).fieldErrors);
    } finally {
      setPending(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>{strings.changePassword}</Text>
          <Text style={[styles.hint, { color: colors.muted }]}>{strings.changePasswordHint}</Text>
          <AppCard style={styles.form}>
            <AppInput
              label={strings.currentPassword} error={fields.currentPassword}
              value={currentPassword} onChangeText={(value) => { setCurrentPassword(value); clear("currentPassword"); }}
              secureTextEntry textContentType="password" autoCapitalize="none"
            />
            <AppInput
              label={strings.newPassword} error={fields.newPassword}
              value={newPassword} onChangeText={(value) => { setNewPassword(value); clear("newPassword"); }}
              secureTextEntry textContentType="newPassword" autoCapitalize="none"
            />
            <AppInput
              label={strings.confirmPassword} error={fields.confirmation}
              value={confirmation} onChangeText={(value) => { setConfirmation(value); clear("confirmation"); }}
              secureTextEntry textContentType="newPassword" autoCapitalize="none"
            />
            <AppErrorNotice error={error} context="change-password" />
            <AppButton
              title={cooldown > 0 ? formatFeedback("retryAfter", { seconds: cooldown }) : strings.savePassword}
              onPress={() => void submit()}
              loading={pending}
              disabled={cooldown > 0}
            />
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flexGrow: 1, justifyContent: "center", gap: spacing.lg,
    padding: spacing.xxl, alignSelf: "center", width: "100%", maxWidth: 560,
  },
  form: { gap: spacing.lg },
  title: { fontSize: 26, fontWeight: "800", textAlign: "right" },
  hint: { fontSize: 14, lineHeight: 23, textAlign: "right" },
});
