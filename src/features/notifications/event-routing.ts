import { z } from "zod";

const eventSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.enum(["call.created", "shift.updated"]),
  branchId: z.string().min(1),
});
export type EmployeeEventType = z.infer<typeof eventSchema>["eventType"];

/** Push payloads are untrusted; GET APIs remain the source of truth. */
export function acceptEmployeeEvent(
  payload: unknown, branchId: string, seen: Set<string>,
): EmployeeEventType | null {
  const event = eventSchema.safeParse(payload);
  if (!event.success || event.data.branchId !== branchId) return null;
  if (seen.has(event.data.eventId)) return null;
  seen.add(event.data.eventId);
  if (seen.size > 100) {
    const first = seen.values().next().value;
    if (first) seen.delete(first);
  }
  return event.data.eventType;
}
