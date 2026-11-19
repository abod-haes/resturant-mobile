import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../shared/ui/AppButton";
import { AppCard } from "../../shared/ui/AppCard";
import { AppInput } from "../../shared/ui/AppInput";
import { describeApiError } from "../../shared/api";
import { spacing, useAppTheme } from "../../shared/config/theme";
import { strings } from "../../shared/config/strings";
import { useSession } from "./SessionProvider";

export function ChangePasswordScreen() {
  const { changePassword } = useSession();
  const { colors } = useAppTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    if (pending) return;
    if (!currentPassword || newPassword.length < 12) {
      setError(strings.passwordLength);
      return;
    }
    if (newPassword !== confirmation) {
      setError(strings.passwordMismatch);
      return;
    }
    setPending(true);
    setError(null);
    try { await changePassword({ currentPassword, newPassword }); }
    catch (cause) { setError(describeApiError(cause)); }
    finally { setPending(false); }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>{strings.changePassword}</Text>
          <Text style={[styles.hint, { color: colors.muted }]}>{strings.changePasswordHint}</Text>
          <AppCard>
            <AppInput label={strings.currentPassword} value={currentPassword} onChangeText={setCurrentPassword}
              secureTextEntry textContentType="password" autoCapitalize="none" />
            <AppInput label={strings.newPassword} value={newPassword} onChangeText={setNewPassword}
              secureTextEntry textContentType="newPassword" autoCapitalize="none" />
            <AppInput label={strings.confirmPassword} value={confirmation} onChangeText={setConfirmation}
              secureTextEntry textContentType="newPassword" autoCapitalize="none" />
            {error && <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{error}</Text>}
            <AppButton title={strings.savePassword} onPress={() => void submit()} loading={pending} />
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", gap: spacing.lg, padding: spacing.xxl },
  title: { fontSize: 26, fontWeight: "800", textAlign: "right" },
  hint: { fontSize: 14, lineHeight: 23, textAlign: "right" },
  error: { fontSize: 13, textAlign: "right" },
});
