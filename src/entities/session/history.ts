import type { Session, SessionExercise } from "./store"

/** Elapsed training time excludes the time between finishing and resuming a session. */
export function sessionDuration(session: Session, now = Date.now()) {
  return Math.max(0, (session.endedAt ?? now) - session.startedAt - (session.pausedMs ?? 0))
}

/** Merge edited results back into the saved plan without losing any unfinished sets. */
export function syncUnfinishedPlan(plan: SessionExercise[], exercises: SessionExercise[]) {
  let exerciseIndex = 0
  return plan.map((exercise) => {
    if (!exercise.sets.some((set) => set.done)) return exercise
    const edited = exercises[exerciseIndex++]
    if (!edited || edited.ex !== exercise.ex) return exercise
    let setIndex = 0
    return {
      ...exercise,
      note: edited.note,
      sets: exercise.sets.map((set) => {
        if (!set.done) return set
        const result = edited.sets[setIndex++]
        return result ? { ...result, done: true } : set
      }),
    }
  })
}
