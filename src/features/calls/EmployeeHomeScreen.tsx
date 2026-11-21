import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { FlatList, RefreshControl, Text, View, StyleSheet, useWindowDimensions } from "react-native";
import type { ListRenderItemInfo } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ServiceCall } from "../../shared/api";
import { isMockMode } from "../../shared/api";
import { strings } from "../../shared/config/strings";
import { spacing, radius, useAppTheme } from "../../shared/config/theme";
import { AppButton } from "../../shared/ui/AppButton";
import { Feedback } from "../../shared/ui/Feedback";
import { AppErrorNotice } from "../../shared/ui/AppErrorNotice";
import { useSession } from "../auth";
import { ShiftPanel, useShiftActions } from "../shifts";
import { CallCard } from "./CallCard";
import { CallsFilter } from "./CallsFilter";
import { useEmployeeCalls } from "./useEmployeeCalls";
import type { CallFilter } from "./model";

/** Composition only: server state/actions live in feature hooks, not the screen. */
export function EmployeeHomeScreen({ footer }: { footer?: ReactNode }) {
  const { user, signOut } = useSession();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const list = useRef<FlatList<ServiceCall>>(null);
  const hasScrolled = useRef(false);
  const [logoutError, setLogoutError] = useState<unknown>(null);
  const shifts = useShiftActions(user?.id);
  const feed = useEmployeeCalls(user?.id);

  const chooseFilter = useCallback((next: CallFilter) => {
    if (next === feed.filter) return;
    hasScrolled.current = false;
    feed.setFilter(next);
    list.current?.scrollToOffset({ offset: 0, animated: false });
  }, [feed.filter, feed.setFilter]);

  const refresh = useCallback(() => {
    void Promise.all([shifts.refresh(), feed.refresh()]);
  }, [shifts.refresh, feed.refresh]);

  const loadOnScroll = useCallback(() => {
    // FlatList may fire onEndReached on mount/when too few items fit.
    // Require an actual drag, and allow one automatic page per drag.
    if (!hasScrolled.current) return;
    hasScrolled.current = false;
    feed.loadMore();
  }, [feed.loadMore]);

  const renderCall = useCallback(
    ({ item }: ListRenderItemInfo<ServiceCall>) => <CallCard call={item} />, [],
  );
  const keyCall = useCallback((call: ServiceCall) => call.id, []);

  async function logout() {
    setLogoutError(null);
    try {
      await signOut();
    } catch (error) {
      setLogoutError(error);
    }
  }

  const listHeader = (
    <View style={styles.headerSections}>
      <View style={styles.header}>
        <View style={styles.profile}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>
            {isMockMode ? strings.mockBadge : strings.appName}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {strings.welcome}، {user?.name ?? user?.username ?? "موظف"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {user?.department === "hookah" ? strings.hookahDepartment : strings.waiterDepartment}
          </Text>
        </View>
        <AppButton title={strings.logout} onPress={() => void logout()} variant="secondary" />
      </View>
      <AppErrorNotice error={logoutError} />
      <ShiftPanel
        shift={shifts.shift.data}
        loading={shifts.shift.isLoading}
        changing={shifts.changing}
        error={shifts.error}
        onToggle={shifts.toggle}
        onRetry={shifts.retry}
      />
      <View style={styles.sectionHeading}>
        <View style={[styles.counter, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.counterText, { color: colors.primary }]}>{feed.calls.length}</Text>
        </View>
        <View style={styles.sectionText}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{strings.callsTitle}</Text>
          <Text style={[styles.sectionDescription, { color: colors.muted }]}>
            {strings.displayedCallsCount}: {feed.calls.length} · {strings.callsSubtitle}
          </Text>
        </View>
      </View>
      <Text style={[styles.filterTitle, { color: colors.muted }]}>{strings.callsFilterLabel}</Text>
      <CallsFilter value={feed.filter} onChange={chooseFilter} />
    </View>
  );

  const listEmpty = feed.query.isPending ? (
    <Feedback message={strings.loading} loading />
  ) : feed.query.isError ? (
    <AppErrorNotice error={feed.query.error} context="calls" variant="screen"
      onRetry={() => void feed.query.refetch()} />
  ) : (
    <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{strings.emptyCalls}</Text>
      <Text style={[styles.emptyHint, { color: colors.muted }]}>{strings.emptyCallsHint}</Text>
    </View>
  );

  const listFooter = (
    <View style={styles.footer}>
      {feed.calls.length > 0 && feed.query.isFetchNextPageError && (
        <AppErrorNotice error={feed.query.error} context="calls"
          onRetry={() => void feed.query.fetchNextPage()} />
      )}
      {feed.calls.length > 0 && feed.query.isError && !feed.query.isFetchNextPageError && (
        <AppErrorNotice error={feed.query.error} context="calls"
          onRetry={() => void feed.query.refetch()} />
      )}
      {feed.query.hasNextPage && (
        <AppButton title={feed.query.isFetchingNextPage ? strings.callsMoreLoading : strings.more}
          variant="secondary"
          loading={feed.query.isFetchingNextPage}
          disabled={feed.query.isFetching}
          onPress={feed.loadMore} />
      )}
      {footer}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        ref={list}
        data={feed.calls}
        renderItem={renderCall}
        keyExtractor={keyCall}
        ItemSeparatorComponent={CallSeparator}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: width < 360 ? spacing.md : spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={feed.refreshing || shifts.shift.isRefetching}
            onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        onScrollBeginDrag={() => { hasScrolled.current = true; }}
        onEndReached={loadOnScroll}
        onEndReachedThreshold={0.35}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        keyboardShouldPersistTaps="handled"
        accessibilityLabel={strings.callsTitle}
      />
    </SafeAreaView>
  );
}
function CallSeparator() {
  return <View style={styles.separator} />;
}
const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    width: "100%", maxWidth: 760, alignSelf: "center",
    paddingTop: spacing.md, paddingBottom: spacing.huge, flexGrow: 1,
  },
  headerSections: { gap: spacing.lg, paddingBottom: spacing.lg },
  header: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md },
  profile: { flex: 1, minWidth: 155, alignItems: "flex-end", gap: spacing.xs },
  eyebrow: { fontSize: 12, fontWeight: "800" },
  title: { fontSize: 24, fontWeight: "800", textAlign: "right" },
  subtitle: { fontSize: 13, textAlign: "right" },
  sectionHeading: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md, paddingTop: spacing.md },
  sectionText: { flex: 1, alignItems: "flex-end", gap: spacing.xs },
  sectionTitle: { fontSize: 18, fontWeight: "800", textAlign: "right" },
  sectionDescription: { fontSize: 12, textAlign: "right" },
  filterTitle: { fontSize: 13, textAlign: "right", marginBottom: -spacing.sm },
  counter: { minWidth: 36, height: 36, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
  counterText: { fontSize: 13, fontWeight: "800" },
  separator: { height: spacing.md },
  footer: { gap: spacing.md, paddingTop: spacing.lg },
  empty: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.huge, gap: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: "800", textAlign: "center" },
  emptyHint: { fontSize: 13, textAlign: "center" },
});
