import { useCallback, useEffect, useState } from "react";
import { Linking, Platform, Text, View, StyleSheet } from "react-native";
import * as Notifications from "expo-notifications";
import { AppButton } from "../../shared/ui/AppButton";
import { useAppTheme, spacing, radius, typeScale } from "../../shared/config/theme";
import { prepareNotifications } from "./runtime";

/** Explain permissions once per authenticated session; always allow later recovery. */
export function NotificationPermissionPrompt() {
  const { colors } = useAppTheme();
  const [status, setStatus] = useState<"checking" | "ready" | "prompt" | "denied" | "error">("checking");
  const [busy, setBusy] = useState(false);
  const check = useCallback(async () => {
    if (Platform.OS === "web") { setStatus("ready"); return; }
    try {
      const permission = await Notifications.getPermissionsAsync();
      setStatus(permission.granted ? "ready" : permission.canAskAgain ? "prompt" : "denied");
    } catch { setStatus("error"); }
  }, []);
  useEffect(() => { void check(); }, [check]);
  const enable = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await prepareNotifications();
      setStatus(result === "registered" ? "ready" : result === "permission-denied" ? "denied" : "error");
    } catch { setStatus("error"); }
    finally { setBusy(false); }
  };
  if (status === "ready" || status === "checking") return null;
  return <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <Text style={[styles.title, { color: colors.text }]}>تفعيل إشعارات الاستدعاءات</Text>
    <Text style={[styles.description, { color: colors.muted }]}>
      {status === "denied" ? "الإشعارات مرفوضة من إعدادات الجهاز. افتح الإعدادات للسماح بها." : "اسمح بالإشعارات لتصلك استدعاءات الطاولات حتى عندما يكون التطبيق بالخلفية."}
    </Text>
    <AppButton title={status === "denied" ? "فتح إعدادات الإشعارات" : "تفعيل الإشعارات"} disabled={busy}
      loading={busy} onPress={() => { if (status === "denied") void Linking.openSettings(); else void enable(); }} />
    {status === "error" && <Text style={{ color: colors.muted, textAlign: "right" }}>تعذر إعداد الإشعارات. تأكد من اتصالك وإعدادات التطبيق ثم حاول مجدداً.</Text>}
  </View>;
}
const styles = StyleSheet.create({
  panel: { padding: spacing.lg, borderWidth: 1, borderRadius: radius.lg, gap: spacing.md },
  title: { fontSize: typeScale.cardTitle, fontWeight: "700", textAlign: "right", includeFontPadding: false },
  description: { fontSize: typeScale.body, lineHeight: 23, textAlign: "right", includeFontPadding: false },
});
