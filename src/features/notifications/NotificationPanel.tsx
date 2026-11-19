import { useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { AppButton } from "../../shared/ui/AppButton";
import { AppCard } from "../../shared/ui/AppCard";
import { spacing, useAppTheme } from "../../shared/config/theme";
import { prepareNotifications, type PreparationResult } from "./runtime";

type Status = "idle" | "loading" | PreparationResult | "error";
const messages: Record<Exclude<Status, "loading">, string> = {
  idle: "يمكنك منح صلاحية الإشعارات وتجهيز الجهاز. ربط الجهاز بالسيرفر قيد التطوير.",
  "permission-denied": "الإشعارات غير مسموحة. يمكن تعديل الإذن من إعدادات الجهاز.",
  "missing-project": "يجب إعداد Expo EAS Project ID قبل استخراج رمز الإشعارات.",
  prepared: "تم تجهيز رمز الإشعارات محلياً. لم يتم ربطه بالسيرفر بعد.",
  error: "تعذر تجهيز الإشعارات. قد تحتاج Development Build وإعداد Push Credentials.",
};

export function NotificationPanel() {
  const { colors } = useAppTheme();
  const [status, setStatus] = useState<Status>("idle");
  async function prepare() {
    if (status === "loading") return;
    setStatus("loading");
    try {
      const result = await prepareNotifications();
      setStatus(result);
    } catch {
      setStatus("error");
    }
  }

  return (
    <AppCard>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>إشعارات الاستدعاءات</Text>
        <Text style={[styles.message, { color: colors.muted }]}>
          {messages[status === "loading" ? "idle" : status]}
        </Text>
      </View>
      <AppButton
        title="تجهيز الإشعارات"
        variant="secondary"
        onPress={() => void prepare()}
        loading={status === "loading"}
      />
    </AppCard>
  );
}
const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  title: { fontWeight: "800", fontSize: 16, textAlign: "right" },
  message: { fontSize: 13, lineHeight: 22, textAlign: "right" },
});
