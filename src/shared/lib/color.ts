/** Hue 0–360, saturation and value 0–1. */
export type Hsv = { h: number; s: number; v: number }

export const isHex = (s: string) => /^#[0-9a-f]{6}$/i.test(s)

/** Accepts "f0561d", "#F0561D" or the short "#f52"; returns "#rrggbb" or null. */
export function parseHex(input: string) {
  let s = input.trim().replace(/^#/, "").toLowerCase()
  if (/^[0-9a-f]{3}$/.test(s)) s = [...s].map((c) => c + c).join("")
  return /^[0-9a-f]{6}$/.test(s) ? `#${s}` : null
}

function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function hsvToHex({ h, s, v }: Hsv) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255)
  }
  return "#" + [f(5), f(3), f(1)].map((c) => c.toString(16).padStart(2, "0")).join("")
}

export function hexToHsv(hex: string): Hsv {
  const [r, g, b] = rgb(hex).map((c) => c / 255)
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
  }
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max }
}

/** WCAG relative luminance. */
function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((c) => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Text color on top of `hex`: white while it keeps 3:1 contrast (it looks better on mid tones), else black. */
export function contrastText(hex: string) {
  return 1.05 / (luminance(hex) + 0.05) >= 3 ? "#ffffff" : "#000000"
}
