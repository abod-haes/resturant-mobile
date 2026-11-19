import { Redirect } from "expo-router";
import { useSession, SignInScreen } from "../src/features/auth";
import { strings } from "../src/shared/config/strings";
import { Feedback } from "../src/shared/ui/Feedback";

export default function SignIn() {
  const { status, user, restoreSession } = useSession();
  if (status === "authenticated")
    return <Redirect href={user?.mustChangePassword ? "/change-password" : "/"} />;
  if (status === "loading") return <Feedback message={strings.loading} loading />;
  if (status === "restore-error")
    return <Feedback message={strings.sessionRestoreError} retry={() => void restoreSession()} />;
  return <SignInScreen />;
}
