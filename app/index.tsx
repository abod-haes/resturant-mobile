import { Redirect } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useSession } from "../src/features/auth";
import { EmployeeHomeScreen } from "../src/features/calls";
import { AppScreen } from "../src/shared/ui/AppScreen";
import { strings } from "../src/shared/config/strings";
import { Feedback } from "../src/shared/ui/Feedback";

export default function Home() {
  const { status, user, restoreSession } = useSession();
  if (status === "guest") return <Redirect href="/sign-in" />;
  if (status === "authenticated" && user?.mustChangePassword)
    return <Redirect href="/change-password" />;
  if (status === "authenticated") return <EmployeeHomeScreen />;
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
