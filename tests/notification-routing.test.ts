import { describe, expect, it } from "vitest";
import { acceptEmployeeEvent } from "../src/features/notifications/event-routing";

const call = { eventId: "event-1", eventType: "call.created", branchId: "branch-1" };

describe("push event validation", () => {
  it("only admits the employee branch and known events", () => {
    const seen = new Set<string>();
    expect(acceptEmployeeEvent(call, "branch-1", seen)).toBe("call.created");
    expect(acceptEmployeeEvent({ ...call, eventId: "event-2", branchId: "other" }, "branch-1", seen)).toBeNull();
    expect(acceptEmployeeEvent({ ...call, eventType: "owner.alert.created" }, "branch-1", seen)).toBeNull();
    expect(acceptEmployeeEvent(null, "branch-1", seen)).toBeNull();
  });
  it("accepts actual Expo push callId payload without invented eventId", () => {
    const seen = new Set<string>();
    const payload = { eventType: "call.created", callId: "call-1", branchId: "branch-1" };
    expect(acceptEmployeeEvent(payload, "branch-1", seen)).toBe("call.created");
    expect(acceptEmployeeEvent(payload, "branch-1", seen)).toBeNull();
    expect(acceptEmployeeEvent({ ...payload, branchId: "branch-2" }, "branch-1", seen)).toBeNull();
    expect(acceptEmployeeEvent({ eventType: "call.created", branchId: "branch-1" }, "branch-1", seen)).toBeNull();
  });
  it("ignores duplicates, bounds memory, and accepts new shift events", () => {
    const seen = new Set<string>();
    expect(acceptEmployeeEvent(call, "branch-1", seen)).toBe("call.created");
    expect(acceptEmployeeEvent(call, "branch-1", seen)).toBeNull();
    for (let i = 0; i < 120; i++)
      acceptEmployeeEvent({ eventId: "event-" + (i + 2), eventType: "shift.updated", branchId: "branch-1" }, "branch-1", seen);
    expect(seen.size).toBe(100);
  });
});
