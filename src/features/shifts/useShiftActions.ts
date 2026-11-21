import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, employeeApi } from "../../shared/api";
import { employeeKeys } from "../../shared/api/query-keys";
import { useRetryCooldown } from "../../shared/api/use-retry-cooldown";
import { useFeedback } from "../../shared/ui/AppToast";
import { feedbackText } from "../../shared/i18n/feedback";
import { useCurrentShift } from "./useCurrentShift";

type ShiftAction = "started" | "ended";

export function useShiftActions(employeeId: string | undefined) {
  const client = useQueryClient();
  const shift = useCurrentShift(employeeId);
  const { showToast } = useFeedback();
  const [mutationError, setMutationError] = useState<unknown>(null);
  const mutation = useMutation({
    mutationFn: async (): Promise<ShiftAction> => {
      if (shift.data) {
        await employeeApi.endShift();
        return "ended";
      }
      await employeeApi.startShift();
      return "started";
    },
    onSuccess: async (action) => {
      setMutationError(null);
      showToast({
        message: feedbackText(action === "started" ? "shiftStarted" : "shiftEnded"),
        key: action === "started" ? "shift-started" : "shift-ended",
      });
      await Promise.all([
        client.invalidateQueries({ queryKey: employeeKeys.shift(employeeId) }),
        client.invalidateQueries({ queryKey: employeeKeys.callsRoot(employeeId) }),
      ]);
    },
    onError: (error: unknown) => {
      setMutationError(error);
      if (error instanceof ApiError &&
        (error.code === "SHIFT_ALREADY_ACTIVE" || error.code === "SHIFT_NOT_ACTIVE")) {
        // A conflict never indicates success; read the source of truth again.
        void client.invalidateQueries({ queryKey: employeeKeys.shift(employeeId) });
      }
    },
  });
  const error = mutationError ?? (shift.isError ? shift.error : null);
  const cooldown = useRetryCooldown(error);
  const toggle = useCallback(() => {
    if (!employeeId || shift.data === undefined || shift.isError ||
      mutation.isPending || cooldown > 0) return;
    setMutationError(null);
    mutation.mutate();
  }, [employeeId, shift.data, shift.isError, mutation, cooldown]);
  const retry = useCallback(() => {
    setMutationError(null);
    void shift.refetch();
  }, [shift]);

  return {
    shift,
    error,
    changing: mutation.isPending,
    toggle,
    retry,
    /** Used by pull-to-refresh; preserves the server's shift semantics. */
    refresh: shift.refetch,
  };
}
