import type { CallPage, Department, ServiceCall } from "../../shared/api/types";

/** No client-side pagination or filtering of a single page. */
export const CALLS_PAGE_SIZE = 20;
export type CallFilter = "all" | Department;

export function toApiType(filter: CallFilter): Department | undefined {
  return filter === "all" ? undefined : filter;
}

/** hasMore with no nextCursor is a broken contract, never request page one repeatedly. */
export function nextCallsCursor(page: CallPage): string | undefined {
  return page.meta.hasMore && page.meta.nextCursor
    ? page.meta.nextCursor : undefined;
}

/** The same call may cross cursor boundaries while new calls are being inserted. */
export function uniqueCalls(pages: readonly CallPage[]): ServiceCall[] {
  const seen = new Set<string>();
  const calls: ServiceCall[] = [];
  for (const page of pages) {
    for (const call of page.data) {
      if (seen.has(call.id)) continue;
      seen.add(call.id);
      calls.push(call);
    }
  }
  return calls;
}
