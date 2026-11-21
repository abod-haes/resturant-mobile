import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, StyleSheet } from "react-native";
import { AppScreen } from "../../shared/ui/AppScreen";
import { AppButton } from "../../shared/ui/AppButton";
import { AppCard } from "../../shared/ui/AppCard";
import { AppInput } from "../../shared/ui/AppInput";
import { AppErrorNotice } from "../../shared/ui/AppErrorNotice";
import { isMockMode } from "../../shared/api";
import { getErrorPresentation, normalizeApiError } from "../../shared/api/error-presentation";
import type { FieldErrors } from "../../shared/api/error-presentation";
import { useRetryCooldown } from "../../shared/api/use-retry-cooldown";
import { feedbackText, formatFeedback } from "../../shared/i18n/feedback";
import { radius, spacing, typeScale, useAppTheme } from "../../shared/config/theme";
import { useAppLayout } from "../../shared/config/useAppLayout";
import { strings } from "../../shared/config/strings";
import { useSession } from "./SessionProvider";

export function SignInScreen() {
  const { signIn, notice } = useSession();
  const { colors } = useAppTheme();
  const layout = useAppLayout();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [fields, setFields] = useState<FieldErrors>({});
  const cooldown = useRetryCooldown(error);

  function clearField(field: "username" | "password") {
    if (normalizeApiError(error).status !== 429) setError(null);
    setFields((current) => ({ ...current, [field]: undefined }));
  }
  async function submit() {
    if (pending || cooldown > 0) return;
    const errors: FieldErrors = {};
    if (!username.trim()) errors.username = feedbackText("formRequired");
    if (!password.trim()) errors.password = feedbackText("formRequired");
    if (Object.keys(errors).length) {
      setFields(errors);
      setError(null);
      return;
    }
    setPending(true);
    setError(null);
    setFields({});
    try {
      await signIn({ username: username.trim(), password });
    } catch (cause) {
      setError(cause);
      setFields(getErrorPresentation(cause, { context: "login" }).fieldErrors);
    } finally {
      setPending(false);
    }
  }

  return (
    <AppScreen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[styles.content, { padding: layout.formPadding, maxWidth: layout.maxFormWidth }]}
          keyboardShouldPersistTaps="handled">
          <View accessible={false} importantForAccessibility="no-hide-descendants"
            style={[styles.mark, { backgroundColor: colors.primary }]}>
            <Text allowFontScaling={false} style={[styles.markText, { color: colors.onPrimary }]}>R</Text>
          </View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{strings.appName}</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{strings.welcome}</Text>
          <Text style={[styles.description, { color: colors.muted }]}>{strings.signInDescription}</Text>
          <AppCard style={styles.form}>
            <Text accessibilityRole="header" style={[styles.cardTitle, { color: colors.text }]}>{strings.signIn}</Text>
            <AppInput
              label={strings.username}
              textDirection="ltr"
              error={fields.username}
              value={username}
              onChangeText={(value) => { setUsername(value); clearField("username"); }}
              placeholder={isMockMode ? strings.demoUsername : strings.username}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              returnKeyType="next"
            />
            <AppInput
              label={strings.password}
              textDirection="ltr"
              error={fields.password}
              value={password}
              onChangeText={(value) => { setPassword(value); clearField("password"); }}
              secureTextEntry
              textContentType="password"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={() => void submit()}
            />
            <AppErrorNotice error={error} context="login" />
            {notice && <Text style={[styles.notice, { color: colors.muted }]}>{notice}</Text>}
            <AppButton
              title={cooldown > 0 ? formatFeedback("retryAfter", { seconds: cooldown }) : strings.login}
              onPress={() => void submit()}
              loading={pending}
              disabled={cooldown > 0}
            />
          </AppCard>
          {isMockMode && (
            <View style={[styles.demo, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.demoText, { color: colors.muted }]}>{strings.demoHint}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1, justifyContent: "center", alignSelf: "center",
    width: "100%", gap: spacing.md,
  },
  mark: { width: 64, height: 64, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", alignSelf: "flex-end" },
  markText: { fontSize: 32, fontWeight: "800" },
  eyebrow: { textAlign: "right", fontSize: 14, fontWeight: "700", marginTop: spacing.md },
  title: { textAlign: "right", fontSize: typeScale.hero, fontWeight: "800" },
  description: { textAlign: "right", fontSize: typeScale.control, marginBottom: spacing.sm },
  form: { marginTop: spacing.sm, gap: spacing.lg },
  cardTitle: { fontSize: typeScale.sectionTitle, fontWeight: "800", textAlign: "right" },
  notice: { fontSize: typeScale.meta, textAlign: "right" },
  demo: { padding: spacing.lg, borderRadius: radius.md, marginTop: spacing.md },
  demoText: { fontSize: typeScale.caption, textAlign: "right" },
});
