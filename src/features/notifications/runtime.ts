import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { z } from "zod";

export const CALL_CHANNELS = {
  waiter: "restaurant-waiter-v1",
  hookah: "restaurant-hookah-v1",
} as const;
let channelsReady = false;

export async function configureNotificationChannels(): Promise<void> {
  if (channelsReady) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CALL_CHANNELS.waiter, {
      name: "استدعاءات الغارسون",
      importance: Notifications.AndroidImportance.MAX,
      sound: "waiter.wav",
      vibrationPattern: [0, 200, 100, 200],
    });
    await Notifications.setNotificationChannelAsync(CALL_CHANNELS.hookah, {
      name: "استدعاءات الأراكيل",
      importance: Notifications.AndroidImportance.MAX,
      sound: "hookah.wav",
      vibrationPattern: [0, 260, 120, 260],
    });
  }
  channelsReady = true;
}

export type PreparationResult = "permission-denied" | "missing-project" | "prepared";

/**
 * Creates a local Expo token, but DOES NOT claim backend registration or delivery.
 * Device registration is blocked on finalized POST/DELETE endpoint semantics.
 */
export async function prepareNotifications(): Promise<PreparationResult> {
  if (Platform.OS === "web") throw new Error("Native notifications not available on web.");
  await configureNotificationChannels();
  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.granted ? existing : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return "permission-denied";
  const extras = z.object({ eas: z.object({ projectId: z.string().min(1) }) }).safeParse(Constants.expoConfig?.extra);
  const projectId = Constants.easConfig?.projectId ?? (extras.success ? extras.data.eas.projectId : undefined);
  if (!projectId) return "missing-project";
  await Notifications.getExpoPushTokenAsync({ projectId });
  return "prepared";
}
export { Notifications };
