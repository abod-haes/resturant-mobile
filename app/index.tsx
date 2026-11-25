import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Tabs } from "heroui-native/tabs";
import { Bell, UserRound } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme, spacing, typeScale, typography } from "../src/shared/config/theme";
import { View, StyleSheet } from "react-native";
import { AccountScreen, useSession } from "../src/features/auth";
import { EmployeeHomeScreen } from "../src/features/calls";
import { AppScreen } from "../src/shared/ui/AppScreen";
import { strings } from "../src/shared/config/strings";
import { Feedback } from "../src/shared/ui/Feedback";

export default function Home() {
  const { status, user, restoreSession } = useSession();
  if (status === "guest") return <Redirect href="/sign-in" />;
  if (status === "authenticated" && user?.mustChangePassword)
    return <Redirect href="/change-password" />;
  if (status === "authenticated") return <EmployeeTabs />;
  return (
    <AppScreen>
      <View style={styles.center}>
        <Feedback
          message={status === "loading" ? strings.loading : strings.sessionRestoreError}
          loading={status === "loading"}
          retry={status === "restore-error" ? () => void restoreSession() : undefined}
        />
      </View>
    </AppScreen>
  );
}
const styles = StyleSheet.create({ center: { flex: 1, justifyContent: "center" } });

const tabs = [
  { value: "notifications", label: strings.notifications, Icon: Bell },
  { value: "account", label: strings.account, Icon: UserRound },
] as const;
function EmployeeTabs() {
  const [tab, setTab] = useState<"notifications" | "account">("notifications");
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs value={tab} onValueChange={(next) => { if (next === "notifications" || next === "account") setTab(next); }} variant="primary" style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        {tab === "notifications" ? <EmployeeHomeScreen /> : <AccountScreen onChangePassword={() => router.push("/change-password")} />}
      </View>
      <Tabs.List background={null} className="bg-transparent border-0" style={{ flexDirection: "row-reverse", marginHorizontal: spacing.lg, marginBottom: Math.max(insets.bottom, spacing.sm), padding: spacing.xs, gap: spacing.sm }}>
        <Tabs.Indicator className="rounded-xl" style={{ backgroundColor: colors.button }} />
        {tabs.map(({ value, label, Icon }) => (
          <Tabs.Trigger key={value} value={value} accessibilityLabel={label} className="rounded-xl" style={{ flex: 1, minHeight: 58, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: spacing.sm }}>
            {({ isSelected }) => (
              <>
                <Icon size={22} color={isSelected ? "#FFFFFF" : colors.muted} />
                <Tabs.Label style={{ color: isSelected ? "#FFFFFF" : colors.text, fontSize: typeScale.control, fontFamily: typography.bold }}>{label}</Tabs.Label>
              </>
            )}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs>
  );
}
