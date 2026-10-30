import { describe, expect, it } from "vitest"
import type { Session } from "@/entities/session/store"
import { exercisePoints, metricPeriod } from "./progress"

const DAY = 86_400_000
const entry = (id: string, at: number, weight: number, reps: string = "8"): Session => ({
  id, title: "", startedAt: at, exercises: [{
    ex: 1, reps, rest: 90, sets: [{ done: true, weight, reps: reps.endsWith("s") ? 30 : 8 }],
  }],
})

describe("exercise progress with units and periods", () => {
  it("keeps durations separate from repetitions and never turns seconds into estimated max or volume", () => {
    const points = exercisePoints([entry("time", 1, 10, "30s"), entry("reps", 2, 60)], 1)
    expect(points[0].values).toEqual({ duration: 30, weight: 10, e1rm: undefined, volume: undefined, reps: undefined })
    expect(points[1].values.reps).toBe(8)
    expect(points[1].values.duration).toBeUndefined()
    expect(metricPeriod(points, "duration", "all", 3).current.map((point) => point.id)).toEqual(["time"])
  })
  it("compares adjacent periods without counting the boundary twice or including future dates", () => {
    const now = 100 * DAY
    const points = exercisePoints([
      entry("old", now - 57 * DAY, 100), entry("previous", now - 28 * DAY, 60),
      entry("current", now - 2 * DAY, 65), entry("future", now + DAY, 120),
    ], 1)
    const result = metricPeriod(points, "weight", "28", now)
    expect(result.current.map((point) => point.id)).toEqual(["current"])
    expect(result.previous.map((point) => point.id)).toEqual(["previous"])
    expect(result.best).toBe(65)
    expect(result.previousBest).toBe(60)
  })
  it("preserves workouts recorded at the same timestamp and ignores unfinished or warmup-only results", () => {
    const first = entry("a", 1, 60), second = entry("b", 1, 65), warmup = entry("w", 1, 200)
    warmup.exercises[0].sets[0].type = "warmup"
    const pending = entry("p", 1, 300)
    pending.exercises[0].sets[0].done = false
    expect(exercisePoints([first, second, warmup, pending], 1).map((point) => point.id)).toEqual(["a", "b"])
  })
})
