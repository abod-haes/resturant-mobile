import type { PropsWithChildren } from "react";
import { useQuery } from "@tanstack/react-query";
import { employeeApi } from "../../shared/api";
import { employeeKeys } from "../../shared/api/query-keys";
import { RestaurantIdentityContext } from "../../shared/config/theme";
import { useSession } from "./SessionProvider";

export function RestaurantThemeProvider({ children }: PropsWithChildren) {
  const { status, user } = useSession();
  const restaurantId = status === "authenticated" ? user?.restaurantId : null;
  const query = useQuery({
    queryKey: employeeKeys.restaurantIdentity(user?.id, restaurantId),
    enabled: Boolean(restaurantId && user?.id),
    queryFn: async ({ signal }) => {
      const identity = await employeeApi.getRestaurantIdentity(signal);
      if (identity.id !== restaurantId) throw new Error("Restaurant identity mismatch");
      return identity;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });
  const identity = restaurantId && query.data?.id === restaurantId ? query.data : null;
  return <RestaurantIdentityContext.Provider value={identity}>{children}</RestaurantIdentityContext.Provider>;
}
