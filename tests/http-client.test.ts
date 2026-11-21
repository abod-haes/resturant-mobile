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
