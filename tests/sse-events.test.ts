import { describe, expect, it, vi } from "vitest";
import { SseFrameParser, isNewerCursor, retryDelay } from "../src/shared/api/sse-frames";
import { parseEmployeeFrame, subscribeEmployeeEvents } from "../src/shared/api/employee-events";
import type { EmployeeStreamEvent } from "../src/shared/api/employee-events";
import { acceptEmployeeEvent } from "../src/features/notifications/event-routing";

const makeEvent = (id: string, callId: string) => [
  "id: " + id,
  "event: call.created",
  "data: " + JSON.stringify({
    eventId: "event-" + id, eventType: "call.created",
    occurredAt: "2026-11-21T09:00:00Z", branchId: "branch-1",
    payload: { callId },
  }),
  "",
  "",
].join("\n");

function responseStream(text: string): Response {
  const bytes = new TextEncoder().encode(text);
  return new Response(new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes.slice(0, Math.min(14, bytes.length)));
      controller.enqueue(bytes.slice(Math.min(14, bytes.length)));
      controller.close();
    },
  }), { headers: { "Content-Type": "text/event-stream" } });
}

describe("SSE framing and cursor utilities", () => {
  it("handles chunk boundaries, CRLF, comments and multiline event data", () => {
    const parser = new SseFrameParser();
    expect(parser.write(":ping\r\nid: 42\r\nevent: call.created\r\nda")).toEqual([]);
    expect(parser.write("ta: first\r\ndata: second\r\n\r\n")).toEqual([
      { id: "42", event: "call.created", data: "first\nsecond" },
    ]);
    expect(parser.write("event: heartbeat\n\n")).toEqual([]);
  });
  it("supports a large chunk containing multiple individually small frames", () => {
    const parser = new SseFrameParser();
    const frames = parser.write(makeEvent("1", "a").repeat(300));
    expect(frames).toHaveLength(300);
  });
  it("rejects overlarge frames without buffering unbounded data", () => {
    const parser = new SseFrameParser();
    expect(() => parser.write("data: " + "x".repeat(70_000) + "\n\n")).toThrow();
  });
  it("doesn't compare long monotonic sequence IDs through lossy JS numbers", () => {
    expect(isNewerCursor("9007199254740993", "9007199254740992")).toBe(true);
    expect(isNewerCursor("9007199254740992", "9007199254740993")).toBe(false);
    expect(isNewerCursor("00012", "12")).toBe(false);
    expect(isNewerCursor("13", "12")).toBe(true);
    expect(isNewerCursor("abc", "12")).toBe(false);
  });
  it("bounds reconnection delays with deterministic jitter", () => {
    expect(retryDelay(0, 0.5)).toBe(1000);
    expect(retryDelay(1, 0.5)).toBe(2000);
    expect(retryDelay(30, 0.5)).toBe(30000);
    expect(retryDelay(30, 1)).toBeLessThanOrEqual(30000);
  });
  it("validates branch/event framing and ignores heartbeat/untrusted JSON", () => {
    expect(parseEmployeeFrame({ event: "heartbeat", id: null, data: "" })).toBeNull();
    expect(parseEmployeeFrame({ event: "call.created", id: "1", data: "{wrong" })).toBeNull();
    expect(parseEmployeeFrame({ event: "shift.updated", id: "1", data: "{}" })).toBeNull();
    expect(parseEmployeeFrame({ event: "call.created", id: "1", data: makeEvent("1", "call-1").split("data: ")[1] })).not.toBeNull();
  });
});

describe("push and SSE share an authenticated cache-invalidation channel", () => {
  it("deduplicates the same callId even with different SSE event IDs", () => {
    const seen = new Set<string>();
    expect(acceptEmployeeEvent({
      eventId: "ev-3", callId: "call-1", eventType: "call.created", branchId: "branch-1",
    }, "branch-1", seen)).toBe("call.created");
    expect(acceptEmployeeEvent({
      callId: "call-1", eventType: "call.created", branchId: "branch-1",
    }, "branch-1", seen)).toBeNull();
    expect(acceptEmployeeEvent({
      callId: "call-2", eventType: "call.created", branchId: "branch-2",
    }, "branch-1", seen)).toBeNull();
    expect(seen.size).toBe(1);
  });
});

