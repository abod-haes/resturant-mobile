import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../shared/ui/AppButton";
import { AppCard } from "../../shared/ui/AppCard";
import { AppInput } from "../../shared/ui/AppInput";
import { AppErrorNotice } from "../../shared/ui/AppErrorNotice";
import { isMockMode } from "../../shared/api";
import { getErrorPresentation } from "../../shared/api/error-presentation";
import type { FieldErrors } from "../../shared/api/error-presentation";
import { useRetryCooldown } from "../../shared/api/use-retry-cooldown";
import { feedbackText } from "../../shared/i18n/feedback";
import { radius, spacing, useAppTheme } from "../../shared/config/theme";
import { strings } from "../../shared/config/strings";
import { useSession } from "./SessionProvider";

export function SignInScreen() {
  const { signIn, notice } = useSession();
  const { colors } = useAppTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [fields, setFields] = useState<FieldErrors>({});
  const cooldown = useRetryCooldown(error);

  function clearField(field: "username" | "password") {
    setError(null);
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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.mark, { backgroundColor: colors.primary }]}>
            <Text style={[styles.markText, { color: colors.onPrimary }]}>R</Text>
          </View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{strings.appName}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{strings.welcome}</Text>
          <Text style={[styles.description, { color: colors.muted }]}>{strings.signInDescription}</Text>
          <AppCard style={styles.form}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{strings.signIn}</Text>
            <AppInput
              label={strings.username}
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
              title={cooldown > 0 ? feedbackText("retryAfter").replace("{seconds}", String(cooldown)) : strings.login}
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
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flexGrow: 1, justifyContent: "center", alignSelf: "center",
    width: "100%", maxWidth: 560, padding: spacing.xxl, gap: spacing.md,
  },
  mark: { width: 64, height: 64, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", alignSelf: "flex-end" },
  markText: { fontSize: 32, fontWeight: "800" },
  eyebrow: { textAlign: "right", fontSize: 14, fontWeight: "700", marginTop: spacing.md },
  title: { textAlign: "right", fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  description: { textAlign: "right", fontSize: 15, lineHeight: 24, marginBottom: spacing.sm },
  form: { marginTop: spacing.sm, gap: spacing.lg },
  cardTitle: { fontSize: 18, fontWeight: "800", textAlign: "right" },
  notice: { fontSize: 13, lineHeight: 21, textAlign: "right" },
  demo: { padding: spacing.lg, borderRadius: radius.md, marginTop: spacing.md },
  demoText: { fontSize: 12, lineHeight: 20, textAlign: "right" },
});
