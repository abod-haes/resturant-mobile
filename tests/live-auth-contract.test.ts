import { beforeEach, describe, expect, it, vi } from "vitest";

const person = {
  id: "employee-1",
  role: "EMPLOYEE",
  restaurantId: "restaurant-1",
  branchId: "branch-1",
  department: "waiter",
  mustChangePassword: false,
};
const session = {
  accessToken: "new-access",
  refreshToken: "rotated-secret",
  expiresAt: "2026-11-19T23:00:00.000Z",
  user: person,
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json" },
});
async function getClient() {
  return (await import("../src/shared/api/live")).liveEmployeeApi;
}

describe("backend auth v1.3 mobile contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("EXPO_PUBLIC_API_BASE_URL", "https://api.example.test/api/v1");
  });
  it("sends mobile flag at login, validates refreshToken and never uses cookies", async () => {
    const send = vi.fn(async (_url: string, init: RequestInit) => json({ data: session }));
    vi.stubGlobal("fetch", send);
    const api = await getClient();
    const loggedIn = await api.login({ username: "waiter", password: "secret" });
    expect(loggedIn.refreshToken).toBe("rotated-secret");
    const args = send.mock.calls[0];
    expect(JSON.parse(String(args[1].body))).toMatchObject({
      username: "waiter", password: "secret", client: "mobile",
    });
    expect(args[1].credentials).toBeUndefined();
  });
  it("rejects a web login response that omits mobile refreshToken", async () => {
    const { refreshToken: unused, ...webSession } = session;
    void unused;
    vi.stubGlobal("fetch", vi.fn(async () => json({ data: webSession })));
    const api = await getClient();
    await expect(api.login({ username: "waiter", password: "secret" }))
      .rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
  it("sends the mobile rotating refresh token in the body", async () => {
    const send = vi.fn(async (_url: string, _init: RequestInit) => json({ data: session }));
    vi.stubGlobal("fetch", send);
    const api = await getClient();
    await api.refresh("previous-refresh");
    expect(JSON.parse(String(send.mock.calls[0][1].body))).toEqual({ refreshToken: "previous-refresh" });
    expect(send.mock.calls[0][0]).toContain("/auth/refresh");
  });
  it("only invokes the reauthentication handler once for concurrent 401s", async () => {
    const send = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toContain("/auth/me");
      const auth = (init.headers as Record<string, string>).Authorization;
      if (auth === "Bearer expired")
        return json({ error: { code: "UNAUTHORIZED", message: "Expired" }, requestId: "one" }, 401);
      return json({ data: person });
    });
    vi.stubGlobal("fetch", send);
    const api = await getClient();
    api.setAccessToken("expired");
    const renewal = vi.fn(async () => { api.setAccessToken("fresh"); });
    api.setReauthenticate(renewal);
    const results = await Promise.all([api.getMe(), api.getMe()]);
    expect(results.map((item) => item.id)).toEqual(["employee-1", "employee-1"]);
    expect(renewal).toHaveBeenCalledTimes(1);
  });
  it("handles backend forced password change and 401 without leaking user data", async () => {
    const send = vi.fn(async (_url: string, _init: RequestInit) =>
      json({ error: { code: "PASSWORD_CHANGE_REQUIRED", message: "Change password" }, requestId: "p" }, 403));
    vi.stubGlobal("fetch", send);
    const api = await getClient();
    api.setAccessToken("valid");
    await expect(api.getCurrentShift()).rejects.toMatchObject({ code: "PASSWORD_CHANGE_REQUIRED", status: 403 });
  });
});
