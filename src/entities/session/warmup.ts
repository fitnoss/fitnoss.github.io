import type { SetLog } from "./store"

/** Ramp to the working weight: share of it and reps. An empty bar for ten comes first on a barbell. */
const RAMP = [
  [0.4, 5],
  [0.6, 3],
  [0.8, 2],
] as const
const BAR_REPS = 10

export type WarmupGear = {
  /** Bar weight for barbell exercises, 0 otherwise. */
  bar: number
  /** Warm-up weights are rounded down to a multiple of this. */
  step: number
}

/** How an exercise's equipment loads, or undefined when there is no weight to ramp up to. */
export function warmupGear(eq: string, barWeight: number, plates: number[]): WarmupGear | undefined {
  switch (eq) {
    case "barbell":
      // Plates go on in pairs, so the smallest jump is two of the lightest plate.
      return { bar: barWeight, step: 2 * Math.min(...plates, 1.25) }
    case "dumbbell":
    case "kettlebell":
      return { bar: 0, step: 1 }
    case "cable":
    case "machine":
    case "ezbar":
    case "other":
      return { bar: 0, step: 2.5 }
  }
}

/**
 * Warm-up sets before a working weight: the empty bar, then 40% × 5, 60% × 3 and 80% × 2,
 * skipping any that would be no heavier than the previous one or reach the working weight.
 */
export function warmupSets(work: number, { bar, step }: WarmupGear): Pick<SetLog, "weight" | "reps">[] {
  const out: Pick<SetLog, "weight" | "reps">[] = []
  if (bar > 0 && work > bar) out.push({ weight: bar, reps: BAR_REPS })
  for (const [share, reps] of RAMP) {
    const weight = Math.round(Math.floor((work * share) / step + 1e-9) * step * 100) / 100
    const prev = out.at(-1)?.weight ?? 0
    if (weight > prev && weight > bar && weight < work) out.push({ weight, reps })
  }
  return out
}
