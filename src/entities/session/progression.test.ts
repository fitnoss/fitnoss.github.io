import { describe, expect, it } from "vitest"
import type { ProgramItem } from "@/entities/program/types"
import { progression } from "./progression"
import type { Session, SetLog } from "./store"

const sets = (...xs: [weight: number, reps: number][]): SetLog[] => xs.map(([weight, reps]) => ({ weight, reps, done: true }))
/** History newest first, one workout per entry. */
const history = (...workouts: SetLog[][]): Session[] =>
  workouts.map((s, i) => ({ id: String(i), title: "", startedAt: -i, exercises: [{ ex: 1, reps: "5", rest: 90, sets: s }] }))
const item = (patch: Partial<ProgramItem> = {}): ProgramItem => ({ ex: 1, sets: 3, reps: "5", rest: 90, inc: 2.5, ...patch })
const weights = (h: Session[], it = item()) => progression(h, it)?.sets.map((s) => s.weight)

describe("linear progression", () => {
  it("starts from the program weight", () => {
    expect(progression([], item({ weight: 60 }))).toEqual({ sets: [0, 1, 2].map(() => ({ weight: 60, reps: 5 })) })
  })

  it("adds the step after a clean workout", () => {
    const p = progression(history(sets([60, 5], [60, 5], [60, 6])), item())
    expect(p?.change).toBe("up")
    expect(p?.sets.map((s) => s.weight)).toEqual([62.5, 62.5, 62.5])
  })

  it("repeats the weight after a missed rep, a missing set or a lighter set", () => {
    expect(weights(history(sets([60, 5], [60, 5], [60, 4])))).toEqual([60, 60, 60])
    expect(weights(history(sets([60, 5], [60, 5])))).toEqual([60, 60, 60])
    expect(weights(history(sets([60, 5], [60, 5], [55, 5])))).toEqual([60, 60, 60])
  })

  it("deloads by 10% after three failed workouts at the same weight", () => {
    const fail = sets([100, 5], [100, 4], [100, 3])
    expect(progression(history(fail, fail), item())?.change).toBeUndefined()
    const p = progression(history(fail, fail, fail), item())
    expect(p?.change).toBe("deload")
    expect(p?.sets[0].weight).toBe(90)
    // Failures at another weight don't count.
    expect(progression(history(fail, fail, sets([97.5, 4], [97.5, 4], [97.5, 4])), item())?.change).toBeUndefined()
    // Rounds down to the step.
    expect(weights(history(...Array(3).fill(sets([62.5, 1]))))?.[0]).toBe(55)
  })

  it("uses the program's set count, not the logged one", () => {
    expect(progression(history(sets([60, 5], [60, 5])), item({ sets: 2 }))?.change).toBe("up")
  })
})

describe("double progression", () => {
  const range = item({ reps: "8-12" })

  it("adds a rep per set until every set reaches the top", () => {
    const p = progression(history(sets([40, 12], [40, 10], [40, 7])), range)
    expect(p?.change).toBeUndefined()
    expect(p?.sets).toEqual([{ weight: 40, reps: 12 }, { weight: 40, reps: 11 }, { weight: 40, reps: 8 }])
  })

  it("adds the step and goes back to the bottom of the range", () => {
    const p = progression(history(sets([40, 12], [40, 12], [40, 12])), range)
    expect(p).toEqual({ change: "up", sets: [0, 1, 2].map(() => ({ weight: 42.5, reps: 8 })) })
  })
})

describe("without progression", () => {
  it("skips exercises with no step or a scheme without reps to beat", () => {
    const h = history(sets([60, 5], [60, 5], [60, 5]))
    expect(progression(h, item({ inc: undefined }))).toBeUndefined()
    expect(progression(h, item({ reps: "amrap" }))).toBeUndefined()
    expect(progression(h, item({ reps: "30s" }))).toBeUndefined()
  })
})
