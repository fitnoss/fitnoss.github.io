import { describe, expect, it } from "vitest"
import type { Exercise } from "@/entities/exercise/types"
import { programMuscleVolume } from "./volume"
import type { ProgramData, ProgramItem } from "./types"

const exercises = new Map<number, Exercise>([
  [1, { c: 1, pm: ["chest", "chest"], sm: ["chest", "triceps", "triceps"] } as Exercise],
  [2, { c: 2, pm: ["triceps"], sm: [] } as unknown as Exercise],
])
const item = (ex: number, sets: number): ProgramItem => ({ ex, sets, reps: "8-12", rest: 60 })
const program = (days: ProgramData["days"]): ProgramData => ({ name: "Test", days })

describe("program muscle volume", () => {
  it("counts repeated weekdays, all days and both sides of a superset without duplicating muscles", () => {
    const { volume, weekly } = programMuscleVolume(program([
      { name: "A", weekdays: [0, 3], items: [item(1, 3), { ...item(2, 2), superset: true }] },
      { name: "B", weekdays: [5], items: [item(1, 4)] },
      { name: "Empty", items: [] },
    ]), exercises)
    expect(weekly).toBe(true)
    expect(volume.chest).toEqual({ primary: 10, secondary: 0 })
    expect(volume.triceps).toEqual({ primary: 4, secondary: 10 })
    expect(volume.calves).toEqual({ primary: 0, secondary: 0 })
  })

  it("counts one full cycle when scheduling is absent or incomplete", () => {
    for (const weekdays of [undefined, []]) {
      const { volume, weekly } = programMuscleVolume(program([
        { name: "A", weekdays: [0, 2, 4], items: [item(1, 3)] },
        { name: "B", weekdays, items: [item(1, 2)] },
      ]), exercises)
      expect(weekly).toBe(false)
      expect(volume.chest.primary).toBe(5)
    }
  })

  it("reports unknown exercises without treating their muscles as known", () => {
    const result = programMuscleVolume(program([
      { name: "A", items: [item(999, 3), item(999, 2), item(1, 1)] },
    ]), exercises)
    expect(result.missingExercises).toBe(1)
    expect(result.volume.chest.primary).toBe(1)
  })

  it("recalculates after editing the plan and handles an empty program", () => {
    const plan = program([{ name: "A", items: [item(1, 3)] }])
    expect(programMuscleVolume(plan, exercises).volume.chest.primary).toBe(3)
    plan.days[0].items[0].sets = 5
    expect(programMuscleVolume(plan, exercises).volume.chest.primary).toBe(5)
    plan.days[0].items = []
    const result = programMuscleVolume(plan, exercises)
    expect(result.weekly).toBe(false)
    expect(Object.values(result.volume).every(({ primary, secondary }) => !primary && !secondary)).toBe(true)
  })
})
