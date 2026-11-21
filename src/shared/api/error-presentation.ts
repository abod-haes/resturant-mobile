import { ApiError } from "./errors";
import { feedbackText, formatFeedback } from "../i18n/feedback";
import type { FeedbackKey, AppLocale } from "../i18n/feedback";

export type FeedbackContext = "generic" | "login" | "change-password" | "shift" | "calls" | "devices";
export type AppField = "username" | "password" | "currentPassword" | "newPassword" | "confirmation";
export type ErrorAction = "retry" | "refresh" | "login" | "change-password" | "contact" | "none";
export type FieldErrors = Partial<Record<AppField, string>>;

const fieldNames: readonly AppField[] = ["username", "password", "currentPassword", "newPassword", "confirmation"];
const fieldMessages: Record<AppField, FeedbackKey> = {
  username: "usernameInvalid",
  password: "passwordInvalid",
  currentPassword: "currentPasswordInvalid",
  newPassword: "newPasswordInvalid",
  confirmation: "confirmationInvalid",
};
const knownErrors: Record<string, FeedbackKey> = {
  NETWORK_ERROR: "network",
  TIMEOUT: "timeout",
  CANCELLED: "cancelled",
  CONFIG_ERROR: "config",
  INVALID_RESPONSE: "response",
  PASSWORD_CHANGE_REQUIRED: "passwordRequired",
  SHIFT_ALREADY_ACTIVE: "shiftAlready",
  SHIFT_NOT_ACTIVE: "shiftMissing",
  SUBSCRIPTION_INACTIVE: "subscription",
  PLAN_FEATURE_DISABLED: "featureDisabled",
  DEVICE_LIMIT_REACHED: "deviceLimit",
  DEVICE_ALREADY_REGISTERED: "deviceOther",
  PUSH_NOT_CONFIGURED: "pushUnavailable",
  PUSH_SETUP_FAILED: "pushSetup",
  CALLS_DISABLED: "callsDisabled",
  CALL_TYPE_DISABLED: "callsDisabled",
};

function record(input: unknown): input is Record<string, unknown> {
  return input !== null && typeof input === "object" && !Array.isArray(input);
}
function isFormField(value: string): value is AppField {
  return fieldNames.some((name) => value === name);
}
function safeRequestId(value: string | undefined): string | undefined {
  return value && /^[a-zA-Z0-9-]{1,64}$/.test(value) ? value : undefined;
}

/**
 * Backend class-validator sends details.validationErrors as an array of strings.
 * Infer ONLY the explicitly whitelisted field identifier. Never render source text.
 * Structured details.fieldErrors is also supported without trusting its messages.
 */
function allowedFields(details: unknown): AppField[] {
  if (!record(details)) return [];
  const matched = new Set<AppField>();
  if (record(details.fieldErrors)) {
    for (const name of Object.keys(details.fieldErrors)) {
      if (isFormField(name)) matched.add(name);
    }
  }
  const validation = details.validationErrors;
  if (Array.isArray(validation)) {
    for (const message of validation) {
      if (typeof message !== "string" || message.length > 300) continue;
      for (const name of fieldNames) {
        if (message.startsWith(name + " ") || message.startsWith(name + ".") || message.startsWith(name + ":")) {
          matched.add(name);
        }
      }
    }
  }
  return [...matched];
}

export type AppError = {
  code: string;
  status: number;
  requestId?: string;
  retryAfterSeconds?: number;
  retryable: boolean;
  fields: readonly AppField[];
};

export function normalizeApiError(error: unknown): AppError {
  if (!(error instanceof ApiError)) {
    return { code: "UNEXPECTED_ERROR", status: 0, retryable: false, fields: [] };
  }
  return {
    code: error.code,
    status: error.status,
    requestId: safeRequestId(error.requestId),
    retryAfterSeconds: error.retryAfterSeconds,
    retryable: error.retryable,
    fields: allowedFields(error.details),
  };
}

