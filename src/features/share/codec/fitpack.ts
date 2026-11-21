/**
 * FitPack — a bit-level format for sharing programs, workouts and custom exercises.
 *
 *   header   3b version · 2b kind
 *   plan     1b hasName · 1b hasWeights · 1b hasNotes · 1b hasSupersets · 1b hasChecklists · 1b hasSteps
 *   name     text (if hasName)
 *   days     3b (count - 1)
 *   day      4b name (0 = "Day N", 1..14 preset token, 15 = text) · [1b checklist] · varint item count
 *   item     [1b superset with previous, not on the first item] · exercise code (prefix code) · scheme · [weight] · [step] · [note]
 *   scheme   move-to-front list of recent schemes, initially [3×10 90s]
 *            0 = recent[0] · 10 + 2b = recent[1..4] · 11 + explicit:
 *            sets, reps and rest, each a Huffman code over a table of common values (+ escape)
 *   weight   0 = none · 10 + 6b = n × 2.5 kg · 11 + varint (kg × 2, zero escapes to text)
 *   step     auto-progression increment: 0 = none · 10 = same as the previous step (initially 2.5 kg) · 11 + varint (kg × 4)
 *   note     0 = none · 10 = same as the previous note · 11 + text
 *   custom   definitions for custom codes, in first-use order
 *   crc16    over everything above, then zero padding to a 6-bit boundary
 *
 * Exercise codes are ordered by popularity (data/id-map.json is append-only), so the
 * top 64 cost 7 bits. Custom exercise codes have their own reserved range.
 */
import { DEFAULT_SCHEME, type ProgramData, type ProgramItem, type WorkoutData } from "@/entities/program/types"
import { CUSTOM_INSTRUCTIONS_LIMIT, CUSTOM_NAME_LIMIT, isCustomCode, validCustomExercise, type CustomExercise } from "@/entities/exercise/custom"
import { CATEGORIES, EQUIPMENT, MUSCLES } from "@/entities/exercise/types"
import { BitReader, BitWriter, DecodeError, Huffman, base64urlToBits, bitsToBase64url, crc16 } from "./bits"
import { readText, writeText } from "./text"

export { DecodeError }

const VERSION = 2
const MAX_DAYS = 8
const MAX_ITEMS = 500

export type ShareSource =
  | { kind: "program"; program: ProgramData }
  | { kind: "workout"; workout: WorkoutData }
  | { kind: "exercise"; exercise: CustomExercise }

export type SharedContent =
  | { kind: "program"; program: ProgramData; exercises: CustomExercise[] }
  | { kind: "workout"; workout: WorkoutData; exercises: CustomExercise[] }
  | { kind: "exercise"; exercise: CustomExercise }

function customCodes(days: WorkoutData[]) {
  return [...new Set(days.flatMap((day) => day.items.map((item) => item.ex)).filter(isCustomCode))]
}

/** Day name presets; stored as tokens and shown in the viewer's language (dayPreset.* in ui.json). */
export const DAY_NAMES = [
  "", "@upper", "@lower", "@push", "@pull", "@legs", "@fullbody", "@chest_triceps", "@back_biceps",
  "@legs_shoulders", "@chest", "@back", "@shoulders", "@arms", "@core",
] as const

// Common values and how often they come up; the last weight of each code is the escape.
const SETS = [1, 2, 3, 4, 5, 6, 7]
const SETS_CODE = new Huffman([2, 5, 50, 30, 8, 2, 1, 2])
const REPS = ["5", "6", "8", "10", "12", "15", "20", "8-12", "6-8", "10-15", "30s", "45s", "60s", "amrap", "max"]
const REPS_CODE = new Huffman([4, 3, 8, 14, 14, 10, 5, 14, 6, 5, 4, 3, 3, 2, 4, 5])
const REST = [30, 45, 60, 90, 120, 180, 240]
const REST_CODE = new Huffman([5, 6, 20, 22, 18, 10, 4, 4])

type Scheme = Pick<ProgramItem, "sets" | "reps" | "rest">

/** Move-to-front list of the last five distinct schemes. */
class Recent {
  list: Scheme[] = [{ ...DEFAULT_SCHEME }]

  indexOf(s: Scheme) {
    return this.list.findIndex((x) => x.sets === s.sets && x.reps === s.reps && x.rest === s.rest)
  }

  at(i: number) {
    const s = this.list[i]
    if (!s) throw new DecodeError("bad scheme ref")
    return s
  }

