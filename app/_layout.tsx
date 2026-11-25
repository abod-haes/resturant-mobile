import "../global.css";
import { useFonts, Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold, Cairo_800ExtraBold } from "@expo-google-fonts/cairo";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HeroUINativeProvider } from "heroui-native/provider";
import { useState } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { QueryLifecycle } from "../src/shared/api/query-lifecycle";
import { canRetryRead } from "../src/shared/api/errors";
import { FeedbackProvider } from "../src/shared/ui/AppToast";
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
  const [fontsLoaded, fontError] = useFonts({ Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold, Cairo_800ExtraBold });
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: canRetryRead, staleTime: 10000, refetchOnReconnect: true },
      mutations: { retry: false },
    },
  }));
  if (!fontsLoaded && !fontError) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <HeroUINativeProvider>
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <SessionProvider>
          <QueryLifecycle />
          <StatusBar style="auto" />
          <FeedbackProvider>
            <AuthenticatedServices />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="sign-in" />
              <Stack.Screen name="change-password" />
            </Stack>
          </FeedbackProvider>
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
    </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
