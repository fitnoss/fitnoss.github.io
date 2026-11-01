import { describe, expect, it } from "vitest"
import { accentInk, contrastText } from "./color"

const luminance = (hex: string) => {
  const rgb = hex.slice(1).match(/../g)!.map((v) => parseInt(v, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
}

describe("accent text contrast", () => {
  it("keeps accent labels readable in both themes without changing accessible accents", () => {
    for (const dark of [false, true]) {
      const bg = luminance(dark ? "#2a2a2b" : "#e6e6e9")
      for (let r = 0; r < 256; r += 51) for (let g = 0; g < 256; g += 51) for (let b = 0; b < 256; b += 51) {
        const accent = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
        const text = luminance(accentInk(accent, dark))
        expect((Math.max(bg, text) + .05) / (Math.min(bg, text) + .05)).toBeGreaterThanOrEqual(4.5)
      }
    }
    expect(accentInk("#000000", false)).toBe("#000000")
    expect(accentInk("#ffffff", true)).toBe("#ffffff")
  })
  it("keeps at least 4.5:1 for small labels across the RGB gamut", () => {
    for (let r = 0; r < 256; r += 17) for (let g = 0; g < 256; g += 17) for (let b = 0; b < 256; b += 17) {
      const accent = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
      const a = luminance(accent), text = luminance(contrastText(accent))
      expect((Math.max(a, text) + 0.05) / (Math.min(a, text) + 0.05)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
