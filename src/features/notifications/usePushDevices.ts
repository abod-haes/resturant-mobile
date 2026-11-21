import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeeApi } from "../../shared/api";
import { employeeKeys } from "../../shared/api/query-keys";

export function usePushDevices(employeeId: string | null) {
  const client = useQueryClient();
  const queryKey = employeeKeys.devices(employeeId ?? undefined);
  const devices = useQuery({
    queryKey,
    queryFn: () => employeeApi.listDevices(),
    enabled: Boolean(employeeId),
  });
  const remove = useMutation({
    mutationFn: (deviceId: string) => employeeApi.unregisterDevice(deviceId),
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
  const refresh = () => client.invalidateQueries({ queryKey });
  return { devices, remove, refresh };
}
