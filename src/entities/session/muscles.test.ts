import { describe, expect, it } from "vitest"
import type { Exercise } from "@/entities/exercise/types"
import { MUSCLES } from "@/entities/exercise/types"
import { front, back } from "@/shared/components/muscle-map-data"
import type { Session, SetLog } from "./store"
import { calendarWeek, weeklyMuscleVolume } from "./muscles"

const now = new Date(2026, 9, 31, 12).getTime()
const exercises = new Map<number, Exercise>([
  [1, { c: 1, pm: ["chest", "chest"], sm: ["triceps", "triceps", "chest"] } as Exercise],
  [2, { c: 2, pm: ["abdominals"], sm: [] } as unknown as Exercise],
])
function session(startedAt: number, sets: SetLog[], ex = 1): Session {
  return { id: String(startedAt), title: "", startedAt, exercises: [{ ex, reps: "30s", rest: 60, sets }] }
}

describe("weekly muscle volume", () => {
  it("counts completed sets once per muscle and keeps indirect work separate", () => {
    const history = [session(now, [
      { done: true }, { done: true, type: "drop" }, { done: true, type: "failure" },
      { done: true, type: "warmup" }, { done: true, warmup: true }, { done: false },
    ]), session(now, [{ done: true }], 2), session(now, [{ done: true }], 999)]
    const volume = weeklyMuscleVolume(history, exercises, now)
    expect(volume.chest).toEqual({ primary: 3, secondary: 0 })
    expect(volume.triceps).toEqual({ primary: 0, secondary: 3 })
    expect(volume.abdominals.primary).toBe(1) // Timed/bodyweight sets need no weight.
    expect(volume.calves).toEqual({ primary: 0, secondary: 0 })
  })

  it("uses the current local Monday and excludes previous weeks and future dates", () => {
    const { start, end } = calendarWeek(now)
    expect(new Date(start).getDay()).toBe(1)
    expect(new Date(start).getHours()).toBe(0)
    expect(new Date(end).getDate()).toBe(2)
    const history = [start - 1, start, now, now + 1, end].map((at) => session(at, [{ done: true }]))
    expect(weeklyMuscleVolume(history, exercises, now).chest.primary).toBe(2)
    expect(calendarWeek(new Date(2026, 10, 1, 23, 59).getTime())).toEqual({ start, end })
    expect(calendarWeek(end).start).toBe(end)
  })

  it("recalculates from edited or deleted history, without storing derived totals", () => {
    const history = [session(now, [{ done: true }])]
    expect(weeklyMuscleVolume(history, exercises, now).chest.primary).toBe(1)
    history[0].exercises[0].sets[0].done = false
    expect(weeklyMuscleVolume(history, exercises, now).chest.primary).toBe(0)
    expect(Object.values(weeklyMuscleVolume([], exercises, now)).every((v) => !v.primary && !v.secondary)).toBe(true)
  })

  it("provides a selectable diagram region for every catalogue muscle", () => {
    const regions = new Set([...front, ...back].map((region) => region.muscle).filter(Boolean))
    expect([...regions].sort()).toEqual([...MUSCLES].sort())
  })
})
