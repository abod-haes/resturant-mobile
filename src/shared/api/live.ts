import { z } from "zod";
import { ApiError } from "./errors";
import {
  callSchema, employeeSchema, pageMetaSchema, sessionSchema, shiftSchema,
} from "./types";
import type { EmployeeApi, CallPageQuery, LoginInput, ChangePasswordInput } from "./types";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
const TIMEOUT_MS = 15000;
let token: string | null = null;
let reauthenticate: (() => Promise<void>) | null = null;

async function request(method: string, path: string, body?: unknown): Promise<unknown> {
  if (!BASE_URL || !/^https?:\/\//i.test(BASE_URL))
    throw new ApiError("CONFIG_ERROR", 0, "لم يتم إعداد عنوان API بشكل صحيح.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(BASE_URL + path, {
      method,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const raw = await response.text();
    let parsed: unknown = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw) as unknown;
      } catch {
        throw new ApiError("INVALID_RESPONSE", response.status, "استجابة غير صالحة من الخادم.");
      }
    }

    if (!response.ok) {
      const error = z.object({
        error: z.object({ code: z.string(), message: z.string() }),
        requestId: z.string().optional(),
      }).safeParse(parsed);
      if (error.success)
        throw new ApiError(error.data.error.code, response.status, error.data.error.message, error.data.requestId);
      throw new ApiError("HTTP_ERROR", response.status, "فشل الطلب.");
    }
    return parsed;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError")
      throw new ApiError("TIMEOUT", 0, "انتهت مهلة الاتصال.");
    throw new ApiError("NETWORK_ERROR", 0, "تعذر الاتصال بالخادم.");
  } finally {
    clearTimeout(timeout);
  }
}

async function authorized(method: string, path: string, body?: unknown): Promise<unknown> {
  if (!token) throw new ApiError("UNAUTHORIZED", 401, "الجلسة غير صالحة.");
  try {
    return await request(method, path, body);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || !reauthenticate) throw error;
    await reauthenticate();
    if (!token) throw new ApiError("UNAUTHORIZED", 401, "انتهت الجلسة.");
    return request(method, path, body);
  }
}

function unwrap<T>(payload: unknown, schema: z.ZodType<T>): T {
  const result = z.object({ data: schema }).safeParse(payload);
  if (!result.success)
    throw new ApiError("INVALID_RESPONSE", 0, "صيغة استجابة API لا تطابق العقد.");
  return result.data.data;
}

export const liveEmployeeApi: EmployeeApi = {
  setAccessToken(next) { token = next; },
  setReauthenticate(handler) { reauthenticate = handler; },
  async login(input: LoginInput) {
    return unwrap(await request("POST", "/auth/login", { ...input, client: "mobile" }), sessionSchema);
  },
  async refresh(refreshToken: string) {
    return unwrap(await request("POST", "/auth/refresh", { refreshToken }), sessionSchema);
  },
  async getMe() {
    return unwrap(await authorized("GET", "/auth/me"), employeeSchema);
  },
  async logout(refreshToken: string) {
    unwrap(await request("POST", "/auth/logout", { refreshToken }), z.object({ loggedOut: z.boolean() }));
    token = null;
  },
  async changePassword(input: ChangePasswordInput) {
    unwrap(await authorized("POST", "/auth/change-password", input), z.object({ changed: z.literal(true) }));
    token = null;
  },
  async getCurrentShift() {
    return unwrap(await authorized("GET", "/employee/shifts/current"), shiftSchema.nullable());
  },
  async startShift() {
    return unwrap(await authorized("POST", "/employee/shifts/start"), shiftSchema);
  },
  async endShift() {
    await authorized("POST", "/employee/shifts/end");
  },
  async listCalls(query: CallPageQuery = {}) {
    const params: string[] = [];
    if (query.cursor) params.push("cursor=" + encodeURIComponent(query.cursor));
    params.push("limit=" + String(Math.min(100, Math.max(1, query.limit ?? 20))));
    const parsed = z.object({
      data: z.array(callSchema),
      meta: pageMetaSchema,
    }).safeParse(await authorized("GET", "/employee/calls?" + params.join("&")));
    if (!parsed.success)
      throw new ApiError("INVALID_RESPONSE", 0, "صيغة سجل الاستدعاءات لا تطابق العقد.");
    return parsed.data;
  },
};
