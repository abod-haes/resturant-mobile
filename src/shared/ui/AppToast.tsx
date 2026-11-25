import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import { AccessibilityInfo, View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, spacing, typeScale, useAppTheme } from "../config/theme";
import { feedbackText } from "../i18n/feedback";

type Toast = { message: string; kind: "success" | "error"; key: string; id: number };
type FeedbackContextValue = { showToast(input: { message: string; kind?: Toast["kind"]; key?: string }): void };
const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: PropsWithChildren) {
  const { colors, typography } = useAppTheme();
  const styles = createStyles(typography);
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const serial = useRef(0);
  const last = useRef<{ key: string; at: number } | null>(null);

  const showToast = useCallback(({ message, kind = "success", key }: {
    message: string; kind?: Toast["kind"]; key?: string;
  }) => {
    const identity = key ?? kind + ":" + message;
    const now = Date.now();
    if (last.current?.key === identity && now - last.current.at < 1800) return;
    last.current = { key: identity, at: now };
    setToast({ message, kind, key: identity, id: ++serial.current });
  }, []);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isScreenReaderEnabled()
      .then((enabled) => { if (active) setScreenReaderEnabled(enabled); })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("screenReaderChanged", setScreenReaderEnabled);
    return () => { active = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (!toast || screenReaderEnabled) return;
    // Reading time scales with message length; screen-reader users dismiss manually.
    const duration = Math.min(12_000, Math.max(4500, 2800 + toast.message.length * 75));
    const timeout = setTimeout(() => setToast((current) => current?.id === toast.id ? null : current), duration);
    return () => clearTimeout(timeout);
  }, [toast, screenReaderEnabled]);

  const value = useMemo(() => ({ showToast }), [showToast]);
  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {toast && (
        <View pointerEvents="box-none"
          style={[styles.overlay, { bottom: Math.max(spacing.lg, insets.bottom + spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={toast.message + ". " + feedbackText("dismiss")}
            onPress={() => setToast(null)}
            style={[styles.toast, {
              backgroundColor: colors.surface,
              borderColor: toast.kind === "error" ? colors.danger : colors.success,
            }]}
          >
            <Text allowFontScaling accessibilityLiveRegion="polite"
              style={[styles.message, { color: colors.text }]}>{toast.message}</Text>
          </Pressable>
        </View>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback must be used inside FeedbackProvider");
  return context;
}
const createStyles = (typography: import("../config/theme").AppTypography) => StyleSheet.create({
  overlay: {
    position: "absolute", left: spacing.md, right: spacing.md,
    alignItems: "center", zIndex: 10,
  },
  toast: {
    minHeight: 48, width: "100%", maxWidth: 500,
    borderRadius: radius.md, borderWidth: 1,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    justifyContent: "center",
  },
  message: { ...typography.regular, fontSize: typeScale.body, textAlign: "center" },
});