  use(s: Scheme) {
    const i = this.indexOf(s)
    if (i >= 0) this.list.splice(i, 1)
    this.list.unshift({ sets: s.sets, reps: s.reps, rest: s.rest })
    this.list.length = Math.min(this.list.length, 5)
  }
}

/**
 * Exercise code tiers: unary tier prefix + fixed payload, last tier is an unbounded varint.
 * Codes only grow (id-map is append-only), so an existing code never changes its cost.
 *
 *   0    + 6b   0..63         7 bits
 *   10   + 8b   64..319      10 bits
 *   110  + 10b  320..1343    13 bits
 *   1110 + 12b  1344..5439   16 bits
 *   1111 + varint  5440+     ≥ 9 bits more, no upper limit
 */
const TIERS = [6, 8, 10, 12]

function writeExercise(w: BitWriter, code: number) {
  let base = 0
  for (let t = 0; t < TIERS.length; t++) {
    const size = 2 ** TIERS[t]
    if (code < base + size) {
      w.write((2 ** (t + 1) - 2) >>> 0, t + 1)
      w.write(code - base, TIERS[t])
      return
    }
    base += size
  }
  w.write(0b1111, 4)
  w.varint(code - base)
}

function readExercise(r: BitReader) {
  let base = 0
  for (let t = 0; t < TIERS.length; t++) {
    if (!r.bit()) return base + r.read(TIERS[t])
    base += 2 ** TIERS[t]
  }
  return base + r.varint()
}

function writeSets(w: BitWriter, sets: number) {
  const i = SETS.indexOf(sets)
  if (i >= 0) return SETS_CODE.write(w, i)
  SETS_CODE.write(w, SETS.length)
  w.varint(sets)
}

function readSets(r: BitReader) {
  const i = SETS_CODE.read(r)
  return i < SETS.length ? SETS[i] : r.varint()
}

function writeRest(w: BitWriter, rest: number) {
  const i = REST.indexOf(rest)
  if (i >= 0) return REST_CODE.write(w, i)
  REST_CODE.write(w, REST.length)
  w.varint(rest)
}

function readRest(r: BitReader) {
  const i = REST_CODE.read(r)
  return i < REST.length ? REST[i] : r.varint()
}

function writeWeight(w: BitWriter, kg: number | undefined) {
  if (kg === undefined) return w.bit(false)
  const half = kg * 2
  const plates = half / 5
  if (Number.isInteger(plates) && plates > 0 && plates < 64) {
    w.write(0b10, 2)
    w.write(plates, 6)
  } else {
    w.write(0b11, 2)
    if (Number.isInteger(half) && half > 0 && half <= 0xFFFFFFFF) w.varint(half)
    else {
      w.varint(0)
      writeText(w, String(kg))
    }
  }
}

function readWeight(r: BitReader) {
  if (!r.bit()) return undefined
  if (!r.bit()) return r.read(6) * 2.5
  const half = r.varint()
  if (half) return half / 2
  const weight = Number(readText(r, 32))
  if (!Number.isFinite(weight) || weight < 0) throw new DecodeError("bad weight")
  return weight
}

const FIRST_STEP = 2.5

/** Steps are stored in quarter kilos; anything that rounds to zero means no progression. */
const quarters = (kg: number | undefined) => Math.max(0, Math.round((kg ?? 0) * 4))

function writeReps(w: BitWriter, reps: string) {
  const i = REPS.indexOf(reps)
  if (i >= 0) return REPS_CODE.write(w, i)
  REPS_CODE.write(w, REPS.length)
  let m: RegExpExecArray | null
  if ((m = /^(\d+)-(\d+)$/.exec(reps))) {
    const a = Number(m[1])
    const b = Math.max(a, Number(m[2]))
    w.write(1, 2)
    w.varint(a)
    w.varint(b - a)
  } else if ((m = /^(\d+)s$/.exec(reps))) {
    w.write(2, 2)
    w.varint(Number(m[1]))
  } else if (reps) {
    w.write(0, 2)
    w.varint(Math.max(0, Math.round(Number(reps)) || 0))
  } else w.write(3, 2)
}

function readReps(r: BitReader) {
  const i = REPS_CODE.read(r)
  if (i < REPS.length) return REPS[i]
  switch (r.read(2)) {
    case 0:
      return String(r.varint())
    case 1: {
      const a = r.varint()
      return `${a}-${a + r.varint()}`
    }
    case 2:
      return `${r.varint()}s`
    default:
      return ""
  }
}

