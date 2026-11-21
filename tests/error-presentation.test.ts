import { describe, expect, it } from "vitest";
import { ApiError, parseApiFailure } from "../src/shared/api/errors";
import { getErrorPresentation, normalizeApiError } from "../src/shared/api/error-presentation";
import { feedbackText, formatFeedback } from "../src/shared/i18n/feedback";

const failure = (code: string, status: number, details?: unknown, requestId?: string) =>
  new ApiError(code, status, "INTERNAL_PASSWORD_HASH_SECRET", requestId, details);

describe("phase 2 localized safe error feedback", () => {
  it("distinguishes login credentials from an expired API session", () => {
    const error = failure("UNAUTHORIZED", 401);
    expect(getErrorPresentation(error, { context: "login" })).toMatchObject({
      message: feedbackText("credentials"), action: "none",
    });
    expect(getErrorPresentation(error, { context: "calls" })).toMatchObject({
      message: feedbackText("sessionExpired"), action: "login",
    });
  });
  it("handles mandatory password change and shift conflicts", () => {
    expect(getErrorPresentation(failure("PASSWORD_CHANGE_REQUIRED", 403)).action).toBe("change-password");
    expect(getErrorPresentation(failure("SHIFT_ALREADY_ACTIVE", 409), { context: "shift" })).toMatchObject({
      message: feedbackText("shiftAlready"), action: "refresh",
    });
    expect(getErrorPresentation(failure("SHIFT_NOT_ACTIVE", 409), { context: "shift" })).toMatchObject({
      message: feedbackText("shiftMissing"), action: "refresh",
    });
  });
  it("maps a wrong current password 403 to a safe field error", () => {
    const result = getErrorPresentation(failure("FORBIDDEN", 403), { context: "change-password" });
    expect(result.fieldErrors.currentPassword).toBe(feedbackText("currentPasswordInvalid"));
    expect(result.message).not.toContain("PASSWORD_HASH");
  });
  it("uses only allowlisted DTO field names and never backend validation text", () => {
    const error = failure("VALIDATION_ERROR", 400, {
      validationErrors: [
        "username must match PRIVATE_PASSWORD",
        "password should not be empty; AUTH_SECRET",
        "privateToken must be an internal field",
        50,
      ],
      fieldErrors: { currentPassword: ["Do not echo this"], refreshToken: "SECRET" },
    }, "trace-123");
    expect([...normalizeApiError(error).fields].sort()).toEqual(["currentPassword", "password", "username"]);
    const login = getErrorPresentation(error, { context: "login" });
    expect(Object.keys(login.fieldErrors).sort()).toEqual(["password", "username"]);
    expect(JSON.stringify(login)).not.toContain("AUTH_SECRET");
    expect(login.requestId).toBe("trace-123");
    expect(login.fieldErrors.currentPassword).toBeUndefined();
    expect(Object.keys(getErrorPresentation(error, { context: "change-password" }).fieldErrors))
      .toEqual(["currentPassword"]);
  });
  it("discards non-reference request IDs", () => {
    expect(getErrorPresentation(failure("RATE_LIMITED", 429, null, "secret/token?query=abc")).requestId)
      .toBeUndefined();
  });
  it("uses dynamic 429 cooldown and English interpolation without unsafe content", () => {
    const error = parseApiFailure({
      error: { code: "RATE_LIMITED", message: "sensitive", details: { retryAfterSeconds: 11 } },
      requestId: "safe-id",
    }, 429);
    expect(getErrorPresentation(error)).toMatchObject({
      action: "retry", canRetry: false, retryAfterSeconds: 11,
      message: formatFeedback("retryAfter", { seconds: 11 }),
    });
    expect(getErrorPresentation(error, { remainingSeconds: 0 })).toMatchObject({
      action: "retry", canRetry: true, message: feedbackText("rateLimited"),
    });
    expect(getErrorPresentation(error, { locale: "en", remainingSeconds: 5 }).message)
      .toBe("Try again in 5 seconds.");
    expect(new ApiError("RATE_LIMITED", 429, "raw", "id", { retryAfterSeconds: 999999 }).retryAfterSeconds)
      .toBeUndefined();
  });
  it("maps subscription, device and network failure contexts accurately", () => {
    expect(getErrorPresentation(failure("SUBSCRIPTION_INACTIVE", 403))).toMatchObject({
      message: feedbackText("subscription"), action: "contact",
    });
    expect(getErrorPresentation(failure("PLAN_FEATURE_DISABLED", 403)).message)
      .toBe(feedbackText("featureDisabled"));
    expect(getErrorPresentation(failure("PUSH_NOT_CONFIGURED", 503), { context: "devices" }).action)
      .toBe("contact");
    expect(getErrorPresentation(failure("DEVICE_LIMIT_REACHED", 409), { context: "devices" }).action)
      .toBe("none");
    expect(getErrorPresentation(failure("NETWORK_ERROR", 0)).message).toBe(feedbackText("network"));
    expect(getErrorPresentation(failure("TIMEOUT", 0)).action).toBe("retry");
  });
  it("maps 404/409/5xx with no backend messages or stack traces", () => {
    expect(getErrorPresentation(failure("NOT_FOUND", 404)).message).toBe(feedbackText("notFound"));
    expect(getErrorPresentation(failure("CONFLICT", 409)).action).toBe("refresh");
    expect(getErrorPresentation(failure("INTERNAL_ERROR", 500)).message).toBe(feedbackText("server"));
    expect(getErrorPresentation(new Error("db password secret")).message).toBe(feedbackText("unexpected"));
    expect(getErrorPresentation(failure("NETWORK_ERROR", 0), { locale: "en" }).message)
      .toBe("Unable to connect. Check your internet connection.");
  });
});
