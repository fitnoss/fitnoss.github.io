import type { SetLog } from "./store"

export const SET_TYPES = ["work", "warmup", "drop", "failure"] as const
export type SetType = typeof SET_TYPES[number]
export type Effort = { scale: "rpe" | "rir"; value: number }

/** Old backups and in-progress workouts used a warmup flag; missing type means work. */
export const setType = (s: SetLog): SetType => s.type ?? (s.warmup ? "warmup" : "work")
export const isWarmup = (s: SetLog) => setType(s) === "warmup"
export const isMainSet = (s: SetLog) => setType(s) === "work" || setType(s) === "failure"
export const isCountedSet = (s: SetLog) => s.done && !isWarmup(s)

export function validEffort(e: Effort | undefined): Effort | undefined {
  if (!e || !Number.isFinite(e.value)) return undefined
  if (e.scale === "rpe" && e.value >= 1 && e.value <= 10 && Number.isInteger(e.value * 2)) return e
  if (e.scale === "rir" && e.value >= 0 && e.value <= 10 && Number.isInteger(e.value)) return e
  return undefined
}

export function updateSetLog(s: SetLog, patch: Partial<SetLog>): SetLog {
  const next = { ...s, ...patch }
  if (patch.type !== undefined) delete next.warmup
  next.effort = validEffort(next.effort)
  return next
}
