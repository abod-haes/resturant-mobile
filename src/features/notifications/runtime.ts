import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { z } from "zod";
import { employeeApi } from "../../shared/api";

export const CALL_CHANNELS = {
  waiter: "waiter_calls",
  hookah: "hookah_calls",
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

export type PreparationResult = "permission-denied" | "missing-project" | "registered";

/** Register the OS device against the authenticated employee; never log or return the token. */
export async function prepareNotifications(): Promise<PreparationResult> {
  if (Platform.OS === "web") throw new Error("Native notifications not available on web.");
  await configureNotificationChannels();
  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.granted ? existing : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return "permission-denied";
  const extras = z.object({ eas: z.object({ projectId: z.string().min(1) }) }).safeParse(Constants.expoConfig?.extra);
  const projectId = Constants.easConfig?.projectId ?? (extras.success ? extras.data.eas.projectId : undefined);
  if (!projectId) return "missing-project";
  const expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const platform = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : null;
  if (!platform) throw new Error("Native device registration is unsupported on this platform.");
  await employeeApi.registerDevice({ expoPushToken, platform });
  return "registered";
}
export { Notifications };
