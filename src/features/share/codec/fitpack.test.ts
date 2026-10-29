import { describe, expect, it } from "vitest"
import fc from "fast-check"
import type { ProgramData } from "@/entities/program/types"
import { BitReader, BitWriter } from "./bits"
import { DAY_NAMES, DecodeError, decodeProgram, encodeProgram } from "./fitpack"
import { readText, writeText } from "./text"

const item = (ex: number, sets = 3, reps = "10", rest = 90) => ({ ex, sets, reps, rest })

const split: ProgramData = {
  name: "Мой сплит",
  days: [
    { name: "@chest_triceps", items: [item(5, 4, "8-12", 120), item(17, 4, "8-12", 120), item(18), item(28), item(40), item(8)] },
    { name: "@back_biceps", items: [item(6, 4, "5", 180), item(1, 4, "8-12", 120), item(12), item(13), item(14), item(16)] },
    { name: "@legs", items: [item(4, 4, "6-8", 180), item(22), item(23, 3, "12"), item(24), item(25), item(26, 4, "15", 60)] },
    { name: "@shoulders", items: [item(11, 4, "8-12", 120), item(20, 3, "12", 60), item(36), item(49), item(50), item(29)] },
  ],
}

describe("text", () => {
  const roundTrip = (s: string) => {
    const w = new BitWriter()
    writeText(w, s)
    return { out: readText(new BitReader(w.bits)), bits: w.bits.length }
  }

  it("round-trips mixed text", () => {
    for (const s of ["Мой сплит", "Push Pull Legs", "Ёлка Ъ 3x10 (база)!", "5/3/1 Wendler", "🔥 Жиросжигание", ""]) {
      expect(roundTrip(s).out).toBe(s)
    }
  })

  it("packs a 9-letter Russian word into ~55 bits", () => {
    expect(roundTrip("Мой сплит").bits).toBeLessThanOrEqual(56)
  })

  it("round-trips arbitrary strings", () => {
    fc.assert(fc.property(fc.string({ maxLength: 40, unit: "grapheme" }), (s) => roundTrip(s).out === s))
  })
})

describe("fitpack", () => {
  it("round-trips a 4-day split in a short link", () => {
    const code = encodeProgram(split)
    expect(decodeProgram(code)).toEqual(split)
    expect(code.length).toBeLessThanOrEqual(66)
  })

  it("encodes a nameless 3×5 program in ~30 chars", () => {
    const p: ProgramData = {
      name: "",
      days: [0, 1, 2].map(() => ({ name: "", items: [0, 1, 2, 3, 4].map((ex) => item(ex)) })),
    }
    const code = encodeProgram(p)
    expect(decodeProgram(code)).toEqual(p)
    expect(code.length).toBeLessThanOrEqual(30)
  })

  it("keeps weights, notes, rare exercises and odd schemes", () => {
    const p: ProgramData = {
      name: "Test",
      days: [
        {
          name: "Custom day",
          items: [
            { ex: 875, sets: 12, reps: "7", rest: 75, weight: 62.5, note: "пауза внизу" },
            { ex: 300, sets: 5, reps: "3-5", rest: 300 },
            { ex: 63, sets: 3, reps: "40s", rest: 30, weight: 0.5 },
            { ex: 64, sets: 3, reps: "amrap", rest: 90 },
          ],
        },
      ],
    }
    expect(decodeProgram(encodeProgram(p))).toEqual(p)
  })

  it("round-trips random programs", () => {
    const repsArb = fc.oneof(
      fc.constantFrom("5", "10", "8-12", "30s", "amrap", "max"),
      fc.integer({ min: 1, max: 200 }).map(String),
      fc.tuple(fc.integer({ min: 1, max: 30 }), fc.integer({ min: 0, max: 30 })).map(([a, d]) => `${a}-${a + d}`),
      fc.integer({ min: 1, max: 600 }).map((s) => `${s}s`),
    )
    const itemArb = fc.record(
      {
        ex: fc.oneof(fc.integer({ min: 0, max: 2000 }), fc.integer({ min: 0, max: 1_000_000 })),
        sets: fc.integer({ min: 1, max: 30 }),
        reps: repsArb,
        rest: fc.integer({ min: 0, max: 120 }).map((n) => n * 5),
        weight: fc.integer({ min: 1, max: 800 }).map((n) => n / 2),
        note: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim() === s && s.length > 0),
      },
      { requiredKeys: ["ex", "sets", "reps", "rest"] },
    )
    const dayArb = fc.record({
      name: fc.oneof(fc.constantFrom(...DAY_NAMES), fc.string({ maxLength: 20 }).map((s) => s.trim())),
      items: fc.array(itemArb, { maxLength: 10 }),
    })
    const programArb = fc.record({
      name: fc.string({ maxLength: 30 }).map((s) => s.trim()),
      days: fc.array(dayArb, { minLength: 1, maxLength: 8 }),
    })
    fc.assert(fc.property(programArb, (p) => { expect(decodeProgram(encodeProgram(p))).toEqual(p) }))
  })

  it("supports any number of exercises; existing codes keep their cost", () => {
    const len = (ex: number) => {
      const p: ProgramData = { name: "", days: [{ name: "", items: [item(ex)] }] }
      expect(decodeProgram(encodeProgram(p))).toEqual(p)
      return encodeProgram(p).length
    }
    for (const ex of [0, 63, 64, 319, 320, 1343, 1344, 5439, 5440, 123_456, 9_999_999]) len(ex)
    expect(len(0)).toBeLessThan(len(5000))
    expect(len(9_999_999)).toBeLessThanOrEqual(len(0) + 5)
  })

  it("rejects truncated and corrupted links", () => {
    const code = encodeProgram(split)
    expect(() => decodeProgram(code.slice(0, -3))).toThrow(DecodeError)
    const flipped = code.slice(0, 10) + (code[10] === "A" ? "B" : "A") + code.slice(11)
    expect(() => decodeProgram(flipped)).toThrow(DecodeError)
    expect(() => decodeProgram("not*valid")).toThrow(DecodeError)
  })

  it("keeps v1 links stable", () => {
    // If this changes, old links break. Bump the version instead.
    expect(encodeProgram(split)).toMatchSnapshot()
  })
})
