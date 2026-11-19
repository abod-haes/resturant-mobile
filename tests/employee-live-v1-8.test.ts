import { beforeEach, describe, expect, it, vi } from "vitest";
import { callSchema, shiftSchema } from "../src/shared/api/types";

const shift = {
  id: "shift-1",
  userId: "employee-1",
  branchId: "branch-1",
  department: "waiter",
  startedAt: "2026-11-19T10:00:00.000Z",
  autoEndAt: "2026-11-19T22:00:00.000Z",
  endedAt: null,
};
const call = {
  id: "call-1",
  branchId: "branch-1",
  tableId: "table-1",
  type: "waiter",
  deliveryState: "queued",
  recipientsCount: 1,
  ownerAlerted: false,
  createdAt: "2026-11-19T11:00:00.000Z",
};
function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
async function api() {
  const client = (await import("../src/shared/api/live")).liveEmployeeApi;
  client.setAccessToken("mock-jwt-from-auth");
  return client;
}

describe("backend v1.8 employee DTO contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("EXPO_PUBLIC_API_BASE_URL", "https://api.example.test/api/v1");
  });

  it("parses actual shift fields instead of legacy employeeId", () => {
    expect(shiftSchema.parse(shift)).toMatchObject({ userId: "employee-1" });
    expect(shiftSchema.safeParse({ ...shift, employeeId: "employee-1", userId: undefined }).success).toBe(false);
  });

  it("returns the shift from start, current and end", async () => {
    const send = vi.fn(async (url: string) => response({
      data: url.includes("/end") ? { ...shift, endedAt: "2026-11-19T12:00:00.000Z" } : shift,
    }));
    vi.stubGlobal("fetch", send);
    const client = await api();
    await expect(client.startShift()).resolves.toMatchObject({ userId: "employee-1" });
    await expect(client.getCurrentShift()).resolves.toMatchObject({ autoEndAt: shift.autoEndAt });
    await expect(client.endShift()).resolves.toMatchObject({ endedAt: "2026-11-19T12:00:00.000Z" });
  });

  it("handles inactive/auto-ended current shift as null", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response({ data: null })));
    await expect((await api()).getCurrentShift()).resolves.toBeNull();
  });

  it("requires delivery fields and never assumes table labels exist", () => {
    expect(callSchema.parse(call)).toMatchObject({ tableId: "table-1", deliveryState: "queued" });
    expect(callSchema.safeParse({ id: "call-1", tableId: "table-1" }).success).toBe(false);
  });

  it("sends optional type and opaque cursor and reads the response envelope", async () => {
    const send = vi.fn(async (_url: string) => response({
      data: [call], meta: { nextCursor: "opaque-cursor", hasMore: true },
    }));
    vi.stubGlobal("fetch", send);
    const client = await api();
    const result = await client.listCalls({ limit: 20, type: "waiter", cursor: "p+q/=" });
    expect(result.data[0].tableId).toBe("table-1");
    const url = send.mock.calls[0][0];
    expect(url).toContain("type=waiter");
    expect(url).toContain("cursor=p%2Bq%2F%3D");
    expect(url).toContain("limit=20");
  });
});
