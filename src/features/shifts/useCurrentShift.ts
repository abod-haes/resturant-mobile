import { useQuery } from "@tanstack/react-query";
import { employeeApi } from "../../shared/api";
import { employeeKeys } from "../../shared/api/query-keys";

/** Authenticated user-scoped shift state; never infer an active shift locally. */
export function useCurrentShift(employeeId: string | undefined) {
  return useQuery({
    queryKey: employeeKeys.shift(employeeId),
    queryFn: ({ signal }) => employeeApi.getCurrentShift(signal),
    enabled: Boolean(employeeId),
  });
}
