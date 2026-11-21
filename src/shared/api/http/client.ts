import { ApiError, parseApiFailure } from "../errors";

export type HttpOptions = { body?: unknown; signal?: AbortSignal; timeoutMs?: number };
export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
const TIMEOUT_MS = 15_000;

export function validateApiBaseUrl(value?: string): string {
  if (!value) throw new ApiError("CONFIG_ERROR", 0, "Missing API base URL");
  let url: URL;
  try { url = new URL(value); } catch {
    throw new ApiError("CONFIG_ERROR", 0, "Invalid API base URL");
  }
  const development = typeof __DEV__ !== "undefined" && __DEV__;
  if ((url.protocol !== "https:" && !(development && url.protocol === "http:")) ||
    url.username || url.password || url.search || url.hash ||
    url.pathname.replace(/\/+$/, "") !== "/api/v1") {
    throw new ApiError("CONFIG_ERROR", 0, "API URL must include /api/v1 exactly once");
  }
  return url.origin + "/api/v1";
}

/** Reusable transport: owns HTTP, timeout, bearer renewal; not domain/UI state. */
export class HttpClient {
  private accessToken: string | null = null;
  private reauthenticate: (() => Promise<void>) | null = null;
  private refreshing: Promise<void> | null = null;
  private onPasswordChangeRequired: (() => void) | null = null;

  constructor(
    private readonly baseUrl: string | undefined = process.env.EXPO_PUBLIC_API_BASE_URL,
    private readonly fetcher: Fetcher = (url, init) => fetch(url, init),
  ) {}
  setAccessToken(value: string | null): void { this.accessToken = value; }
  /** Used exclusively by the SSE transport; never log or place access tokens in URLs. */
  getRealtimeAccessToken(): string | null { return this.accessToken; }
  async refreshRealtimeAccessToken(failedToken: string): Promise<void> {
    if (this.accessToken === failedToken) await this.refreshOnce();
    if (!this.accessToken || this.accessToken === failedToken)
      throw new ApiError("UNAUTHORIZED", 401, "Realtime authentication failed");
  }
  acceptRealtimeForbidden(payload: unknown): void {
    const failure = parseApiFailure(payload, 403);
    if (failure.code === "PASSWORD_CHANGE_REQUIRED") this.onPasswordChangeRequired?.();
  }
  setReauthenticate(callback: (() => Promise<void>) | null): void { this.reauthenticate = callback; }
  setPasswordChangeRequired(callback: (() => void) | null): void {
    this.onPasswordChangeRequired = callback;
  }

  private refreshOnce(): Promise<void> {
    if (!this.reauthenticate) throw new ApiError("UNAUTHORIZED", 401, "Missing session");
    if (!this.refreshing) {
      const callback = this.reauthenticate;
      this.refreshing = Promise.resolve().then(() => callback()).finally(() => {
        this.refreshing = null;
      });
    }
    return this.refreshing;
  }

  async publicRequest(method: string, path: string, options: HttpOptions = {}): Promise<unknown> {
    // Login/refresh/logout must never send an expired bearer or recurse on 401.
    return this.send(method, path, null, options);
  }
  async authorized(method: string, path: string, options: HttpOptions = {}): Promise<unknown> {
    const original = this.accessToken;
    if (!original) throw new ApiError("UNAUTHORIZED", 401, "Missing session");
    try { return await this.send(method, path, original, options); }
    catch (error) {
      if (error instanceof ApiError && error.status === 403 && error.code === "PASSWORD_CHANGE_REQUIRED") {
        this.onPasswordChangeRequired?.();
        throw error;
      }
      if (!(error instanceof ApiError) || error.status !== 401 || options.signal?.aborted) throw error;
      // Delayed 401 arriving after another refresh must NOT rotate twice.
      if (this.accessToken === original) await this.refreshOnce();
      const fresh = this.accessToken;
      if (!fresh || fresh === original) throw new ApiError("UNAUTHORIZED", 401, "Session expired");
      return this.send(method, path, fresh, options);
    }
  }

  private async send(method: string, path: string, bearer: string | null, options: HttpOptions): Promise<unknown> {
    const base = validateApiBaseUrl(this.baseUrl);
    if (!path.startsWith("/") || path.startsWith("//") || /https?:\/\//i.test(path))
      throw new ApiError("CONFIG_ERROR", 0, "Invalid API path");
    if (options.signal?.aborted) throw new ApiError("CANCELLED", 0, "Request cancelled");
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, options.timeoutMs ?? TIMEOUT_MS);
    try {
      const response = await this.fetcher(base + path, {
        method,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(bearer ? { Authorization: "Bearer " + bearer } : {}),
        },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      });
      if (response.status === 204 || response.status === 205) return null;
      const raw = await response.text();
      let payload: unknown = null;
      if (raw) {
        try { payload = JSON.parse(raw) as unknown; }
        catch { throw new ApiError("INVALID_RESPONSE", response.status, "Non-JSON response"); }
      }
      if (!response.ok) throw parseApiFailure(payload, response.status);
      return payload;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (controller.signal.aborted)
        throw timedOut ? new ApiError("TIMEOUT", 0, "Request timed out")
          : new ApiError("CANCELLED", 0, "Request cancelled");
      throw new ApiError("NETWORK_ERROR", 0, "Network request failed");
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abort);
    }
  }
}
export const httpClient = new HttpClient();
