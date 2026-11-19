import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../shared/ui/AppButton";
import { AppCard } from "../../shared/ui/AppCard";
import { AppInput } from "../../shared/ui/AppInput";
import { describeApiError, isMockMode } from "../../shared/api";
import { radius, spacing, useAppTheme } from "../../shared/config/theme";
import { strings } from "../../shared/config/strings";
import { useSession } from "./SessionProvider";

export function SignInScreen() {
  const { signIn, notice } = useSession();
  const { colors } = useAppTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (pending) return;
    if (!username.trim() || !password.trim()) {
      setError(strings.formMissing);
      return;
    }
    setPending(true);
    setError(null);
    try {
      await signIn({ username: username.trim(), password });
    } catch (cause) {
      setError(describeApiError(cause));
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
              value={username}
              onChangeText={setUsername}
              placeholder={isMockMode ? strings.demoUsername : strings.username}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              returnKeyType="next"
            />
            <AppInput
              label={strings.password}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={() => void submit()}
            />
            {error && <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{error}</Text>}
            {notice && <Text style={[styles.error, { color: colors.muted }]}>{notice}</Text>}
            <AppButton title={strings.login} onPress={() => void submit()} loading={pending} />
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
  content: { flexGrow: 1, justifyContent: "center", padding: spacing.xxl, gap: spacing.md },
  mark: { width: 64, height: 64, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", alignSelf: "flex-end" },
  markText: { fontSize: 32, fontWeight: "800" },
  eyebrow: { textAlign: "right", fontSize: 14, fontWeight: "700", marginTop: spacing.xxl },
  title: { textAlign: "right", fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  description: { textAlign: "right", fontSize: 15, lineHeight: 24, marginBottom: spacing.xl },
  form: { marginTop: spacing.sm, gap: spacing.lg },
  cardTitle: { fontSize: 18, fontWeight: "800", textAlign: "right" },
  error: { fontSize: 13, lineHeight: 21, textAlign: "right" },
  demo: { padding: spacing.lg, borderRadius: radius.md, marginTop: spacing.md },
  demoText: { fontSize: 12, lineHeight: 20, textAlign: "right" },
});
