import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import * as SecureStore from "expo-secure-store";
import { useQueryClient } from "@tanstack/react-query";
import { employeeApi, isUnauthorized, ApiError } from "../../shared/api";
import type { Employee } from "../../shared/api";
import type { LoginInput, ChangePasswordInput } from "../../shared/api/types";
import { strings } from "../../shared/config/strings";

const REFRESH_KEY = "restaurant.employee.refreshToken.v2";
const OLD_ACCESS_KEY = "restaurant.employee.accessToken.v1";
type Status = "loading" | "guest" | "authenticated" | "restore-error";
type SessionState = { status: Status; user: Employee | null; notice: string | null };
type SessionContextValue = SessionState & {
  restoreSession(): Promise<void>;
  signIn(input: LoginInput): Promise<void>;
  signOut(): Promise<void>;
  changePassword(input: ChangePasswordInput): Promise<void>;
};
const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<SessionState>({
    status: "loading", user: null, notice: null,
  });
  const renewal = useRef<Promise<void> | null>(null);
  const generation = useRef(0);

  const clearLocal = useCallback(async (notice: string | null = null) => {
    generation.current += 1;
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(OLD_ACCESS_KEY);
    employeeApi.setAccessToken(null);
    queryClient.clear();
    setSession({ status: "guest", user: null, notice });
  }, [queryClient]);

  const renew = useCallback(async (): Promise<void> => {
    if (renewal.current) return renewal.current;
    const attempt = (async () => {
      const version = generation.current;
      const credential = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!credential) throw new Error("Refresh credential not found");
      const result = await employeeApi.refresh(credential);
      if (version !== generation.current) return;
      // Persist the rotated credential BEFORE using the new access JWT.
      try {
        await SecureStore.setItemAsync(REFRESH_KEY, result.refreshToken);
      } catch {
        // The previous refresh token was already spent on the backend.
        // Never retry it: replay would revoke the active session.
        throw new ApiError("UNAUTHORIZED", 401, "Rotated credential could not be persisted");
      }
      if (version !== generation.current) return;
      employeeApi.setAccessToken(result.accessToken);
      queryClient.clear();
      setSession({ status: "authenticated", user: result.user, notice: null });
    })().catch(async (error: unknown) => {
      if (isUnauthorized(error)) await clearLocal(strings.sessionExpired);
      throw error;
    }).finally(() => { renewal.current = null; });
    renewal.current = attempt;
    return attempt;
  }, [clearLocal, queryClient]);

  const restoreSession = useCallback(async () => {
    setSession({ status: "loading", user: null, notice: null });
    try {
      await SecureStore.deleteItemAsync(OLD_ACCESS_KEY);
      const credential = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!credential) {
        employeeApi.setAccessToken(null);
        setSession({ status: "guest", user: null, notice: null });
        return;
      }
      await renew();
    } catch (error) {
      if (!isUnauthorized(error))
        setSession({ status: "restore-error", user: null, notice: strings.sessionRestoreError });
    }
  }, [renew]);

  const requirePasswordChange = useCallback(() => {
    setSession((current) => current.status === "authenticated" && current.user
      ? { ...current, user: { ...current.user, mustChangePassword: true } }
      : current);
  }, []);

  useEffect(() => {
    employeeApi.setReauthenticate(renew);
    employeeApi.setPasswordChangeRequired(requirePasswordChange);
    void restoreSession();
    return () => {
      employeeApi.setReauthenticate(null);
      employeeApi.setPasswordChangeRequired(null);
    };
  }, [renew, restoreSession, requirePasswordChange]);

  const signIn = useCallback(async (input: LoginInput) => {
    const result = await employeeApi.login(input);
    // Refresh is the only persisted credential; access is kept only in memory.
    await SecureStore.setItemAsync(REFRESH_KEY, result.refreshToken);
    await SecureStore.deleteItemAsync(OLD_ACCESS_KEY);
    generation.current += 1;
    employeeApi.setAccessToken(result.accessToken);
    queryClient.clear();
    setSession({ status: "authenticated", user: result.user, notice: null });
  }, [queryClient]);

  const signOut = useCallback(async () => {
    let credential: string | null = null;
    try {
      credential = await SecureStore.getItemAsync(REFRESH_KEY);
    } finally {
      // Revoke UI access and invalidate refresh generation BEFORE remote I/O.
      // Never leave the user authenticated while the network logout hangs.
      await clearLocal();
    }
    if (credential) {
      try {
        await employeeApi.logout(credential);
      } catch {
        setSession((current) => current.status === "guest"
          ? { ...current, notice: strings.logoutOffline } : current);
      }
    }
  }, [clearLocal]);

  const changePassword = useCallback(async (input: ChangePasswordInput) => {
    await employeeApi.changePassword(input);
    // Backend revokes all sessions on success; require fresh login.
    await clearLocal(strings.passwordChanged);
  }, [clearLocal]);

  const value = useMemo(
    () => ({ ...session, restoreSession, signIn, signOut, changePassword }),
    [session, restoreSession, signIn, signOut, changePassword],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be called within SessionProvider");
  return context;
}
