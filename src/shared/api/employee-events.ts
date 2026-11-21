import { z } from "zod";
import { SseFrameParser, isNewerCursor, retryDelay } from "./sse-frames";
import type { SseFrame } from "./sse-frames";

const streamEventSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.enum(["call.created", "shift.updated", "owner.alert.created"]),
  occurredAt: z.string().min(1),
  branchId: z.string().min(1),
  payload: z.unknown(),
});

export type EmployeeStreamEvent = z.infer<typeof streamEventSchema>;

export type EmployeeEventCallbacks = {
  cursor: string | null;
  onCursor(id: string): void;
  onEvent(event: EmployeeStreamEvent): void;
  /** Fired on initial connect and after any reconnect; REST backfill is mandatory. */
  onConnected(): void;
};
export function parseEmployeeFrame(frame: SseFrame): EmployeeStreamEvent | null {
  if (frame.event === "heartbeat" || frame.event === "message" && !frame.data) return null;
  try {
    const parsed = streamEventSchema.safeParse(JSON.parse(frame.data));
    if (!parsed.success || parsed.data.eventType !== frame.event) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export type StreamRequest = {
  method: "GET";
  headers: Record<string, string>;
  signal: AbortSignal;
};
export type EmployeeStreamTransport = {
  fetcher(url: string, init: StreamRequest): Promise<Response>;
  getToken(): string | null;
  refreshToken(failed: string): Promise<void>;
  onForbidden?(error: unknown): void;
  url: string;
};
type Connection = { stop(): void };

/** Single long-running subscriber with bounded retries, backfill, and cancellation. */
export function subscribeEmployeeEvents(
  transport: EmployeeStreamTransport,
  callbacks: EmployeeEventCallbacks,
): Connection {
  const controller = new AbortController();
  let cursor = callbacks.cursor && /^\d{1,20}$/.test(callbacks.cursor) ? callbacks.cursor : null;

  async function wait(milliseconds: number): Promise<void> {
    if (controller.signal.aborted) return;
    await new Promise<void>((resolve) => {
      const finish = () => {
        clearTimeout(timer);
        controller.signal.removeEventListener("abort", finish);
        resolve();
      };
      const timer = setTimeout(finish, milliseconds);
      controller.signal.addEventListener("abort", finish, { once: true });
    });
  }

  async function consume(response: Response): Promise<void> {
    if (!response.body) throw new Error("SSE response has no stream");
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    const parser = new SseFrameParser();
    try {
      while (!controller.signal.aborted) {
        const next = await reader.read();
        if (next.done) break;
        for (const frame of parser.write(next.value)) {
          if (controller.signal.aborted) break;
          // Advance only over valid numeric monotonic SSE stream IDs.
          // Heartbeats are idless; no payload is treated as authoritative data.
          if (frame.id && isNewerCursor(frame.id, cursor)) {
            cursor = frame.id;
            callbacks.onCursor(frame.id);
            const event = parseEmployeeFrame(frame);
            if (event) callbacks.onEvent(event);
          }
        }
      }
    } finally {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  }

  async function run(): Promise<void> {
    let failures = 0;
    while (!controller.signal.aborted) {
      const token = transport.getToken();
      if (!token) return;
      try {
        const headers: Record<string, string> = {
          Accept: "text/event-stream",
          Authorization: "Bearer " + token,
          "Cache-Control": "no-cache",
          ...(cursor ? { "Last-Event-ID": cursor } : {}),
        };
        const response = await transport.fetcher(transport.url, {
          method: "GET", headers, signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (response.status === 401) {
          // SessionProvider performs rotating refresh via SecureStore.
          await transport.refreshToken(token);
          failures = 0;
          continue;
        }
        if (response.status === 403) {
          let payload: unknown = null;
          try { payload = await response.json(); } catch { /* opaque authorization failure */ }
          transport.onForbidden?.(payload);
          return; // Do not retry a permanently forbidden endpoint in a loop.
        }
        if (!response.ok) throw new Error("SSE returned a non-success status");
        if (!response.headers.get("content-type")?.includes("text/event-stream"))
          throw new Error("Unexpected SSE content type");
        failures = 0;
        callbacks.onConnected();
        await consume(response); // server deliberately closes after ~5 min
        if (!controller.signal.aborted) await wait(500);
      } catch (error) {
        if (controller.signal.aborted) return;
        // Invalid/replayed refresh credentials are handled by SessionProvider.
        if (typeof error === "object" && error !== null &&
          "status" in error && error.status === 401) return;
        await wait(retryDelay(failures++, Math.random()));
      }
    }
  }
  void run();
  return { stop: () => controller.abort() };
}
