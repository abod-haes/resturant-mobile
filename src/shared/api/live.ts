import { z } from "zod";
import { ApiError } from "./errors";
import {
  callSchema, employeeSchema, pageMetaSchema, sessionSchema, shiftSchema,
} from "./types";
import type { EmployeeApi, CallPageQuery, LoginInput } from "./types";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
const TIMEOUT_MS = 15000;
let token: string | null = null;

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

function unwrap<T>(payload: unknown, schema: z.ZodType<T>): T {
  const result = z.object({ data: schema }).safeParse(payload);
  if (!result.success)
    throw new ApiError("INVALID_RESPONSE", 0, "صيغة استجابة API لا تطابق العقد.");
  return result.data.data;
}

export const liveEmployeeApi: EmployeeApi = {
  setAccessToken(next) { token = next; },
  async login(input: LoginInput) {
    return unwrap(await request("POST", "/auth/login", input), sessionSchema);
  },
  async getMe() {
    return unwrap(await request("GET", "/auth/me"), employeeSchema);
  },
  async logout() {
    await request("POST", "/auth/logout");
    token = null;
  },
  async getCurrentShift() {
    return unwrap(await request("GET", "/employee/shifts/current"), shiftSchema.nullable());
  },
  async startShift() {
    return unwrap(await request("POST", "/employee/shifts/start"), shiftSchema);
  },
  async endShift() {
    await request("POST", "/employee/shifts/end");
  },
  async listCalls(query: CallPageQuery = {}) {
    const params: string[] = [];
    if (query.cursor) params.push("cursor=" + encodeURIComponent(query.cursor));
    params.push("limit=" + String(Math.min(100, Math.max(1, query.limit ?? 20))));
    const parsed = z.object({
      data: z.array(callSchema),
      meta: pageMetaSchema,
    }).safeParse(await request("GET", "/employee/calls?" + params.join("&")));
    if (!parsed.success)
      throw new ApiError("INVALID_RESPONSE", 0, "صيغة سجل الاستدعاءات لا تطابق العقد.");
    return parsed.data;
  },
};
