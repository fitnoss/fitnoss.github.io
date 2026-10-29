import type { Session } from "./store"

/** Epley estimated one-rep max. */
export function e1rm(weight: number, reps: number) {
  if (!weight || !reps) return 0
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

/**
 * Whether set j of exercise i in the running workout beats the best estimated 1RM for that
 * exercise, earlier sets of this workout included. The first time an exercise is logged sets no record.
 */
export function beatsRecord(history: Session[], active: Session, i: number, j: number) {
  const { ex } = active.exercises[i]
  const set = active.exercises[i].sets[j]
  const score = e1rm(set.weight ?? 0, set.reps ?? 0)
  if (!score || set.warmup) return false
  const logged = history.flatMap((s) => s.exercises.filter((e) => e.ex === ex).flatMap((e) => e.sets))
  if (!logged.length) return false
  const today = active.exercises.flatMap((e, k) => (e.ex === ex ? e.sets.filter((x, m) => x.done && !x.warmup && !(k === i && m === j)) : []))
  return [...logged, ...today].every((x) => e1rm(x.weight ?? 0, x.reps ?? 0) < score)
}

export function sessionVolume(s: Session) {
  return s.exercises.reduce((sum, e) => sum + e.sets.reduce((a, x) => a + (x.weight ?? 0) * (x.reps ?? 0), 0), 0)
}
