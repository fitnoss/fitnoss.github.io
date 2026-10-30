import { describe, expect, it } from "vitest"
import type { Session, SetLog } from "./store"
import { beatsRecord, exerciseMetrics, sessionSetCount, sessionVolume } from "./stats"

const session = (...sets: SetLog[]): Session => ({ id: "s", title: "", startedAt: 0, exercises: [{ ex: 1, reps: "5", rest: 90, sets }] })
const work = { done: true, weight: 60, reps: 5 }

describe("set statistics", () => {
  it("excludes both warmup formats and unfinished sets from every metric", () => {
    const sets: SetLog[] = [work,
      { done: true, type: "warmup", weight: 200, reps: 30 },
      { done: true, warmup: true, weight: 300, reps: 50 },
      { done: false, weight: 500, reps: 100 },
      { done: true, type: "drop", weight: 40, reps: 10 },
      { done: true, type: "failure", weight: 60, reps: 6, effort: { scale: "rir", value: 0 } },
    ]
    expect(exerciseMetrics(sets)).toEqual({ e1rm: 72, weight: 60, reps: 10, volume: 1060 })
    expect(sessionVolume(session(...sets))).toBe(1060)
    expect(sessionSetCount(session(...sets))).toBe(3)
  })
  it("returns finite zero metrics for warmup-only workouts", () => {
    expect(exerciseMetrics([{ done: true, type: "warmup", weight: 100, reps: 10 }])).toEqual({ e1rm: 0, weight: 0, reps: 0, volume: 0 })
  })
  it("does not report seconds held as repetitions lifted or as a one-rep max record", () => {
    const timed = session({ done: true, weight: 20, reps: 60 })
    timed.exercises[0].reps = "60s"
    expect(sessionVolume(timed)).toBe(0)
    expect(beatsRecord([session(work)], timed, 0, 0)).toBe(false)
    expect(beatsRecord([timed], session({ ...work, weight: 65 }), 0, 0)).toBe(false)
  })
  it("ignores warmups in record comparisons and never celebrates a warmup or unfinished set", () => {
    const history = [session(work, { ...work, type: "warmup", weight: 200 })]
    const active = session({ ...work, weight: 65 })
    expect(beatsRecord(history, active, 0, 0)).toBe(true)
    active.exercises[0].sets[0].type = "warmup"
    expect(beatsRecord(history, active, 0, 0)).toBe(false)
    delete active.exercises[0].sets[0].type
    active.exercises[0].sets[0].done = false
    expect(beatsRecord(history, active, 0, 0)).toBe(false)
    expect(beatsRecord([session({ ...work, type: "warmup" })], session(work), 0, 0)).toBe(false)
  })
})