export type ErrorPresentation = {
  message: string;
  action: ErrorAction;
  actionLabel?: string;
  severity: "error" | "warning";
  fieldErrors: FieldErrors;
  requestId?: string;
  retryAfterSeconds?: number;
  /** A retry is disallowed during a backend-specified cooldown. */
  canRetry: boolean;
};

export function getErrorPresentation(
  error: unknown,
  options: { context?: FeedbackContext; locale?: AppLocale; remainingSeconds?: number } = {},
): ErrorPresentation {
  const context = options.context ?? "generic";
  const locale = options.locale ?? "ar";
  const value = normalizeApiError(error);
  const fieldErrors: FieldErrors = {};
  if (context === "login" || context === "change-password") {
    for (const field of value.fields) {
      if (context === "login" && field !== "username" && field !== "password") continue;
      if (context === "change-password" && field !== "currentPassword" && field !== "newPassword" && field !== "confirmation") continue;
      fieldErrors[field] = feedbackText(fieldMessages[field], locale);
    }
  }

  let key = knownErrors[value.code] ?? "unexpected";
  let action: ErrorAction = value.retryable ? "retry" : "none";
  if (value.status === 401) {
    key = context === "login" ? "credentials" : "sessionExpired";
    action = context === "login" ? "none" : "login";
  } else if (value.code === "PASSWORD_CHANGE_REQUIRED") {
    key = "passwordRequired";
    action = "change-password";
  } else if (value.code === "SHIFT_ALREADY_ACTIVE" || value.code === "SHIFT_NOT_ACTIVE") {
    action = "refresh";
  } else if (value.code === "SUBSCRIPTION_INACTIVE" || value.code === "PLAN_FEATURE_DISABLED" ||
    value.code === "PUSH_NOT_CONFIGURED" || value.code === "CALLS_DISABLED" || value.code === "CALL_TYPE_DISABLED") {
    action = "contact";
  } else if (value.status === 429) {
    key = "rateLimited";
    action = "retry";
  } else if (value.status === 400 || value.status === 422 || value.code === "VALIDATION_ERROR") {
    key = "validation";
    action = "none";
  } else if (value.status === 403 && !knownErrors[value.code]) {
    key = "forbidden";
    action = "none";
  } else if (value.status === 404) {
    key = "notFound";
    action = "none";
  } else if (value.status === 409 && !knownErrors[value.code]) {
    key = "conflict";
    action = "refresh";
  } else if (value.status >= 500 && !knownErrors[value.code]) {
    key = "server";
    action = "retry";
  }
  if (value.code === "PUSH_SETUP_FAILED") action = "retry";
  if (context === "devices" && value.code === "DEVICE_LIMIT_REACHED") action = "none";
  if (context === "devices" && value.code === "DEVICE_ALREADY_REGISTERED") action = "none";
  if (context === "change-password" && value.status === 403 && value.code !== "PASSWORD_CHANGE_REQUIRED") {
    key = "currentPasswordInvalid";
    fieldErrors.currentPassword = feedbackText("currentPasswordInvalid", locale);
    action = "none";
  }

  const remaining = options.remainingSeconds ?? value.retryAfterSeconds;
  const countdown = value.status === 429 && remaining !== undefined && remaining > 0
    ? Math.max(0, Math.floor(remaining)) : 0;
  const text = countdown > 0
    ? formatFeedback("retryAfter", { seconds: countdown }, locale)
    : feedbackText(key, locale);
  const actionKeys: Partial<Record<ErrorAction, FeedbackKey>> = {
    retry: "retry",
    refresh: "refresh",
    login: "login",
    "change-password": "changePassword",
    contact: "contact",
  };
  const actionKey = actionKeys[action];
  return {
    message: text,
    action,
    actionLabel: actionKey ? feedbackText(actionKey, locale) : undefined,
    severity: value.status === 429 || value.code === "SUBSCRIPTION_INACTIVE" ? "warning" : "error",
    fieldErrors,
    requestId: value.requestId,
    retryAfterSeconds: value.retryAfterSeconds,
    canRetry: action === "retry" && countdown === 0,
  };
}
