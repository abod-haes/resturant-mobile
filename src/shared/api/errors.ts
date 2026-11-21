/** HTTP errors are never rendered directly; UI maps allowlisted codes. */
export class ApiError extends Error {
  readonly retryAfterSeconds?: number;
  readonly retryable: boolean;
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly requestId?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    const retry = isRecord(details) ? details.retryAfterSeconds : undefined;
    this.retryAfterSeconds =
      typeof retry === "number" && Number.isInteger(retry) && retry >= 0 && retry <= 3600
        ? retry : undefined;
    this.retryable = code === "NETWORK_ERROR" || code === "TIMEOUT" || (status >= 500 && status < 600);
  }
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function parseApiFailure(payload: unknown, status: number): ApiError {
  if (!isRecord(payload) || !isRecord(payload.error))
    return new ApiError("HTTP_ERROR", status, "HTTP request failed");
  const { code, message, details } = payload.error;
  if (typeof code !== "string" || typeof message !== "string")
    return new ApiError("HTTP_ERROR", status, "HTTP request failed");
  return new ApiError(code, status, message,
    typeof payload.requestId === "string" ? payload.requestId : undefined, details);
}
export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}
export function canRetryRead(failureCount: number, error: unknown): boolean {
  return failureCount < 2 && error instanceof ApiError && error.retryable;
}
/** Never print raw backend errors, request data, or validation details. */
export function describeApiError(error: unknown): string {
  if (!(error instanceof ApiError)) return "حدث خطأ غير متوقع. حاول مجدداً.";
  const safe: Record<string, string> = {
    NETWORK_ERROR: "تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مجدداً.",
    TIMEOUT: "انتهت مهلة الاتصال. حاول مجدداً.",
    CANCELLED: "تم إلغاء الطلب.",
    CONFIG_ERROR: "إعدادات الاتصال بالخادم غير مكتملة.",
    INVALID_RESPONSE: "تعذر قراءة استجابة الخادم. حاول مجدداً.",
    PASSWORD_CHANGE_REQUIRED: "يجب تغيير كلمة المرور قبل استخدام التطبيق.",
    SHIFT_ALREADY_ACTIVE: "دوامك مفتوح بالفعل. سيتم تحديث الحالة.",
    SHIFT_NOT_ACTIVE: "لا يوجد دوام مفتوح حالياً. سيتم تحديث الحالة.",
    SUBSCRIPTION_INACTIVE: "الخدمة غير متاحة حالياً. تواصل مع إدارة المطعم.",
    PLAN_FEATURE_DISABLED: "هذه الخدمة غير مفعّلة لدى المطعم.",
    DEVICE_LIMIT_REACHED: "وصلت للحد الأقصى من الأجهزة. احذف جهازاً غير مستخدم.",
    DEVICE_ALREADY_REGISTERED: "الجهاز مسجّل على حساب آخر.",
    PUSH_NOT_CONFIGURED: "لم يتم تجهيز الإشعارات على الخادم بعد.",
  };
  if (safe[error.code]) return safe[error.code];
  if (error.status === 401) return "انتهت الجلسة. سجّل الدخول مجدداً.";
  if (error.status === 403) return "ليس لديك صلاحية لتنفيذ هذا الإجراء.";
  if (error.status === 404) return "العنصر المطلوب غير متوفر.";
  if (error.status === 409) return "حدث تعارض في البيانات. حدّث الصفحة وحاول مرة أخرى.";
  if (error.status === 429) return error.retryAfterSeconds !== undefined
    ? "حاول مجدداً بعد " + error.retryAfterSeconds + " ثانية."
    : "طلبات كثيرة، يرجى المحاولة لاحقاً.";
  if (error.status >= 500) return "الخدمة غير متاحة مؤقتاً. حاول بعد قليل.";
  return "تعذر إتمام الطلب. تحقق من البيانات وحاول مجدداً.";
}
