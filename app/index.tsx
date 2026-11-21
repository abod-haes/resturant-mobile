import { Redirect } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useSession } from "../src/features/auth";
import { EmployeeHomeScreen } from "../src/features/calls";
import { NotificationPanel } from "../src/features/notifications";
import { useAppTheme } from "../src/shared/config/theme";
import { strings } from "../src/shared/config/strings";
import { Feedback } from "../src/shared/ui/Feedback";

export default function Home() {
  const { status, user, restoreSession } = useSession();
  const { colors } = useAppTheme();
  if (status === "guest") return <Redirect href="/sign-in" />;
  if (status === "authenticated" && user?.mustChangePassword)
    return <Redirect href="/change-password" />;
  if (status === "authenticated") return <EmployeeHomeScreen footer={<NotificationPanel employeeId={user?.id ?? null} />} />;
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Feedback
        message={status === "loading" ? strings.loading : strings.sessionRestoreError}
        loading={status === "loading"}
        retry={status === "restore-error" ? () => void restoreSession() : undefined}
      />
    </View>
  );
}
const styles = StyleSheet.create({ center: { flex: 1, justifyContent: "center" } });