describe("authenticated SSE transport", () => {
  it("refreshes a rejected bearer and uses the fresh JWT in headers, not the URL", async () => {
    let token = "expired";
    const attempts: { url: string; headers: Record<string, string> }[] = [];
    const renew = vi.fn(async (failed: string) => {
      expect(failed).toBe("expired");
      token = "fresh";
    });
    let stop: (() => void) | null = null;
    const eventReceived = new Promise<EmployeeStreamEvent>((resolve) => {
      const connection = subscribeEmployeeEvents({
        url: "https://api.example.test/api/v1/employee/events?after=0",
        getToken: () => token, refreshToken: renew,
        fetcher: async (url, init) => {
          const headers = init.headers as Record<string, string>;
          attempts.push({ url, headers });
          return attempts.length === 1
            ? new Response("Unauthorized", { status: 401 })
            : responseStream(makeEvent("21", "call-1"));
        },
      }, {
        cursor: "20", onCursor: vi.fn(),
        onConnected: vi.fn(),
        onEvent: (event) => { resolve(event); stop?.(); },
      });
      stop = () => connection.stop();
    });
    const event = await eventReceived;
    expect(event.eventType).toBe("call.created");
    expect(renew).toHaveBeenCalledTimes(1);
    expect(attempts).toHaveLength(2);
    expect(attempts[0].headers.Authorization).toBe("Bearer expired");
    expect(attempts[1].headers.Authorization).toBe("Bearer fresh");
    expect(attempts[0].headers["Last-Event-ID"]).toBe("20");
    expect(attempts[1].url).not.toContain("fresh");
    expect(attempts[1].url).not.toContain("expired");
  });

  it("resumes with Last-Event-ID after the backend deliberately closes the stream", async () => {
    const headers: string[] = [];
    const cursors: string[] = [];
    const received: string[] = [];
    let stop: (() => void) | null = null;
    let completed: () => void = () => undefined;
    const done = new Promise<void>((resolve) => { completed = resolve; });
    const connection = subscribeEmployeeEvents({
      url: "https://api.example.test/api/v1/employee/events?after=0",
      getToken: () => "live-access", refreshToken: vi.fn(),
      fetcher: async (_url, init) => {
        headers.push((init.headers as Record<string, string>)["Last-Event-ID"] ?? "none");
        return headers.length === 1
          ? responseStream(makeEvent("10", "a"))
          : responseStream(makeEvent("11", "b"));
      },
    }, {
      cursor: null,
      onCursor: (id) => cursors.push(id),
      onConnected: vi.fn(),
      onEvent: (event) => {
        received.push(event.eventId);
        if (received.length === 2) { stop?.(); completed(); }
      },
    });
    stop = () => connection.stop();
    await Promise.race([
      done,
      new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error("SSE reconnect timed out")), 3500)),
    ]);
    stop();
    expect(received).toEqual(["event-10", "event-11"]);
    expect(cursors).toEqual(["10", "11"]);
    expect(headers.slice(0, 2)).toEqual(["none", "10"]);
  });

  it("stops reconnecting on permanent forbidden responses", async () => {
    const onForbidden = vi.fn();
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      error: { code: "PASSWORD_CHANGE_REQUIRED", message: "update password" }, requestId: "abc",
    }), { status: 403, headers: { "content-type": "application/json" } }));
    const connection = subscribeEmployeeEvents({
      url: "https://api.example.test/api/v1/employee/events?after=0",
      getToken: () => "jwt",
      refreshToken: vi.fn(),
      onForbidden,
      fetcher,
    }, { cursor: null, onCursor: vi.fn(), onConnected: vi.fn(), onEvent: vi.fn() });
    await new Promise((resolve) => setTimeout(resolve, 30));
    connection.stop();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(onForbidden).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: "PASSWORD_CHANGE_REQUIRED" }),
    }));
  });
});
