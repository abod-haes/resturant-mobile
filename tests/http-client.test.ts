import { describe, expect, it, vi } from "vitest";
import { HttpClient } from "../src/shared/api/http/client";
import { ApiError, describeApiError, parseApiFailure, canRetryRead } from "../src/shared/api/errors";

const response = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), { status });

describe("HTTP client phase 1", () => {
  const base = "https://api.example.test/api/v1";
  it("enforces an HTTPS API v1 base URL without credentials or queries", async () => {
    await expect(new HttpClient(base + "?token=x").publicRequest("GET", "/auth/me"))
      .rejects.toMatchObject({ code: "CONFIG_ERROR" });
    await expect(new HttpClient("https://api.example.test").publicRequest("GET", "/auth/me"))
      .rejects.toMatchObject({ code: "CONFIG_ERROR" });
  });
  it("preserves code, requestId, safe details and dynamic cooldown", () => {
    const error = parseApiFailure({
      error: { code: "COOLDOWN_ACTIVE", message: "technical private error", details: { retryAfterSeconds: 7 } },
      requestId: "trace-123",
    }, 429);
    expect(error).toMatchObject({ status: 429, requestId: "trace-123", retryAfterSeconds: 7 });
    expect(describeApiError(error)).toContain("7");
    expect(describeApiError(error)).not.toContain("private");
  });
  it("never attaches a bearer to auth public requests", async () => {
    const fetcher = vi.fn(async (_url: string, _init: RequestInit) => response({ data: {} }));
    const client = new HttpClient(base, fetcher);
    client.setAccessToken("private-jwt");
    await client.publicRequest("POST", "/auth/login", { body: { username: "waiter" } });
    expect((fetcher.mock.calls[0][1].headers as Record<string, string>).Authorization).toBeUndefined();
  });
  it("refreshes just once for two simultaneous 401 failures", async () => {
    const fetcher = vi.fn(async (_url: string, init: RequestInit) => {
      const auth = (init.headers as Record<string, string>).Authorization;
      return auth === "Bearer expired"
        ? response({ error: { code: "UNAUTHORIZED", message: "expired" }, requestId: "x" }, 401)
        : response({ data: { ok: true } });
    });
    const client = new HttpClient(base, fetcher);
    client.setAccessToken("expired");
    const renew = vi.fn(async () => { client.setAccessToken("fresh"); });
    client.setReauthenticate(renew);
    await Promise.all([client.authorized("GET", "/employee/calls"), client.authorized("GET", "/employee/calls")]);
    expect(renew).toHaveBeenCalledTimes(1);
  });
  it("never refreshes a second time when a delayed stale 401 arrives", async () => {
    let requests = 0;
    const fetcher = vi.fn(async (_url: string, init: RequestInit) => {
      const auth = (init.headers as Record<string, string>).Authorization;
      if (auth === "Bearer expired" && requests++ > 0)
        await new Promise((resolve) => setTimeout(resolve, 20));
      return auth === "Bearer expired"
        ? response({ error: { code: "UNAUTHORIZED", message: "expired" }, requestId: "x" }, 401)
        : response({ data: true });
    });
    const client = new HttpClient(base, fetcher);
    client.setAccessToken("expired");
    const renew = vi.fn(async () => { client.setAccessToken("fresh"); });
    client.setReauthenticate(renew);
    await Promise.all([client.authorized("GET", "/a"), client.authorized("GET", "/b")]);
    expect(renew).toHaveBeenCalledTimes(1);
  });
  it("cancels a pre-aborted request without calling fetch", async () => {
    const fetcher = vi.fn(async () => response(null));
    const client = new HttpClient(base, fetcher);
    const abort = new AbortController(); abort.abort();
    await expect(client.publicRequest("GET", "/test", { signal: abort.signal }))
      .rejects.toMatchObject({ code: "CANCELLED" });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("distinguishes 204, malformed JSON, and a failed server", async () => {
    let result = new Response(null, { status: 204 });
    const client = new HttpClient(base, async () => result);
    await expect(client.publicRequest("DELETE", "/resource")).resolves.toBeNull();
    result = new Response("<html>invalid</html>");
    await expect(client.publicRequest("GET", "/resource")).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
    result = response({ error: { code: "INTERNAL_ERROR", message: "secret" }, requestId: "a" }, 503);
    await expect(client.publicRequest("GET", "/resource")).rejects.toMatchObject({ status: 503 });
  });

  it("maps non-2xx responses without exposing server messages", async () => {
    for (const [status, code] of [[403, "PLAN_FEATURE_DISABLED"], [404, "NOT_FOUND"], [409, "SHIFT_ALREADY_ACTIVE"]] as const) {
      const client = new HttpClient(base, async () => response({
        error: { code, message: "internal: employees.password_hash leaked" },
        requestId: "safe-correlation-id",
      }, status));
      const failure = await client.publicRequest("GET", "/employee/calls").catch((e: unknown) => e);
      expect(failure).toMatchObject({ status, code, requestId: "safe-correlation-id" });
      expect(describeApiError(failure)).not.toContain("password_hash");
    }
  });
  it("converts network failures to retryable errors", async () => {
    const client = new HttpClient(base, async () => { throw new TypeError("Network request failed"); });
    const failure = await client.publicRequest("GET", "/employee/calls").catch((e: unknown) => e);
    expect(failure).toMatchObject({ code: "NETWORK_ERROR", retryable: true });
    expect(describeApiError(failure)).not.toContain("TypeError");
  });
  it("triggers mandatory password routing only on the correct 403 code", async () => {
    let result = response({ error: { code: "PASSWORD_CHANGE_REQUIRED", message: "must change" }, requestId: "change" }, 403);
    const client = new HttpClient(base, async () => result);
    client.setAccessToken("access");
    const notify = vi.fn();
    client.setPasswordChangeRequired(notify);
    await expect(client.authorized("GET", "/employee/shifts/current"))
      .rejects.toMatchObject({ code: "PASSWORD_CHANGE_REQUIRED", status: 403 });
    expect(notify).toHaveBeenCalledTimes(1);
    result = response({ error: { code: "FORBIDDEN", message: "not allowed" }, requestId: "other" }, 403);
    await expect(client.authorized("GET", "/employee/shifts/current")).rejects.toMatchObject({ status: 403 });
    expect(notify).toHaveBeenCalledTimes(1);
  });
  it("returns TIMEOUT on an aborted stalled fetch and retries safe reads only", async () => {
    const client = new HttpClient(base, async (_url, init) => new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    }));
    await expect(client.publicRequest("GET", "/resource", { timeoutMs: 5 }))
      .rejects.toMatchObject({ code: "TIMEOUT" });
    expect(canRetryRead(0, new ApiError("TIMEOUT", 0, "timeout"))).toBe(true);
    expect(canRetryRead(2, new ApiError("TIMEOUT", 0, "timeout"))).toBe(false);
    expect(canRetryRead(0, new ApiError("SHIFT_ALREADY_ACTIVE", 409, "conflict"))).toBe(false);
  });
});
