import { describe, expect, it } from "vitest"
import { stem } from "./filters"

describe("stem", () => {
  it("collapses Russian and English word forms", () => {
    expect(stem("Приседания")).toBe(stem("приседание"))
    expect(stem("приседа")).toBe(stem("присед"))
    expect(stem("отжимания")).toBe(stem("отжимание"))
    expect(stem("squats")).toBe(stem("squat"))
    expect(stem("жим")).toBe("жим")
  })
})
