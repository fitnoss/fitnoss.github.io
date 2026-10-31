import { describe, expect, it } from "vitest"
import { weeklyActivity } from "./activity"

const at = (day: number, hour = 12) => new Date(2026, 9, day, hour).getTime()
const sessions = (...days: number[]) => days.map((day) => ({ startedAt: at(day) }))

describe("weekly activity", () => {
  it("shows the current Monday–Sunday week rather than a rolling seven days", () => {
    const stats = weeklyActivity(sessions(25, 26, 26, 30, 31, 32), at(31))
    expect(stats.week.map(({ d }) => new Date(d).getDay())).toEqual([1, 2, 3, 4, 5, 6, 0])
    expect(stats.week.map(({ on }) => on)).toEqual([true, false, false, false, true, true, false])
    expect(stats.thisWeek).toBe(4)
    expect(stats.week.every(({ d }) => new Date(d).getHours() === 0)).toBe(true)
  })
  it("keeps the streak while the current week has no workouts, then resets after a missed week", () => {
    expect(weeklyActivity(sessions(12, 19), at(31)).streak).toBe(2)
    expect(weeklyActivity(sessions(12), at(31)).streak).toBe(0)
    expect(weeklyActivity(sessions(12, 19, 26), at(31)).streak).toBe(3)
    expect(weeklyActivity([], at(31)).streak).toBe(0)
  })
})