export function encodeShare(source: ShareSource, custom: CustomExercise[] = []): string {
  const w = new BitWriter()
  w.write(VERSION, 3)
  w.write(source.kind === "program" ? 0 : source.kind === "workout" ? 1 : 2, 2)
  if (source.kind === "exercise") {
    writeExercise(w, source.exercise.code)
    writeDefinition(w, source.exercise)
  } else {
    const program = source.kind === "program" ? source.program : { name: "", days: [source.workout] }
    writeProgram(w, program)
    for (const code of customCodes(program.days)) {
      const definition = custom.find((exercise) => exercise.code === code)
      if (!definition) throw new RangeError("missing custom exercise")
      writeDefinition(w, definition)
    }
  }
  w.write(crc16(w.bits), 16)
  return bitsToBase64url(w.bits)
}

function writeProgram(w: BitWriter, p: ProgramData) {
  const items = p.days.flatMap((d) => d.items)
  const hasName = p.name.trim().length > 0
  const hasWeights = items.some((it) => it.weight !== undefined)
  const hasNotes = items.some((it) => !!it.note?.trim())
  const hasSupersets = p.days.some((d) => d.items.some((it, i) => i > 0 && it.superset))
  const hasChecklists = p.days.some((d) => d.mode === "checklist")
  const hasSteps = items.some((it) => quarters(it.inc) > 0)
  const days = p.days
  if (!days.length || days.length > MAX_DAYS || days.some((day) => day.items.length > MAX_ITEMS)) throw new RangeError("program size")

  w.bit(hasName)
  w.bit(hasWeights)
  w.bit(hasNotes)
  w.bit(hasSupersets)
  w.bit(hasChecklists)
  w.bit(hasSteps)
  if (hasName) writeText(w, p.name.trim())

  w.write(days.length - 1, 3)
  const recent = new Recent()
  let lastNote = ""
  let lastStep = quarters(FIRST_STEP)
  for (const day of days) {
    const dn = DAY_NAMES.indexOf(day.name.trim() as (typeof DAY_NAMES)[number])
    if (dn >= 0) {
      w.write(dn, 4)
    } else {
      w.write(15, 4)
      writeText(w, day.name.trim())
    }
    if (hasChecklists) w.bit(day.mode === "checklist")
    w.varint(day.items.length)
    for (const [i, it] of day.items.entries()) {
      if (hasSupersets && i > 0) w.bit(!!it.superset)
      writeExercise(w, it.ex)
      const ri0 = recent.indexOf(it)
      if (ri0 === 0) w.write(0, 1)
      else if (ri0 > 0) {
        w.write(0b10, 2)
        w.write(ri0 - 1, 2)
      } else {
        w.write(0b11, 2)
        writeSets(w, it.sets)
        writeReps(w, it.reps)
        writeRest(w, it.rest)
      }
      recent.use(it)
      if (hasWeights) writeWeight(w, it.weight)
      if (hasSteps) {
        const step = quarters(it.inc)
        if (!step) w.bit(false)
        else if (step === lastStep) w.write(0b10, 2)
        else {
          w.write(0b11, 2)
          w.varint(step)
          lastStep = step
        }
      }
      if (hasNotes) {
        const note = it.note?.trim() ?? ""
        if (!note) w.bit(false)
        else if (note === lastNote) w.write(0b10, 2)
        else {
          w.write(0b11, 2)
          writeText(w, note)
          lastNote = note
        }
      }
    }
  }
}

export function decodeShare(payload: string): SharedContent {
  const bits = base64urlToBits(payload)
  const r = new BitReader(bits)
  const version = r.read(3)
  if (version !== VERSION) throw new DecodeError(`unsupported version ${version}`)
  const kind = r.read(2)
  let content: SharedContent
  if (kind === 2) {
    content = { kind: "exercise", exercise: readDefinition(r, readExercise(r)) }
  } else {
    if (kind > 1) throw new DecodeError("unknown share kind")
    const program = readProgram(r)
    const exercises = customCodes(program.days).map((code) => readDefinition(r, code))
    if (kind === 1 && (program.days.length !== 1 || !program.days[0].items.length)) throw new DecodeError("invalid workout")
    content = kind === 0 ? { kind: "program", program, exercises } : { kind: "workout", workout: program.days[0], exercises }
  }
  const expected = crc16(bits, r.pos)
  if (r.read(16) !== expected) throw new DecodeError("checksum mismatch")
  if (bits.length - r.pos >= 6 || bits.slice(r.pos).some((b) => b)) throw new DecodeError("trailing data")
  return content
}

