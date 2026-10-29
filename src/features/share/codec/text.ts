import { BitReader, BitWriter, DecodeError } from "./bits"

/**
 * 5-bit text with two alphabets (Cyrillic / Latin). The 26 most frequent letters
 * of each alphabet are one symbol; everything else goes through EXTRA (+5 bits)
 * or, for arbitrary Unicode, EXTRA + UTF escape + varint code point.
 */
const RU = "оеаинтсрвлкмдпуяыьгзбчйхжш"
const LAT = "abcdefghijklmnopqrstuvwxyz"
const EXTRA = "юцщэфъё0123456789.,-+!?()/:&'#%"

const SPACE = 26
const ESC = 27
const SHIFT = 28
const SWITCH = 29
const END = 31
const EXTRA_UTF = 31

type Mode = 0 | 1
const ALPHA = [RU, LAT] as const

function modeOf(ch: string): Mode | undefined {
  const c = ch.toLowerCase()
  if (RU.includes(c)) return 0
  if (LAT.includes(c)) return 1
  return undefined
}

export function writeText(w: BitWriter, text: string) {
  const chars = [...text]
  let mode: Mode = chars.map(modeOf).find((m) => m !== undefined) ?? 0
  w.write(mode, 1)
  for (const ch of chars) {
    const lower = ch.toLowerCase()
    const m = modeOf(ch)
    if (m !== undefined) {
      if (m !== mode) {
        w.write(SWITCH, 5)
        mode = m
      }
      if (lower !== ch) w.write(SHIFT, 5)
      w.write(ALPHA[mode].indexOf(lower), 5)
    } else if (ch === " ") {
      w.write(SPACE, 5)
    } else {
      const ei = EXTRA.indexOf(lower)
      if (ei >= 0 && lower !== ch) w.write(SHIFT, 5)
      w.write(ESC, 5)
      if (ei >= 0) {
        w.write(ei, 5)
      } else {
        w.write(EXTRA_UTF, 5)
        w.varint(ch.codePointAt(0)!)
      }
    }
  }
  w.write(END, 5)
}

export function readText(r: BitReader, maxLen = 200) {
  let mode = r.read(1) as Mode
  let out = ""
  let upper = false
  for (let n = 0; n <= maxLen * 2; n++) {
    const sym = r.read(5)
    if (sym === END) return out
    if (sym === SHIFT) {
      upper = true
      continue
    }
    if (sym === SWITCH) {
      mode = (1 - mode) as Mode
      continue
    }
    let ch: string
    if (sym === SPACE) ch = " "
    else if (sym === ESC) {
      const e = r.read(5)
      ch = e === EXTRA_UTF ? String.fromCodePoint(r.varint()) : EXTRA[e]
    } else if (sym < 26) ch = ALPHA[mode][sym]
    else throw new DecodeError("bad text symbol")
    out += upper ? ch.toUpperCase() : ch
    upper = false
  }
  throw new DecodeError("text too long")
}
