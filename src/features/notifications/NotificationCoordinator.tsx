import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { onlineManager, useQueryClient } from "@tanstack/react-query";
import { employeeApi, isMockMode } from "../../shared/api";
import type { EmployeeStreamEvent } from "../../shared/api/employee-events";
import { employeeKeys } from "../../shared/api/query-keys";
import { acceptEmployeeEvent } from "./event-routing";
import { configureNotificationChannels, Notifications } from "./runtime";

/** Push is the OS alert; SSE is a foreground cache invalidation channel, not another alert. */
export function NotificationCoordinator({
  employeeId, branchId,
}: { employeeId: string | null; branchId: string | null }) {
  const client = useQueryClient();

  useEffect(() => {
    if (!employeeId || !branchId) return;
    const assignedEmployee = employeeId;
    const assignedBranch = branchId;
    const seen = new Set<string>();
    const pending = new Set<"call.created" | "shift.updated">();
    let disposed = false;
    let foreground = AppState.currentState === "active";
    let online = onlineManager.isOnline();
    let stopStream: (() => void) | null = null;
    let lastCursor: string | null = null;
    let flush: ReturnType<typeof setTimeout> | null = null;

    void configureNotificationChannels().catch(() => {
      // Native permission/channel failures must not prevent foreground SSE.
    });

    function invalidate(kind: "call.created" | "shift.updated") {
      if (kind === "call.created") {
        void client.invalidateQueries({ queryKey: employeeKeys.callsRoot(assignedEmployee) });
      } else {
        void client.invalidateQueries({ queryKey: employeeKeys.shift(assignedEmployee) });
      }
    }
    function reconcile() {
      if (disposed || !foreground) return;
      if (flush) clearTimeout(flush);
      flush = null;
      pending.clear();
      invalidate("call.created");
      invalidate("shift.updated");
    }
    /** Bound invalidate churn across 100-event SSE replay batches and push duplicates. */
    function schedule(kind: "call.created" | "shift.updated") {
      if (disposed || !foreground) return;
      pending.add(kind);
      if (flush) return;
      flush = setTimeout(() => {
        flush = null;
        for (const selected of pending) invalidate(selected);
        pending.clear();
      }, 250);
    }
    function routeEvent(raw: unknown) {
      const kind = acceptEmployeeEvent(raw, assignedBranch, seen);
      if (kind) schedule(kind);
    }
    function handleStreamEvent(event: EmployeeStreamEvent) {
      const data = typeof event.payload === "object" && event.payload !== null
        ? event.payload : {};
      const callId = "callId" in data ? data.callId : undefined;
      routeEvent({
        eventId: event.eventId,
        eventType: event.eventType,
        branchId: event.branchId,
        ...(typeof callId === "string" ? { callId } : {}),
      });
    }

    function syncStream() {
      const shouldRun = foreground && online && !disposed && !isMockMode && Platform.OS !== "web";
      if (!shouldRun && stopStream) {
        stopStream();
        stopStream = null;
        return;
      }
      if (shouldRun && !stopStream) {
        try {
          stopStream = employeeApi.subscribeEvents({
            cursor: lastCursor,
            onCursor: (id) => { lastCursor = id; },
            onEvent: handleStreamEvent,
            onConnected: reconcile,
          });
        } catch {
          // REST + Push continue to work if the SSE transport is misconfigured.
        }
      }
    }

    const received = Notifications.addNotificationReceivedListener((notification) => {
      routeEvent(notification.request.content.data);
    });
    const responded = Notifications.addNotificationResponseReceivedListener((response) => {
      routeEvent(response.notification.request.content.data);
      if (foreground) reconcile();
    });
    const appState = AppState.addEventListener("change", (state) => {
      const wasActive = foreground;
      foreground = state === "active";
      syncStream();
      if (foreground && !wasActive) reconcile();
    });
    const unsubscribeOnline = onlineManager.subscribe(() => {
      const previouslyOnline = online;
      online = onlineManager.isOnline();
      syncStream();
      if (foreground && online && !previouslyOnline) reconcile();
    });
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!disposed && response) {
        routeEvent(response.notification.request.content.data);
        reconcile();
      }
    }).catch(() => {
      // Next resume and initial SSE backfill both reconcile the server state.
    });
    syncStream();

    return () => {
      disposed = true;
      if (flush) clearTimeout(flush);
      stopStream?.();
      received.remove();
      responded.remove();
      appState.remove();
      unsubscribeOnline();
      seen.clear();
    };
  }, [employeeId, branchId, client]);

  return null;
}
