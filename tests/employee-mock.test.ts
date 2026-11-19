import { beforeEach, describe, expect, it } from "vitest";
import { mockControl } from "../src/shared/mock/engine";
import { mockEmployeeApi } from "../src/shared/api/mock";

describe("employee mock adapter", () => {
  beforeEach(() => {
    mockControl.reset();
    mockEmployeeApi.setAccessToken(null);
  });
  it("blocks requests without a demo session", async () => {
    await expect(mockEmployeeApi.getMe()).rejects.toMatchObject({ status: 401 });
  });
  it("restores employee identity using the refresh credential", async () => {
    const result = await mockEmployeeApi.login({ username: "waiter.demo", password: "only-for-mock" });
    mockEmployeeApi.setAccessToken(null);
    const refreshed = await mockEmployeeApi.refresh(result.refreshToken);
    expect(refreshed.user).toMatchObject({
      id: "emp-1", role: "EMPLOYEE", branchId: "branch-1", department: "waiter",
      mustChangePassword: false,
    });
  });
  it("rejects unknown refresh credentials", async () => {
    await expect(mockEmployeeApi.refresh("bad-token")).rejects.toMatchObject({ status: 401 });
  });
  it("starts and ends the logged-in employee shift", async () => {
    await mockEmployeeApi.login({ username: "hookah.demo", password: "only-for-mock" });
    expect(await mockEmployeeApi.getCurrentShift()).toBeNull();
    const shift = await mockEmployeeApi.startShift();
    expect(shift.userId).toBe("emp-2");
    expect(shift.branchId).toBe("branch-1");
    expect(shift.department).toBe("hookah");
    expect(Date.parse(shift.autoEndAt)).toBeGreaterThan(Date.parse(shift.startedAt));
    expect(await mockEmployeeApi.getCurrentShift()).toMatchObject({ id: shift.id });
    const ended = await mockEmployeeApi.endShift();
    expect(ended.endedAt).not.toBeNull();
    expect(await mockEmployeeApi.getCurrentShift()).toBeNull();
  });
  it("filters calls by branch and department", async () => {
    await mockEmployeeApi.login({ username: "hookah.demo", password: "only-for-mock" });
    const calls = await mockEmployeeApi.listCalls();
    expect(calls.data.every((call) => call.branchId === "branch-1" && call.type === "hookah")).toBe(true);
  });
  it("returns paginated calls with a cursor", async () => {
    const state = mockControl.snapshot();
    mockControl.setState({
      ...state,
      calls: [
        ...state.calls,
        { ...state.calls[0], id: "call-2", createdAt: "2026-11-18T13:00:00Z" },
      ],
    });
    await mockEmployeeApi.login({ username: "waiter.demo", password: "only-for-mock" });
    const first = await mockEmployeeApi.listCalls({ limit: 1 });
    expect(first.data).toHaveLength(1);
    expect(first.meta.hasMore).toBe(true);
    const second = await mockEmployeeApi.listCalls({ cursor: first.meta.nextCursor, limit: 1 });
    expect(second.data).toHaveLength(1);
    expect(second.data[0].id).not.toBe(first.data[0].id);
  });
});
