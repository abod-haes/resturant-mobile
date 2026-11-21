import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { focusManager, onlineManager } from "@tanstack/react-query";

/** React Native has no browser onfocus/online events. Mount once at the app root. */
export function QueryLifecycle() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      onlineManager.setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });
    const app = AppState.addEventListener("change", (state) => {
      if (Platform.OS !== "web") focusManager.setFocused(state === "active");
    });
    if (Platform.OS !== "web") focusManager.setFocused(AppState.currentState === "active");
    return () => {
      unsubscribe();
      app.remove();
      onlineManager.setOnline(undefined);
      focusManager.setFocused(undefined);
    };
  }, []);
  return null;
}
