import { describe, expect, it } from "vitest"
import { isCountedSet, isMainSet, isWarmup, setType, updateSetLog, validEffort } from "./sets"

describe("set types and effort", () => {
  it("reads existing sets and lets a new type override the legacy warmup flag", () => {
    expect(setType({ done: true })).toBe("work")
    expect(isWarmup({ done: true, warmup: true })).toBe(true)
    const set = updateSetLog({ done: true, warmup: true }, { type: "failure" })
    expect(set.warmup).toBeUndefined()
    expect(isMainSet(set)).toBe(true)
    expect(isCountedSet(set)).toBe(true)
    expect(isMainSet({ done: true, type: "drop" })).toBe(false)
  })
  it("accepts half-point RPE and zero RIR but rejects invalid effort", () => {
    expect(validEffort({ scale: "rpe", value: 8.5 })).toEqual({ scale: "rpe", value: 8.5 })
    expect(validEffort({ scale: "rir", value: 0 })).toEqual({ scale: "rir", value: 0 })
    for (const value of [0, 10.5, 8.2, NaN, Infinity]) expect(validEffort({ scale: "rpe", value })).toBeUndefined()
    for (const value of [-1, 11, 1.5, NaN]) expect(validEffort({ scale: "rir", value })).toBeUndefined()
  })
  it("clears effort independently of type and completed status", () => {
    const set = { done: true, effort: { scale: "rpe" as const, value: 9 } }
    expect(updateSetLog(set, { effort: undefined })).toEqual({ done: true, effort: undefined })
    expect(set.effort.value).toBe(9)
  })
})
