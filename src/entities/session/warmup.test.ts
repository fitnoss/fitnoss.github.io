import { describe, expect, it } from "vitest"
import { warmupGear, warmupSets } from "./warmup"

const barbell = warmupGear("barbell", 20, [25, 20, 15, 10, 5, 2.5, 1.25])!

describe("warm-up sets", () => {
  it("ramps a barbell from the empty bar", () => {
    expect(warmupSets(100, barbell)).toEqual([
      { weight: 20, reps: 10 },
      { weight: 40, reps: 5 },
      { weight: 60, reps: 3 },
      { weight: 80, reps: 2 },
    ])
  })

  it("rounds down to loadable weights and skips sets no heavier than the bar", () => {
    expect(warmupSets(62.5, barbell)).toEqual([
      { weight: 20, reps: 10 },
      { weight: 25, reps: 5 },
      { weight: 37.5, reps: 3 },
      { weight: 50, reps: 2 },
    ])
    expect(warmupSets(30, barbell)).toEqual([
      { weight: 20, reps: 10 },
      { weight: 22.5, reps: 2 },
    ])
    expect(warmupSets(20, barbell)).toEqual([])
  })

  it("has no bar for dumbbells and nothing to ramp for bodyweight", () => {
    expect(warmupSets(20, warmupGear("dumbbell", 20, [])!)).toEqual([
      { weight: 8, reps: 5 },
      { weight: 12, reps: 3 },
      { weight: 16, reps: 2 },
    ])
    expect(warmupGear("body", 20, [])).toBeUndefined()
  })
})
