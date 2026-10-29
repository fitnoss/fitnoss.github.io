import { describe, expect, it } from "vitest"
import { warmupGear, warmupSets } from "./warmup"
import { beatsRecord } from "./stats"
import type { Session, SetLog } from "./store"

const barbell = warmupGear("barbell", 20, [25, 20, 15, 10, 5, 2.5, 1.25])!

describe("warm-up sets", () => {
  it("ramps a barbell from the empty bar", () => {
    expect(warmupSets(100, barbell)).toEqual([
      { weight: 20, reps: 10 },
      { weight: 40, reps: 5 },
      { weight: 60, reps: 3 },
      { weight: 80, reps: 2 },
    ])
  })

  it("rounds down to loadable weights and skips sets no heavier than the bar", () => {
    expect(warmupSets(62.5, barbell)).toEqual([
      { weight: 20, reps: 10 },
      { weight: 25, reps: 5 },
      { weight: 37.5, reps: 3 },
      { weight: 50, reps: 2 },
    ])
    expect(warmupSets(30, barbell)).toEqual([
      { weight: 20, reps: 10 },
      { weight: 22.5, reps: 2 },
    ])
    expect(warmupSets(20, barbell)).toEqual([])
  })

  it("has no bar for dumbbells and nothing to ramp for bodyweight", () => {
    expect(warmupSets(20, warmupGear("dumbbell", 20, [])!)).toEqual([
      { weight: 8, reps: 5 },
      { weight: 12, reps: 3 },
      { weight: 16, reps: 2 },
    ])
    expect(warmupGear("body", 20, [])).toBeUndefined()
  })
})

describe("records", () => {
  const done = (weight: number, reps: number, warmup?: true): SetLog => ({ weight, reps, done: true, ...(warmup && { warmup }) })
  const session = (...sets: SetLog[]): Session => ({ id: "s", title: "", startedAt: 0, exercises: [{ ex: 1, reps: "5", rest: 90, sets }] })
  const history = [session(done(100, 5), done(100, 4))]

  it("beats the best estimated 1RM, this workout included", () => {
    expect(beatsRecord(history, session(done(100, 6)), 0, 0)).toBe(true)
    expect(beatsRecord(history, session(done(100, 5)), 0, 0)).toBe(false)
    expect(beatsRecord(history, session(done(102.5, 6), done(100, 6)), 0, 1)).toBe(false)
  })

  it("ignores warm-ups and first-time exercises", () => {
    expect(beatsRecord(history, session(done(120, 5, true)), 0, 0)).toBe(false)
    expect(beatsRecord([], session(done(100, 5)), 0, 0)).toBe(false)
  })
})
