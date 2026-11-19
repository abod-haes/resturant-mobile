import { useState } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { SessionProvider, useSession } from "../src/features/auth";
import { NotificationCoordinator } from "../src/features/notifications";

function AuthenticatedServices() {
  const { status, user } = useSession();
  const active = status === "authenticated" && !user?.mustChangePassword;
  return (
    <NotificationCoordinator
      employeeId={active ? user?.id ?? null : null}
      branchId={active ? user?.branchId ?? null : null}
    />
  );
}
export default function RootLayout() {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 10000, refetchOnReconnect: true },
      mutations: { retry: false },
    },
  }));
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <SessionProvider>
          <StatusBar style="auto" />
          <AuthenticatedServices />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="change-password" />
          </Stack>
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
