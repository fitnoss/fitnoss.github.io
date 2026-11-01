import { describe, expect, it } from "vitest"
import { templateDuration, TEMPLATES } from "./templates"

describe("template session estimates", () => {
  it("includes timed work and inter-set rest but not rest after the final set", () => {
    expect(templateDuration([{ name: "", items: [{ ex: 3, sets: 3, reps: "60s", rest: 120 }] }])).toEqual({ min: 5, max: 10 })
  })
  it("does not add a rest between linked exercises", () => {
    const first = { ex: 0, sets: 3, reps: "10", rest: 300 }
    const second = { ex: 2, sets: 3, reps: "10", rest: 60 }
    const straight = templateDuration([{ name: "", items: [first, second] }])
    const superset = templateDuration([{ name: "", items: [first, { ...second, superset: true }] }])
    expect(straight.min).toBeGreaterThan(superset.max)
  })
  it("bounds every scheduled template, including range and open-ended targets", () => {
    for (const template of TEMPLATES) {
      const { min, max } = templateDuration(template.days)
      expect(min).toBeGreaterThan(0)
      expect(max).toBeGreaterThanOrEqual(min)
      expect(max).toBeLessThan(120)
      expect(template.experience.ru).toBeTruthy()
      expect(template.experience.en).toBeTruthy()
    }
    expect(templateDuration([])).toEqual({ min: 0, max: 0 })
  })
})
