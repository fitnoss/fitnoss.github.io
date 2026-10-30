import { describe, expect, it } from "vitest"
import { applyFilters, EMPTY_FILTERS, stem } from "./filters"
import MiniSearch from "minisearch"
import type { Exercise } from "@/entities/exercise/types"

describe("stem", () => {
  it("collapses Russian and English word forms", () => {
    expect(stem("Приседания")).toBe(stem("приседание"))
    expect(stem("приседа")).toBe(stem("присед"))
    expect(stem("отжимания")).toBe(stem("отжимание"))
    expect(stem("squats")).toBe(stem("squat"))
    expect(stem("жим")).toBe("жим")
  })
})

describe("equipment filters", () => {
  it("finds the secondary band without treating assisted pull-ups as an exercise with no equipment", () => {
    const exercise = { c: 1, eq: "pullupbar", eqExtra: ["bands"], pl: ["bars", "gym"] } as Exercise
    const index = new MiniSearch({ fields: ["name"] })
    expect(applyFilters([exercise], { ...EMPTY_FILTERS, equipment: ["bands"] }, index, [])).toEqual([exercise])
    expect(applyFilters([exercise], { ...EMPTY_FILTERS, equipment: ["body"] }, index, [])).toEqual([])
  })
})
