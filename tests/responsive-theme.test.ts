import { describe, expect, it } from "vitest";
import { resolveAppLayout, layoutTokens } from "../src/shared/config/layout";
import { colorPalettes } from "../src/shared/config/palettes";

function luminance(color: string): number {
  const channels = color.slice(1).match(/.{2}/g);
  if (!channels || channels.length !== 3) throw new Error("Invalid theme hex");
  const linear = channels.map((hex) => {
    const value = parseInt(hex, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function contrast(a: string, b: string): number {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

describe("responsive layout reflow", () => {
  it("provides narrow adaptive paddings without reducing native font sizes", () => {
    expect(resolveAppLayout(320)).toMatchObject({
      narrow: true, compact: true, contentPadding: 12, formPadding: 12,
    });
    expect(resolveAppLayout(390)).toMatchObject({
      narrow: false, compact: true, contentPadding: 16, formPadding: 16,
    });
    expect(resolveAppLayout(430)).toMatchObject({
      narrow: false, compact: false, contentPadding: 20, formPadding: 24,
    });
  });
  it("treats enlarged system text as reduced usable layout width", () => {
    expect(resolveAppLayout(430, 2)).toMatchObject({
      compact: true, narrow: true, largeText: true,
    });
    expect(resolveAppLayout(900, 2)).toMatchObject({
      compact: false, narrow: false, largeText: true,
    });
    expect(resolveAppLayout(900, 1).maxContentWidth).toBe(layoutTokens.maxContentWidth);
  });
  it("handles invalid dimensions safely without NaNs or negative padding", () => {
    for (const width of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const value = resolveAppLayout(width, Number.NaN);
      expect(value.contentPadding).toBeGreaterThan(0);
      expect(value.formPadding).toBeGreaterThan(0);
    }
  });
});

describe("theme contrast for normal text WCAG AA", () => {
  it.each(["light", "dark"] as const)("%s uses minimum 4.5:1 for common text pairs", (scheme) => {
    const color = colorPalettes[scheme];
    const pairs: readonly [string, string][] = [
      [color.text, color.background], [color.text, color.surface],
      [color.text, color.surfaceAlt], [color.muted, color.surface],
      [color.muted, color.surfaceAlt], [color.muted, color.background],
      [color.onPrimary, color.primary],
      [color.primary, color.accent],
      [color.danger, color.dangerSurface],
      [color.success, color.successSurface],
    ];
    for (const [foreground, background] of pairs) {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
