import { BitReader, BitWriter, DecodeError, Huffman } from "./bits"

/**
 * Text for program, day and note names, in two alphabets (Cyrillic / Latin).
 *
 * Each alphabet has 26 letters plus six control symbols, and every symbol gets a Huffman
 * code built from the frequencies below, so "о", "е", "а" and space cost 3–4 bits and rare
 * letters more. Anything else goes through ESC: a 5-bit EXTRA index, or a varint code point
 * for arbitrary Unicode. WORD inserts one of 64 common fitness words in 6 more bits.
 *
 * The letters, frequencies and words are part of the link format: once links are out in the
 * wild, changing any of them breaks old links (add a new FitPack version instead).
 */
const RU = "оеаинтсрвлкмдпуяыьгзбчйхжш"
const LAT = "etaoinshrdlcumwfgypbvkjxqz"
const EXTRA = "юцщэфъё0123456789.,-+!?()/:&'#%"

// Letter frequencies per 1000 letters, in the order of RU and LAT above.
const RU_FREQ = [110, 85, 80, 74, 67, 63, 55, 47, 45, 44, 35, 32, 30, 28, 26, 20, 19, 17, 17, 16, 16, 14, 12, 10, 9, 7]
const LAT_FREQ = [127, 91, 82, 75, 70, 67, 63, 61, 60, 43, 40, 28, 28, 24, 24, 22, 20, 20, 19, 15, 10, 8, 2, 2, 1, 1]

/** Words and stems that names and notes are made of. Matched case-insensitively, longest first. */
const WORDS = [
  // ru
  "трениров", "программ", "день", "недел", "груд", "спин", "ноги", "плеч", "руки", "бицепс", "трицепс", "пресс",
  "ягодиц", "верх", "низ", "тело", "кардио", "масс", "сила", "сушк", "базов", "дома", "зал", "турник", "брусья",
  "гантел", "штанг", "утрен", "тяжел", "жим", "тяга", "присед", "медленно", "пауза", "разминк", "растяжк", "сплит",
  "набор", "вниз", "вверх",
  // en
  "workout", "program", "day", "week", "chest", "back", "legs", "shoulder", "arms", "biceps", "triceps", "core",
  "glute", "upper", "lower", "full", "body", "push", "pull", "cardio", "strength", "home", "split", "slow",
]

const SPACE = 26
const ESC = 27
const SHIFT = 28
const SWITCH = 29
const WORD = 30
const END = 31
const EXTRA_UTF = 31

// Control symbols per 1000 letters of short titles: a space every few letters, a capital and an end per name.
const CONTROL_FREQ = [170, 20, 60, 8, 45, 70]

const ALPHA = [RU, LAT] as const
const CODES = [new Huffman([...RU_FREQ, ...CONTROL_FREQ]), new Huffman([...LAT_FREQ, ...CONTROL_FREQ])]
const WORD_BITS = 6

type Mode = 0 | 1

function modeOf(ch: string): Mode | undefined {
  const c = ch.toLowerCase()
  if (RU.includes(c)) return 0
  if (LAT.includes(c)) return 1
  return undefined
}


/** Cost of spelling `s` letter by letter in `mode` (approximate: other characters count as 10 bits). */
function spellCost(s: string, mode: Mode) {
  let bits = 0
  for (const ch of s) {
    const m = modeOf(ch)
    if (m === undefined) bits += 10
    else {
      if (m !== mode) {
        bits += CODES[mode].cost(SWITCH)
        mode = m
      }
      bits += CODES[mode].cost(ALPHA[mode].indexOf(ch.toLowerCase()))
    }
  }
  return bits
}

/** The longest dictionary word at `i` worth using: all lowercase, or with only its first letter capitalized. */
function wordAt(chars: string[], i: number, mode: Mode) {
  let best = -1
  for (let k = 0; k < WORDS.length; k++) {
    const word = WORDS[k]
    const slice = chars.slice(i, i + word.length).join("")
    if (slice.toLowerCase() !== word || slice.slice(1) !== word.slice(1)) continue
    if (best >= 0 && WORDS[best].length >= word.length) continue
    if (CODES[mode].cost(WORD) + WORD_BITS < spellCost(word, mode)) best = k
  }
  return best
}

export function writeText(w: BitWriter, text: string) {
  const chars = [...text]
  let mode: Mode = chars.map(modeOf).find((m) => m !== undefined) ?? 0
  w.write(mode, 1)
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    const lower = ch.toLowerCase()
    const word = wordAt(chars, i, mode)
    if (word >= 0) {
      if (lower !== ch) CODES[mode].write(w, SHIFT)
      CODES[mode].write(w, WORD)
      w.write(word, WORD_BITS)
      i += WORDS[word].length - 1
      continue
    }
    const m = modeOf(ch)
    if (m !== undefined) {
      if (m !== mode) {
        CODES[mode].write(w, SWITCH)
        mode = m
      }
      if (lower !== ch) CODES[mode].write(w, SHIFT)
      CODES[mode].write(w, ALPHA[mode].indexOf(lower))
    } else if (ch === " ") {
      CODES[mode].write(w, SPACE)
    } else {
      const ei = EXTRA.indexOf(lower)
      if (ei >= 0 && lower !== ch) CODES[mode].write(w, SHIFT)
      CODES[mode].write(w, ESC)
      if (ei >= 0) {
        w.write(ei, 5)
      } else {
        w.write(EXTRA_UTF, 5)
        w.varint(ch.codePointAt(0)!)
      }
    }
  }
  CODES[mode].write(w, END)
}

export function readText(r: BitReader, maxLen = 200) {
  let mode = r.read(1) as Mode
  let out = ""
  let upper = false
  for (let n = 0; n <= maxLen * 2; n++) {
    const sym = CODES[mode].read(r)
    if (sym === END) return out
    if (sym === SHIFT) {
      upper = true
      continue
    }
    if (sym === SWITCH) {
      mode = (1 - mode) as Mode
      continue
    }
    let s: string
    if (sym === SPACE) s = " "
    else if (sym === WORD) {
      s = WORDS[r.read(WORD_BITS)]
      if (s === undefined) throw new DecodeError("bad word")
    } else if (sym === ESC) {
      const e = r.read(5)
      s = e === EXTRA_UTF ? String.fromCodePoint(r.varint()) : EXTRA[e]
    } else s = ALPHA[mode][sym]
    out += upper ? s.charAt(0).toUpperCase() + s.slice(1) : s
    upper = false
  }
  throw new DecodeError("text too long")
}
