/**
 * Bounded WHATWG SSE frame parser. Buffers only incomplete lines and a single
 * event, not the complete 5-minute response. Supports \n and \r\n boundaries.
 * Transport bytes are UTF-8 decoded by TextDecoderStream before calling write.
 */
export type SseFrame = { event: string; id: string | null; data: string };

const MAX_BUFFER = 64 * 1024;
const MAX_EVENT = 64 * 1024;

export class SseFrameParser {
  private buffer = "";
  private eventType = "message";
  private eventId: string | null = null;
  private dataLines: string[] = [];
  private dataSize = 0;

  write(chunk: string): SseFrame[] {
    this.buffer += chunk;
    const frames: SseFrame[] = [];
    let boundary: number;
    while ((boundary = this.buffer.indexOf("\n")) !== -1) {
      let line = this.buffer.slice(0, boundary);
      this.buffer = this.buffer.slice(boundary + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line === "") {
        if (this.dataLines.length) {
          frames.push({
            event: this.eventType,
            id: this.eventId,
            data: this.dataLines.join("\n"),
          });
        }
        this.eventType = "message";
        this.eventId = null;
        this.dataLines = [];
        this.dataSize = 0;
        continue;
      }
      if (line.startsWith(":")) continue;
      const delimiter = line.indexOf(":");
      const field = delimiter === -1 ? line : line.slice(0, delimiter);
      const rawValue = delimiter === -1 ? "" : line.slice(delimiter + 1);
      const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;
      if (field === "data") {
        this.dataSize += value.length;
        if (this.dataSize > MAX_EVENT) throw new Error("SSE event exceeds maximum size");
        this.dataLines.push(value);
      } else if (field === "event" && value) {
        this.eventType = value;
      } else if (field === "id" && !value.includes("\0")) {
        this.eventId = value;
      }
    }
    if (this.buffer.length > MAX_BUFFER) throw new Error("SSE line exceeds maximum size");
    return frames;
  }
}

/** Sequence IDs are monotonic decimal strings; avoid Number precision loss. */
export function isNewerCursor(candidate: string, previous: string | null): boolean {
  if (!/^\d{1,20}$/.test(candidate)) return false;
  if (previous === null) return true;
  const lhs = candidate.replace(/^0+(?=\d)/, "");
  const rhs = previous.replace(/^0+(?=\d)/, "");
  return lhs.length > rhs.length || (lhs.length === rhs.length && lhs > rhs);
}

export function retryDelay(attempt: number, random: number): number {
  const capped = Math.max(0, Math.min(attempt, 5));
  const jitter = 0.75 + Math.max(0, Math.min(random, 1)) * 0.5;
  return Math.min(30_000, Math.round(Math.min(30_000, 1_000 * 2 ** capped) * jitter));
}
