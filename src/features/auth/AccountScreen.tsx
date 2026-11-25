import { useState } from "react";
import { UserRound, Moon, LogOut } from "lucide-react-native";
import { View, Text, ScrollView, StyleSheet, Modal, Image } from "react-native";
import { AppScreen } from "../../shared/ui/AppScreen";
import { AppButton } from "../../shared/ui/AppButton";
import { AppCard } from "../../shared/ui/AppCard";
import { AppErrorNotice } from "../../shared/ui/AppErrorNotice";
import { strings } from "../../shared/config/strings";
import { useAppTheme, spacing, radius, typeScale, typography } from "../../shared/config/theme";
import { useSession } from "./SessionProvider";

export function AccountScreen({ onChangePassword }: { onChangePassword: () => void }) {
  const { user, signOut } = useSession();
  const { colors, dark, identity } = useAppTheme();
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function logout() {
    if (pending) return;
    setPending(true);
    setError(null);
    try { await signOut(); setOpen(false); }
    catch (cause) { setError(cause); }
    finally { setPending(false); }
  }
  return <AppScreen>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.banner, { backgroundColor: colors.button }]}>
        <Text accessibilityRole="header" style={[styles.bannerTitle, { color: colors.onPrimary }]}>{strings.account}</Text>
      </View>
      <View style={styles.profile}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]}>{identity?.branding.logoUrl && identity.branding.logoUrl !== failedLogo ? <Image source={{ uri: identity.branding.logoUrl }} style={styles.logo} resizeMode="contain" onError={() => setFailedLogo(identity.branding.logoUrl)} /> : <UserRound size={36} color={colors.primary} />}</View>
        <View style={styles.details}>
          <Text style={[styles.name, { color: colors.text }]}>{user?.name ?? user?.username ?? strings.employee}</Text>
          <Text style={[styles.label, { color: colors.muted }]}>{user?.department === "hookah" ? strings.hookahDepartment : user?.department === "waiter" ? strings.waiterDepartment : strings.employee}</Text>
          {identity && <Text style={[styles.label, { color: colors.muted }]}>{identity.name}</Text>}
          {user?.username && <Text style={[styles.label, { color: colors.muted }]}>{user.username}</Text>}
        </View>
      </View>
      <AppCard>
        <AppButton title={strings.changePassword} variant="secondary" onPress={onChangePassword} />
        <View style={styles.row}>
          <Moon color={colors.primary} size={22} />
          <Text style={[styles.label, { color: colors.text }]}>{strings.appearance}</Text>
          <Text style={[styles.label, { color: colors.muted }]}>{strings.systemAppearance} · {dark ? strings.darkAppearance : strings.lightAppearance}</Text>
        </View>
      </AppCard>
      <View style={styles.row}>
        <LogOut size={22} color={colors.danger} />
        <View style={styles.details}><AppButton title={strings.logout} variant="danger" onPress={() => { setError(null); setOpen(true); }} /></View>
      </View>
    </ScrollView>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => { if (!pending) setOpen(false); }}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <AppCard>
            <Text accessibilityRole="header" style={[styles.name, {color: colors.text}]}>{strings.logout}</Text>
            <Text style={[styles.label, {color: colors.muted}]}>{strings.logoutConfirm}</Text>
            <AppErrorNotice error={error} />
            <AppButton title={strings.confirmLogout} loading={pending} onPress={() => void logout()} />
            <AppButton title={strings.cancel} variant="secondary" disabled={pending} onPress={() => setOpen(false)} />
          </AppCard>
        </View>
      </View>
    </Modal>
  </AppScreen>;
}
const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.xl, width: "100%", maxWidth: 600, alignSelf: "center" },
  banner: { minHeight: 64, borderRadius: radius.md, justifyContent: "center", alignItems: "center" },
  logo: { width: 58, height: 58, borderRadius: 10 },
  bannerTitle: { fontSize: typeScale.title, fontFamily: typography.extraBold },
  profile: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.lg, paddingVertical: spacing.md },
  avatar: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center" },
  details: { flex: 1, minWidth: 0, gap: spacing.xs },
  name: { fontSize: typeScale.sectionTitle, fontFamily: typography.extraBold, textAlign: "right" },
  label: { fontFamily: typography.regular, fontSize: typeScale.body, textAlign: "right", flexShrink: 1 },
  row: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md, flexWrap: "wrap" },
  backdrop: { flex: 1, backgroundColor: "#0009", justifyContent: "center", padding: spacing.xxl },
  dialog: { width: "100%", maxWidth: 440, alignSelf: "center" },
});
