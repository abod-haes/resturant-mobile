import { beforeEach, describe, expect, it } from "vitest";
import { mockControl } from "../src/shared/mock/engine";
import { mockEmployeeApi } from "../src/shared/api/mock";
import { CALLS_PAGE_SIZE, nextCallsCursor, toApiType, uniqueCalls } from "../src/features/calls/model";
import type { CallPage, ServiceCall } from "../src/shared/api/types";

const call = (id: string, type: "waiter" | "hookah" = "waiter"): ServiceCall => ({
  id, branchId: "branch-1", tableId: "table-1", type,
  deliveryState: "queued", recipientsCount: 1, ownerAlerted: false,
  createdAt: "2026-11-20T11:00:00.000Z",
});
const page = (items: ServiceCall[], nextCursor: string | null, hasMore: boolean): CallPage => ({
  data: items, meta: { nextCursor, hasMore },
});

describe("employee call feed pagination model", () => {
  it("maps the all filter to an unfiltered API request", () => {
    expect(toApiType("all")).toBeUndefined();
    expect(toApiType("waiter")).toBe("waiter");
    expect(toApiType("hookah")).toBe("hookah");
    expect(CALLS_PAGE_SIZE).toBe(20);
  });
  it("treats opaque cursors as provided, and never loops for a broken hasMore", () => {
    expect(nextCallsCursor(page([call("a")], "opaque+/=", true))).toBe("opaque+/=");
    expect(nextCallsCursor(page([call("a")], null, true))).toBeUndefined();
    expect(nextCallsCursor(page([call("a")], "opaque", false))).toBeUndefined();
  });
  it("deduplicates calls across changing cursor boundaries in stable server order", () => {
    const all = uniqueCalls([
      page([call("new"), call("a")], "one", true),
      page([call("a"), call("b", "hookah")], null, false),
    ]);
    expect(all.map((item) => item.id)).toEqual(["new", "a", "b"]);
    expect(all[2].type).toBe("hookah");
    expect(uniqueCalls([])).toEqual([]);
  });
});

describe("mock adapter server-side filtered cursors", () => {
  beforeEach(() => {
    mockControl.reset();
    mockEmployeeApi.setAccessToken(null);
  });
  it("returns 20 then 10 assigned calls and isolates type-filtered paging", async () => {
    const state = mockControl.snapshot();
    const example = state.calls[0];
    const newCalls = Array.from({ length: 60 }, (_, index) => ({
      ...example,
      id: "phase3-call-" + index,
      type: index % 2 ? "hookah" as const : "waiter" as const,
      createdAt: new Date(Date.UTC(2026, 10, 18, 12, index)).toISOString(),
    }));
    mockControl.setState({ ...state, calls: [...state.calls, ...newCalls] });
    await mockEmployeeApi.login({ username: "waiter.demo", password: "demo-only" });
    const first = await mockEmployeeApi.listCalls({ type: "waiter", limit: 20 });
    expect(first.data).toHaveLength(20);
    expect(first.data.every(item => item.type === "waiter")).toBe(true);
    expect(first.meta.hasMore).toBe(true);
    const second = await mockEmployeeApi.listCalls({
      type: "waiter", limit: 20, cursor: first.meta.nextCursor,
    });
    expect(second.data.length).toBeGreaterThan(0);
    expect(second.data.every(item => item.type === "waiter")).toBe(true);
    expect(uniqueCalls([first, second]).length).toBe(first.data.length + second.data.length);
    await expect(mockEmployeeApi.listCalls({ type: "waiter", cursor: "garbage", limit: 20 }))
      .rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});
