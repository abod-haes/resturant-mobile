import { useCallback, useMemo, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { employeeApi } from "../../shared/api";
import { employeeKeys } from "../../shared/api/query-keys";
import { CALLS_PAGE_SIZE, nextCallsCursor, toApiType, uniqueCalls } from "./model";
import type { CallFilter } from "./model";

export function useEmployeeCalls(employeeId: string | undefined) {
  const client = useQueryClient();
  const [filter, setFilter] = useState<CallFilter>("all");
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const query = useInfiniteQuery({
    queryKey: employeeKeys.calls(employeeId, toApiType(filter)),
    initialPageParam: null as string | null,
    enabled: Boolean(employeeId),
    queryFn: ({ pageParam, signal }) => employeeApi.listCalls({
      cursor: pageParam,
      type: toApiType(filter),
      limit: CALLS_PAGE_SIZE,
    }, signal),
    getNextPageParam: nextCallsCursor,
  });
  const calls = useMemo(() => uniqueCalls(query.data?.pages ?? []), [query.data?.pages]);
  const { hasNextPage, isFetching, fetchNextPage } = query;
  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetching || !employeeId) return;
    void fetchNextPage();
  }, [hasNextPage, isFetching, fetchNextPage, employeeId]);
  const refresh = useCallback(async () => {
    if (!employeeId || manualRefreshing) return;
    setManualRefreshing(true);
    try {
      // Reset only this type's infinite list; never re-fetch every old page.
      // Current filter is part of the key, so changing it uses an independent cache.
      await client.resetQueries({ queryKey: employeeKeys.calls(employeeId, toApiType(filter)), exact: true });
    } finally {
      setManualRefreshing(false);
    }
  }, [client, employeeId, filter, manualRefreshing]);

  return {
    query,
    calls,
    filter,
    setFilter,
    refreshing: manualRefreshing,
    refresh,
    loadMore,
  };
}
