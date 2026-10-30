import type { Exercise } from "@/entities/exercise/types"
import { parseReps, targetReps } from "@/entities/program/types"
import type { SessionExercise, SetLog } from "./store"
import { isWarmup } from "./sets"

/** Empty equipment means nothing is available, rather than clearing the filter. */
export function replacementCandidates(list: Exercise[], source: Exercise, equipment: string[]) {
  return list.filter((ex) =>
    ex.c !== source.c && ex.cat === source.cat &&
    ex.pm.some((m) => source.pm.includes(m)) && equipment.includes(ex.eq),
  )
}

/** Keep completed work under its original code; never carry its weight to another exercise. */
export function replaceRemaining(e: SessionExercise, ex: number, previous?: SetLog[]): SessionExercise[] {
  const remaining = e.sets.filter((s) => !s.done && !isWarmup(s))
  if (ex === e.ex || !remaining.length) return [e]
  const done = e.sets.filter((s) => s.done)
  const parsed = parseReps(e.reps)
  const target = parsed.kind === "time" ? parsed.s : targetReps(e.reps)
  const replacement: SessionExercise = {
    ex, reps: e.reps, rest: e.rest,
    ...(e.superset ? { superset: true } : {}),
    sets: remaining.map((s, j) => {
      const p = previous?.[Math.min(j, previous.length - 1)]
      return { reps: target ?? p?.reps, weight: p?.weight, done: false, ...(s.type ? { type: s.type } : {}) }
    }),
  }
  return done.length ? [{ ...e, sets: done }, replacement] : [replacement]
}