function readProgram(r: BitReader): ProgramData {
  const hasName = r.bit()
  const hasWeights = r.bit()
  const hasNotes = r.bit()
  const hasSupersets = r.bit()
  const hasChecklists = r.bit()
  const hasSteps = r.bit()
  const name = hasName ? readText(r) : ""

  const dayCount = r.read(3) + 1
  const days: ProgramData["days"] = []
  const recent = new Recent()
  let lastNote = ""
  let lastStep = quarters(FIRST_STEP)
  for (let d = 0; d < dayCount; d++) {
    const dn = r.read(4)
    const dayName = dn === 15 ? readText(r) : DAY_NAMES[dn]
    const checklist = hasChecklists && r.bit()
    const count = r.varint()
    if (count > MAX_ITEMS) throw new DecodeError("too many items")
    const items: ProgramItem[] = []
    for (let i = 0; i < count; i++) {
      const superset = hasSupersets && i > 0 && r.bit()
      const ex = readExercise(r)
      let scheme: Scheme
      if (!r.bit()) scheme = recent.at(0)
      else if (!r.bit()) scheme = recent.at(1 + r.read(2))
      else {
        scheme = { sets: readSets(r), reps: readReps(r), rest: readRest(r) }
      }
      recent.use(scheme)
      if (scheme.sets < 1 || scheme.sets > 100 || (!checklist && !scheme.reps)) throw new DecodeError("invalid exercise scheme")
      const item: ProgramItem = { ex, ...scheme }
      if (superset) item.superset = true
      const weight = hasWeights ? readWeight(r) : undefined
      if (weight !== undefined) item.weight = weight
      if (hasSteps && r.bit()) {
        if (r.bit()) {
          lastStep = r.varint()
          if (!lastStep) throw new DecodeError("zero step")
        }
        item.inc = lastStep / 4
      }
      if (hasNotes && r.bit()) {
        if (!r.bit()) {
          if (!lastNote) throw new DecodeError("no note to repeat")
          item.note = lastNote
        } else item.note = lastNote = readText(r)
      }
      items.push(item)
    }
    days.push({ name: dayName, items, ...(checklist ? { mode: "checklist" } : {}) })
  }

  return { name, days }
}

function writeDefinition(w: BitWriter, exercise: CustomExercise) {
  if (!validCustomExercise(exercise)) throw new RangeError("invalid custom exercise")
  writeText(w, exercise.name)
  w.write(exercise.category ? CATEGORIES.indexOf(exercise.category) + 1 : 0, 3)
  w.write(exercise.equipment ? EQUIPMENT.indexOf(exercise.equipment) + 1 : 0, 5)
  const muscles = exercise.muscles ?? []
  w.bit(muscles.length > 0)
  if (muscles.length) w.write(muscles.reduce((mask, muscle) => mask | (1 << MUSCLES.indexOf(muscle)), 0), MUSCLES.length)
  w.bit(!!exercise.instructions)
  if (exercise.instructions) writeText(w, exercise.instructions)
}

function readDefinition(r: BitReader, code: number): CustomExercise {
  const name = readText(r, CUSTOM_NAME_LIMIT)
  const categoryIndex = r.read(3)
  const equipmentIndex = r.read(5)
  if (categoryIndex > CATEGORIES.length || equipmentIndex > EQUIPMENT.length) throw new DecodeError("invalid custom exercise fields")
  const mask = r.bit() ? r.read(MUSCLES.length) : 0
  const instructions = r.bit() ? readText(r, CUSTOM_INSTRUCTIONS_LIMIT) : undefined
  const exercise: CustomExercise = {
    code, name,
    ...(categoryIndex ? { category: CATEGORIES[categoryIndex - 1] } : {}),
    ...(equipmentIndex ? { equipment: EQUIPMENT[equipmentIndex - 1] } : {}),
    ...(mask ? { muscles: MUSCLES.filter((_, i) => mask & (1 << i)) } : {}),
    ...(instructions ? { instructions } : {}),
  }
  if (!validCustomExercise(exercise)) throw new DecodeError("invalid custom exercise")
  return exercise
}
