import type { Session, SetLog } from "./store"
import { isCountedSet } from "./sets"
import { parseReps } from "@/entities/program/types"

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
  if (parseReps(active.exercises[i].reps).kind === "time") return false
  const set = active.exercises[i].sets[j]
  const score = e1rm(set.weight ?? 0, set.reps ?? 0)
  if (!score || !isCountedSet(set)) return false
  const logged = history.flatMap((s) => s.exercises.filter((e) => e.ex === ex && parseReps(e.reps).kind !== "time").flatMap((e) => e.sets)).filter(isCountedSet)
  if (!logged.length) return false
  const today = active.exercises.flatMap((e, k) => (e.ex === ex && parseReps(e.reps).kind !== "time" ? e.sets.filter((x, m) => isCountedSet(x) && !(k === i && m === j)) : []))
  return [...logged, ...today].every((x) => e1rm(x.weight ?? 0, x.reps ?? 0) < score)
}

export function sessionVolume(s: Session) {
  return s.exercises.reduce((sum, e) => sum + (parseReps(e.reps).kind === "time" ? 0 : exerciseMetrics(e.sets).volume), 0)
}

export function sessionSetCount(s: Session) {
  return s.exercises.reduce((n, e) => n + e.sets.filter(isCountedSet).length, 0)
}

export function exerciseMetrics(sets: SetLog[]) {
  const counted = sets.filter(isCountedSet)
  return {
    e1rm: Math.max(0, ...counted.map((s) => e1rm(s.weight ?? 0, s.reps ?? 0))),
    weight: Math.max(0, ...counted.map((s) => s.weight ?? 0)),
    reps: Math.max(0, ...counted.map((s) => s.reps ?? 0)),
    volume: counted.reduce((n, s) => n + (s.weight ?? 0) * (s.reps ?? 0), 0),
  }
}
