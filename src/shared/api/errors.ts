export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export function describeApiError(error: unknown): string {
  if (!(error instanceof ApiError)) return "حدث خطأ غير متوقع. حاول مجدداً.";
  if (error.code === "NETWORK_ERROR" || error.code === "TIMEOUT")
    return "تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مجدداً.";
  if (error.status === 401) return "انتهت الجلسة. سجّل الدخول مجدداً.";
  if (error.status === 403) return "ليس لديك صلاحية لتنفيذ هذا الإجراء.";
  if (error.status === 429) return "طلبات كثيرة، يرجى المحاولة لاحقاً.";
  if (error.status >= 500) return "حدث خطأ في الخادم. حاول بعد قليل.";
  return error.message || "تعذر إتمام الطلب.";
}
