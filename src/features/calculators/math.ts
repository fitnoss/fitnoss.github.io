export function oneRepMax(weight: number, reps: number) {
  if (weight <= 0 || reps <= 0) return { epley: 0, brzycki: 0, avg: 0 }
  if (reps === 1) return { epley: weight, brzycki: weight, avg: weight }
  const epley = weight * (1 + reps / 30)
  const brzycki = reps < 37 ? (weight * 36) / (37 - reps) : epley
  return { epley, brzycki, avg: (epley + brzycki) / 2 }
}

/** Approximate reps you can do at a given % of 1RM (inverse Epley). */
export function repsAtPercent(pct: number) {
  return pct >= 100 ? 1 : Math.max(1, Math.round(30 * (100 / pct - 1)))
}

/**
 * Greedy plate loading per side. `pairs` is how many pairs of each plate you own
 * (Infinity when unlimited). Returns the plates for one side and what's left over.
 */
export function platesPerSide(target: number, bar: number, plates: number[], pairs?: Record<number, number>) {
  let side = Math.round(((target - bar) / 2) * 1000) / 1000
  const result: number[] = []
  if (side <= 0) return { plates: result, remainder: Math.max(0, target - bar) }
  for (const p of [...plates].sort((a, b) => b - a)) {
    let left = pairs?.[p] ?? Infinity
    while (side + 1e-9 >= p && left > 0) {
      result.push(p)
      side = Math.round((side - p) * 1000) / 1000
      left--
    }
  }
  return { plates: result, remainder: side * 2 }
}

export function bmi(weightKg: number, heightCm: number) {
  if (weightKg <= 0 || heightCm <= 0) return 0
  const m = heightCm / 100
  return weightKg / (m * m)
}

export type BmiClass = "under" | "normal" | "over" | "obese"

export function bmiClass(v: number): BmiClass {
  if (v < 18.5) return "under"
  if (v < 25) return "normal"
  if (v < 30) return "over"
  return "obese"
}

export const ACTIVITY = { sedentary: 1.2, light: 1.375, moderate: 1.55, high: 1.725, extreme: 1.9 } as const
export type Activity = keyof typeof ACTIVITY

/** Mifflin–St Jeor BMR and TDEE. */
export function calories(sex: "m" | "f", weightKg: number, heightCm: number, age: number, activity: Activity) {
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "m" ? 5 : -161)
  const tdee = bmr * ACTIVITY[activity]
  return { bmr, tdee, cut: tdee * 0.8, bulk: tdee * 1.1 }
}
