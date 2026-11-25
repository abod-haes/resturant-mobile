import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, StyleSheet } from "react-native";
import { AppScreen } from "../../shared/ui/AppScreen";
import { AppButton } from "../../shared/ui/AppButton";
import Svg, { Path, Circle } from "react-native-svg";
import { AppInput } from "../../shared/ui/AppInput";
import { AppErrorNotice } from "../../shared/ui/AppErrorNotice";
import { isMockMode } from "../../shared/api";
import { getErrorPresentation, normalizeApiError } from "../../shared/api/error-presentation";
import type { FieldErrors } from "../../shared/api/error-presentation";
import { useRetryCooldown } from "../../shared/api/use-retry-cooldown";
import { feedbackText, formatFeedback } from "../../shared/i18n/feedback";
import { radius, spacing, typeScale, useAppTheme, typography } from "../../shared/config/theme";
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
          <View style={styles.brand}>
            <Svg width={108} height={88} viewBox="0 0 108 88" fill="none">
              <Path d="M15 67 C18 38 90 38 93 67 H15 M9 74 H99" stroke={colors.primary} strokeWidth={4} strokeLinecap="round" />
              <Path d="M42 30 C32 18 51 13 42 3 M55 30 C45 18 64 13 55 3 M68 30 C58 18 77 13 68 3" stroke={colors.gold} strokeWidth={3} strokeLinecap="round" />
              <Circle cx={54} cy={37} r={4} stroke={colors.primary} strokeWidth={3} />
            </Svg>
            <Text style={[styles.eyebrow, { color: colors.text }]}>{strings.appName}</Text>
          </View>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{strings.signIn}</Text>
          <Text style={[styles.description, { color: colors.muted }]}>{strings.signInDescription}</Text>
          <View style={styles.form}>
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
          </View>
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
  brand: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.xxl },
  eyebrow: { textAlign: "center", fontSize: 22, fontFamily: typography.bold },
  title: { textAlign: "center", fontSize: typeScale.hero, fontFamily: typography.extraBold },
  description: { textAlign: "center", fontFamily: typography.regular, fontSize: typeScale.control, marginBottom: spacing.sm },
  form: { marginTop: spacing.sm, gap: spacing.lg },
  notice: { fontFamily: typography.regular, fontSize: typeScale.meta, textAlign: "right" },
  demo: { padding: spacing.lg, borderRadius: radius.md, marginTop: spacing.md },
  demoText: { fontFamily: typography.regular, fontSize: typeScale.caption, textAlign: "right" },
});
