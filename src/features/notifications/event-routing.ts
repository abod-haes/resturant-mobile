import { z } from "zod";

/** Both Expo Push (callId) and SSE (eventId) may invalidate local queries. */
const eventSchema = z.object({
  eventId: z.string().min(1).optional(),
  callId: z.string().min(1).optional(),
  eventType: z.enum(["call.created", "shift.updated"]),
  branchId: z.string().min(1),
}).refine(value => Boolean(value.eventId || value.callId));

export type EmployeeEventType = "call.created" | "shift.updated";

/**
 * Never trust push/SSE payloads as persisted call data: they only trigger
 * a refetch of authenticated branch-scoped APIs. Bound the de-duplication set.
 */
export function acceptEmployeeEvent(
  payload: unknown, branchId: string, seen: Set<string>,
): EmployeeEventType | null {
  const parsed = eventSchema.safeParse(payload);
  if (!parsed.success || parsed.data.branchId !== branchId) return null;
  // Expo push uses callId; SSE includes eventId and often the same callId in payload.
  // Prefer callId for call events so a single business call cannot invalidate twice.
  const identity = parsed.data.eventType === "call.created"
    ? parsed.data.callId ?? parsed.data.eventId
    : parsed.data.eventId ?? parsed.data.callId;
  const key = parsed.data.eventType + ":" + identity;
  if (seen.has(key)) return null;
  seen.add(key);
  if (seen.size > 100) {
    const oldest = seen.values().next().value;
    if (oldest) seen.delete(oldest);
  }
  return parsed.data.eventType;
}
