import { describe, expect, it } from "vitest"
import { bmi, bmiClass, calories, oneRepMax, platesPerSide, repsAtPercent } from "./math"

describe("calculators", () => {
  it("estimates 1RM", () => {
    expect(oneRepMax(100, 1).avg).toBe(100)
    expect(oneRepMax(100, 10).epley).toBeCloseTo(133.33, 1)
    expect(oneRepMax(100, 10).brzycki).toBeCloseTo(133.33, 1)
    expect(oneRepMax(0, 5).avg).toBe(0)
  })

  it("maps percent to reps", () => {
    expect(repsAtPercent(100)).toBe(1)
    expect(repsAtPercent(75)).toBe(10)
  })

  it("loads plates per side", () => {
    expect(platesPerSide(100, 20, [25, 20, 15, 10, 5, 2.5, 1.25]).plates).toEqual([25, 15])
    expect(platesPerSide(62.5, 20, [25, 20, 15, 10, 5, 2.5, 1.25]).plates).toEqual([20, 1.25])
    expect(platesPerSide(20, 20, [25]).plates).toEqual([])
    const limited = platesPerSide(120, 20, [25, 10], { 25: 1, 10: 5 })
    expect(limited.plates).toEqual([25, 10, 10])
    expect(limited.remainder).toBeCloseTo(10)
  })

  it("computes BMI and calories", () => {
    expect(bmi(80, 180)).toBeCloseTo(24.69, 1)
    expect(bmiClass(24.69)).toBe("normal")
    expect(calories("m", 80, 180, 30, "moderate").bmr).toBeCloseTo(1780, 0)
  })
})
