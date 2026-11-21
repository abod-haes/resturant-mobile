import { useEffect } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { employeeKeys } from "../../shared/api/query-keys";
import { acceptEmployeeEvent } from "./event-routing";
import { configureNotificationChannels, Notifications } from "./runtime";

export function NotificationCoordinator({
  employeeId, branchId,
}: { employeeId: string | null; branchId: string | null }) {
  const client = useQueryClient();

  useEffect(() => {
    if (!employeeId || !branchId) return;
    const activeEmployeeId = employeeId;
    const assignedBranchId = branchId;
    const seen = new Set<string>();
    let disposed = false;

    void configureNotificationChannels().catch(() => {
      console.warn("Native notification channels could not be initialized.");
    });

    function refreshCalls() {
      void client.invalidateQueries({ queryKey: employeeKeys.callsRoot(activeEmployeeId) });
    }
    function refreshShift() {
      void client.invalidateQueries({ queryKey: employeeKeys.shift(activeEmployeeId) });
    }
    function reconcile() {
      refreshCalls();
      refreshShift();
    }
    function routeEvent(raw: unknown) {
      const kind = acceptEmployeeEvent(raw, assignedBranchId, seen);
      if (kind === "call.created") refreshCalls();
      if (kind === "shift.updated") refreshShift();
    }

    const received = Notifications.addNotificationReceivedListener((notification) => {
      routeEvent(notification.request.content.data);
    });
    const responded = Notifications.addNotificationResponseReceivedListener((response) => {
      routeEvent(response.notification.request.content.data);
      reconcile();
    });
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") reconcile();
    });
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!disposed && response) {
        routeEvent(response.notification.request.content.data);
        reconcile();
      }
    }).catch(() => {
      console.warn("Previous notification response could not be loaded; app resume will reconcile.");
    });

    return () => {
      disposed = true;
      received.remove();
      responded.remove();
      appState.remove();
    };
  }, [employeeId, branchId, client]);

  return null;
}
