import { Redirect } from "expo-router";
import { ChangePasswordScreen, useSession } from "../src/features/auth";
import { Feedback } from "../src/shared/ui/Feedback";
import { strings } from "../src/shared/config/strings";

export default function ChangePassword() {
  const { status, user, restoreSession } = useSession();
  if (status === "guest") return <Redirect href="/sign-in" />;
  if (status === "loading") return <Feedback message={strings.loading} loading />;
  if (status === "restore-error")
    return <Feedback message={strings.sessionRestoreError} retry={() => void restoreSession()} />;
  if (!user?.mustChangePassword) return <Redirect href="/" />;
  return <ChangePasswordScreen />;
}
