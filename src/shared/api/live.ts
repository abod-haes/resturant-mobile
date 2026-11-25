import { z } from "zod";
import { ApiError } from "./errors";
import { httpClient, validateApiBaseUrl } from "./http/client";
import { subscribeEmployeeEvents } from "./employee-events";
import { callSchema, employeeSchema, pageMetaSchema, pushDeviceSchema, sessionSchema, shiftSchema, restaurantIdentitySchema } from "./types";
import type { EmployeeApi, CallPageQuery, LoginInput, ChangePasswordInput } from "./types";

function unwrap<T>(payload: unknown, schema: z.ZodType<T>): T {
  const result = z.object({ data: schema }).safeParse(payload);
  if (!result.success) throw new ApiError("INVALID_RESPONSE", 0, "Unexpected API envelope");
  return result.data.data;
}
export const liveEmployeeApi: EmployeeApi = {
  setAccessToken: (token) => httpClient.setAccessToken(token),
  setReauthenticate: (handler) => httpClient.setReauthenticate(handler),
  setPasswordChangeRequired: (handler) => httpClient.setPasswordChangeRequired(handler),
  async login(input: LoginInput) {
    return unwrap(await httpClient.publicRequest("POST", "/auth/login", {
      body: { ...input, client: "mobile" },
    }), sessionSchema);
  },
  async refresh(refreshToken: string) {
    return unwrap(await httpClient.publicRequest("POST", "/auth/refresh", {
      body: { refreshToken },
    }), sessionSchema);
  },
  async getRestaurantIdentity(signal) {
    return unwrap(await httpClient.authorized("GET", "/auth/restaurant-identity", { signal }), restaurantIdentitySchema);
  },
  async getMe() {
    return unwrap(await httpClient.authorized("GET", "/auth/me"), employeeSchema);
  },
  async logout(refreshToken: string) {
    unwrap(await httpClient.publicRequest("POST", "/auth/logout", {
      body: { refreshToken },
    }), z.object({ loggedOut: z.boolean() }));
    // SessionProvider owns local token cleanup, avoiding late logout clearing a new session.
  },
  async changePassword(input: ChangePasswordInput) {
    unwrap(await httpClient.authorized("POST", "/auth/change-password", {
      body: input,
    }), z.object({ changed: z.literal(true) }));
    httpClient.setAccessToken(null);
  },
  async getCurrentShift(signal?: AbortSignal) {
    return unwrap(await httpClient.authorized("GET", "/employee/shifts/current", { signal }), shiftSchema.nullable());
  },
  async startShift() {
    return unwrap(await httpClient.authorized("POST", "/employee/shifts/start"), shiftSchema);
  },
  async endShift() {
    return unwrap(await httpClient.authorized("POST", "/employee/shifts/end"), shiftSchema);
  },
  async listCalls(query: CallPageQuery = {}, signal?: AbortSignal) {
    const params = new URLSearchParams();
    if (query.cursor) params.set("cursor", query.cursor);
    if (query.type) params.set("type", query.type);
    params.set("limit", String(Math.min(100, Math.max(1, query.limit ?? 20))));
    const result = z.object({ data: z.array(callSchema), meta: pageMetaSchema })
      .safeParse(await httpClient.authorized("GET", "/employee/calls?" + params.toString(), { signal }));
    if (!result.success) throw new ApiError("INVALID_RESPONSE", 0, "Unexpected call history");
    return result.data;
  },
  async listDevices() {
    return unwrap(await httpClient.authorized("GET", "/employee/devices"), z.array(pushDeviceSchema));
  },
  async registerDevice(input) {
    return unwrap(await httpClient.authorized("POST", "/employee/devices", { body: input }), pushDeviceSchema);
  },
  subscribeEvents(callbacks) {
    const connection = subscribeEmployeeEvents({
      url: validateApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL) + "/employee/events?after=0",
      // Load native streaming transport only when an SSE session starts.
      // Plain HTTP adapter imports remain compatible with Node/Vitest.
      fetcher: async (url, init) => {
        const { fetch: expoFetch } = await import("expo/fetch");
        return expoFetch(url, init);
      },
      getToken: () => httpClient.getRealtimeAccessToken(),
      refreshToken: (token) => httpClient.refreshRealtimeAccessToken(token),
      onForbidden: (payload) => httpClient.acceptRealtimeForbidden(payload),
    }, callbacks);
    return () => connection.stop();
  },
  async unregisterDevice(id) {
    if (!z.string().uuid().safeParse(id).success)
      throw new ApiError("VALIDATION_ERROR", 400, "Invalid device ID");
    unwrap(await httpClient.authorized("DELETE", "/employee/devices/" + encodeURIComponent(id)),
      z.object({ unregistered: z.literal(true) }));
  },
};
