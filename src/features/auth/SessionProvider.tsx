import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import * as SecureStore from "expo-secure-store";
import { useQueryClient } from "@tanstack/react-query";
import { employeeApi, isUnauthorized } from "../../shared/api";
import type { Employee } from "../../shared/api";
import type { LoginInput } from "../../shared/api/types";
import { strings } from "../../shared/config/strings";

const TOKEN_KEY = "restaurant.employee.accessToken.v1";
type Status = "loading" | "guest" | "authenticated" | "restore-error";
type SessionState = { status: Status; user: Employee | null; notice: string | null };
type SessionContextValue = SessionState & {
  restoreSession(): Promise<void>;
  signIn(input: LoginInput): Promise<void>;
  signOut(): Promise<void>;
};
const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<SessionState>({
    status: "loading",
    user: null,
    notice: null,
  });

  const restoreSession = useCallback(async () => {
    setSession({ status: "loading", user: null, notice: null });
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      employeeApi.setAccessToken(storedToken);
      if (!storedToken) {
        setSession({ status: "guest", user: null, notice: null });
        return;
      }
      const user = await employeeApi.getMe();
      setSession({ status: "authenticated", user, notice: null });
    } catch (error) {
      if (isUnauthorized(error)) {
        try {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          employeeApi.setAccessToken(null);
          queryClient.clear();
          setSession({ status: "guest", user: null, notice: strings.sessionRestoreError });
        } catch {
          setSession({ status: "restore-error", user: null, notice: strings.sessionRestoreError });
        }
      } else {
        // Keep the SecureStore token on transient network/server failures.
        setSession({ status: "restore-error", user: null, notice: strings.sessionRestoreError });
      }
    }
  }, [queryClient]);

  useEffect(() => { void restoreSession(); }, [restoreSession]);

  const signIn = useCallback(async (input: LoginInput) => {
    const result = await employeeApi.login(input);
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, result.accessToken);
    } catch (error) {
      employeeApi.setAccessToken(null);
      throw error;
    }
    employeeApi.setAccessToken(result.accessToken);
    queryClient.clear();
    setSession({ status: "authenticated", user: result.user, notice: null });
  }, [queryClient]);

  const signOut = useCallback(async () => {
    let remoteFailed = false;
    try {
      await employeeApi.logout();
    } catch {
      // Surface the failure in the sign-in screen while still clearing local credentials.
      remoteFailed = true;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    employeeApi.setAccessToken(null);
    queryClient.clear();
    setSession({
      status: "guest",
      user: null,
      notice: remoteFailed ? strings.logoutOffline : null,
    });
  }, [queryClient]);

  const value = useMemo(
    () => ({ ...session, restoreSession, signIn, signOut }),
    [session, restoreSession, signIn, signOut],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be called within SessionProvider");
  return context;
}
