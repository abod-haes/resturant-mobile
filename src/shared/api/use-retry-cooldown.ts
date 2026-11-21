import { useEffect, useMemo, useState } from "react";
import { normalizeApiError } from "./error-presentation";

/**
 * Computes a deadline once per error event. Used by both submit buttons and
 * feedback surfaces, so an HTTP 429 cannot trigger another mutation early.
 */
export function useRetryCooldown(error: unknown): number {
  const deadline = useMemo(() => {
    if (error === null || error === undefined) return null;
    const value = normalizeApiError(error);
    return value.status === 429 && value.retryAfterSeconds !== undefined
      ? Date.now() + value.retryAfterSeconds * 1000 : null;
  }, [error]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (deadline === null) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [deadline]);
  return deadline === null ? 0 : Math.max(0, Math.ceil((deadline - now) / 1000));
}
