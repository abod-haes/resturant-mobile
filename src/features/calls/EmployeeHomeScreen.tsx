import { useState } from "react";
import type { ReactNode } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshControl, ScrollView, Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { employeeApi, isMockMode, ApiError } from "../../shared/api";
import { employeeKeys } from "../../shared/api/query-keys";
import { strings } from "../../shared/config/strings";
import { radius, spacing, useAppTheme } from "../../shared/config/theme";
import { AppButton } from "../../shared/ui/AppButton";
import { Feedback } from "../../shared/ui/Feedback";
import { AppErrorNotice } from "../../shared/ui/AppErrorNotice";
import { useFeedback } from "../../shared/ui/AppToast";
import { feedbackText } from "../../shared/i18n/feedback";
import { useSession } from "../auth";
import { ShiftPanel } from "../shifts";
import { CallCard } from "./CallCard";

export function EmployeeHomeScreen({ footer }: { footer?: ReactNode }) {
  const { user, signOut } = useSession();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const { showToast } = useFeedback();
  const [shiftError, setShiftError] = useState<unknown>(null);
  const [logoutError, setLogoutError] = useState<unknown>(null);

  const shift = useQuery({
    queryKey: employeeKeys.shift(user?.id),
    queryFn: ({ signal }) => employeeApi.getCurrentShift(signal),
  });
  const calls = useInfiniteQuery({
    queryKey: employeeKeys.calls(user?.id),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => employeeApi.listCalls({ cursor: pageParam, limit: 20 }, signal),
    getNextPageParam: (page) => page.meta.hasMore ? page.meta.nextCursor ?? undefined : undefined,
  });
  const mutation = useMutation({
    mutationFn: async (): Promise<"started" | "ended"> => {
      if (shift.data) {
        await employeeApi.endShift();
        return "ended";
      }
      await employeeApi.startShift();
      return "started";
    },
    onSuccess: async (action) => {
      setShiftError(null);
      showToast({
        message: feedbackText(action === "started" ? "shiftStarted" : "shiftEnded"),
        key: action === "started" ? "shift-started" : "shift-ended",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.shift(user?.id) }),
        queryClient.invalidateQueries({ queryKey: employeeKeys.callsRoot(user?.id) }),
      ]);
    },
    onError: (error: unknown) => {
      setShiftError(error);
      if (error instanceof ApiError &&
        (error.code === "SHIFT_ALREADY_ACTIVE" || error.code === "SHIFT_NOT_ACTIVE")) {
        // Never assume a conflict means success. Reconcile actual server shift.
        void queryClient.invalidateQueries({ queryKey: employeeKeys.shift(user?.id) });
      }
    },
  });

  const allCalls = calls.data?.pages.flatMap((page) => page.data) ?? [];
  const refreshing = shift.isRefetching || calls.isRefetching;
  function refresh() {
    void Promise.all([shift.refetch(), calls.refetch()]);
  }
  async function logout() {
    setLogoutError(null);
    try {
      await signOut();
    } catch (error) {
      setLogoutError(error);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.profile}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>
              {isMockMode ? strings.mockBadge : strings.appName}
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>
              {strings.welcome}، {user?.name ?? user?.username ?? "موظف"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {user?.department === "hookah" ? "قسم الأراكيل" : "فريق الخدمة"}
            </Text>
          </View>
          <AppButton title={strings.logout} onPress={() => void logout()} variant="secondary" />
        </View>

        <AppErrorNotice error={logoutError} />
        <ShiftPanel
          shift={shift.data}
          loading={shift.isLoading}
          changing={mutation.isPending}
          error={shiftError ?? (shift.isError ? shift.error : null)}
          onToggle={() => { setShiftError(null); mutation.mutate(); }}
          onRetry={() => void shift.refetch()}
        />

        <View style={styles.sectionHeading}>
          <View style={[styles.counter, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.counterText, { color: colors.primary }]}>{allCalls.length}</Text>
          </View>
          <View style={styles.sectionText}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{strings.callsTitle}</Text>
            <Text style={[styles.sectionDescription, { color: colors.muted }]}>{strings.callsSubtitle}</Text>
          </View>
        </View>
        {calls.isPending ? (
          <Feedback message={strings.loading} loading />
        ) : calls.isError && allCalls.length === 0 ? (
          <AppErrorNotice error={calls.error} context="calls" variant="screen" onRetry={() => void calls.refetch()} />
        ) : allCalls.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{strings.emptyCalls}</Text>
            <Text style={[styles.emptyHint, { color: colors.muted }]}>{strings.emptyCallsHint}</Text>
          </View>
        ) : (
          <>
            {allCalls.map((call) => <CallCard key={call.id} call={call} />)}
            {calls.isFetchNextPageError && (
              <AppErrorNotice error={calls.error} context="calls" onRetry={() => void calls.fetchNextPage()} />
            )}
            {calls.isError && !calls.isFetchNextPageError && (
              <AppErrorNotice error={calls.error} context="calls" onRetry={() => void calls.refetch()} />
            )}
            {calls.hasNextPage && (
              <AppButton
                title={strings.more}
                variant="secondary"
                loading={calls.isFetchingNextPage}
                onPress={() => void calls.fetchNextPage()}
              />
            )}
          </>
        )}
        {footer}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.huge, gap: spacing.lg },
  header: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md },
  profile: { flex: 1, alignItems: "flex-end", gap: spacing.xs },
  eyebrow: { fontSize: 12, fontWeight: "800" },
  title: { fontSize: 24, fontWeight: "800", textAlign: "right" },
  subtitle: { fontSize: 13, textAlign: "right" },
  sectionHeading: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md, paddingTop: spacing.md },
  sectionText: { flex: 1, alignItems: "flex-end", gap: spacing.xs },
  sectionTitle: { fontSize: 18, fontWeight: "800", textAlign: "right" },
  sectionDescription: { fontSize: 12, textAlign: "right" },
  counter: { minWidth: 36, height: 36, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
  counterText: { fontSize: 13, fontWeight: "800" },
  empty: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.huge, gap: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: "800", textAlign: "center" },
  emptyHint: { fontSize: 13, textAlign: "center" },
});
