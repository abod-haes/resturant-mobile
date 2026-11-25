import { BellRing } from "lucide-react-native";
import { useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { FlatList, RefreshControl, Text, View, StyleSheet } from "react-native";
import type { ListRenderItemInfo } from "react-native";
import { AppScreen } from "../../shared/ui/AppScreen";
import type { ServiceCall } from "../../shared/api";
import { strings } from "../../shared/config/strings";
import { spacing, radius, typeScale, useAppTheme } from "../../shared/config/theme";
import { useAppLayout } from "../../shared/config/useAppLayout";
import { AppButton } from "../../shared/ui/AppButton";
import { AppErrorNotice } from "../../shared/ui/AppErrorNotice";
import { useSession } from "../auth";
import { ShiftPanel, useShiftActions } from "../shifts";
import { CallCard } from "./CallCard";
import { CallCardsSkeleton } from "./CallCardsSkeleton";
import { CallsFilter } from "./CallsFilter";
import { useEmployeeCalls } from "./useEmployeeCalls";
import type { CallFilter } from "./model";
import { NotificationPermissionPrompt } from "../notifications";

/** Composition only: server state/actions live in feature hooks, not the screen. */
export function EmployeeHomeScreen({ footer }: { footer?: ReactNode }) {
  const { user } = useSession();
  const { colors, typography } = useAppTheme();
  const styles = createStyles(typography);
  const layout = useAppLayout();
  const list = useRef<FlatList<ServiceCall>>(null);
  const hasScrolled = useRef(false);
  const shifts = useShiftActions(user?.id);
  const feed = useEmployeeCalls(user?.id);
  const { filter, setFilter, refresh: refreshCalls, loadMore } = feed;
  const { refresh: refreshShift } = shifts;

  const chooseFilter = useCallback((next: CallFilter) => {
    if (next === filter) return;
    hasScrolled.current = false;
    setFilter(next);
    list.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filter, setFilter]);

  const refresh = useCallback(() => {
    void Promise.all([refreshShift(), refreshCalls()]);
  }, [refreshShift, refreshCalls]);

  const loadOnScroll = useCallback(() => {
    // FlatList may fire onEndReached on mount/when too few items fit.
    // Require an actual drag, and allow one automatic page per drag.
    if (!hasScrolled.current) return;
    hasScrolled.current = false;
    loadMore();
  }, [loadMore]);

  const renderCall = useCallback(
    ({ item }: ListRenderItemInfo<ServiceCall>) => <CallCard call={item} />, [],
  );
  const keyCall = useCallback((call: ServiceCall) => call.id, []);

  const listHeader = (
    <View style={styles.headerSections}>
      <View style={[styles.banner, { backgroundColor: colors.button }]}>
        <BellRing size={24} color={colors.onPrimary} />
        <Text accessibilityRole="header" style={[styles.bannerTitle, { color: colors.onPrimary }]}>{strings.notifications}</Text>
      </View>
      <NotificationPermissionPrompt />
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
          <Text accessibilityLabel={strings.displayedCallsCount + ": " + feed.calls.length}
            style={[styles.counterText, { color: colors.primary }]}>{feed.calls.length}</Text>
        </View>
        <View style={styles.sectionText}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>{strings.callsTitle}</Text>
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
    <CallCardsSkeleton />
  ) : feed.query.isError ? (
    <AppErrorNotice error={feed.query.error} context="calls" variant="screen"
      onRetry={() => void feed.query.refetch()} />
  ) : (
    <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border, padding: layout.cardPadding }]}>
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
      {feed.query.isFetchingNextPage && <CallCardsSkeleton count={2} />}
      {feed.query.hasNextPage && !feed.query.isFetchingNextPage && (
        <AppButton title={strings.more}
          variant="secondary"
          disabled={feed.query.isFetching}
          onPress={feed.loadMore} />
      )}
      {footer}
    </View>
  );

  return (
    <AppScreen>
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
          { paddingHorizontal: layout.contentPadding, maxWidth: layout.maxContentWidth },
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
    </AppScreen>
  );
}
function CallSeparator() {
  return <View style={{ height: spacing.md }} />;
}
const createStyles = (typography: import("../../shared/config/theme").AppTypography) => StyleSheet.create({
  content: {
    width: "100%", minWidth: 0, alignSelf: "center",
    paddingTop: spacing.md, paddingBottom: spacing.huge, flexGrow: 1,
  },
  headerSections: { gap: spacing.md, paddingBottom: spacing.md },
  banner: { minHeight: 64, borderRadius: radius.md, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.lg },
  bannerTitle: { fontSize: typeScale.title, ...typography.extraBold },
  sectionHeading: { flexDirection: "row-reverse", alignItems: "center", flexWrap: "wrap", gap: spacing.md, paddingTop: spacing.md },
  sectionText: { flex: 1, minWidth: 0, alignItems: "flex-end", gap: spacing.xs },
  sectionTitle: { fontSize: typeScale.sectionTitle, ...typography.extraBold, textAlign: "right", flexShrink: 1 },
  sectionDescription: { ...typography.regular, fontSize: typeScale.caption, textAlign: "right", flexShrink: 1 },
  filterTitle: { ...typography.regular, fontSize: typeScale.meta, textAlign: "right" },
  counter: { minWidth: 36, minHeight: 36, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  counterText: { fontSize: typeScale.meta, ...typography.extraBold },
  separator: { height: spacing.md },
  footer: { gap: spacing.md, paddingTop: spacing.lg },
  empty: { borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm },
  emptyTitle: { fontSize: typeScale.cardTitle, ...typography.extraBold, textAlign: "center" },
  emptyHint: { ...typography.regular, fontSize: typeScale.meta, textAlign: "center" },
});
