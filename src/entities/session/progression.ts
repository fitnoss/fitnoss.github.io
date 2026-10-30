import { parseReps, type ProgramItem } from "@/entities/program/types"
import type { Session, SetLog } from "./store"
import { isMainSet } from "./sets"

/** Failed workouts in a row at the same weight before it drops. */
export const DELOAD_AFTER = 3
/** How much a deload takes off. */
export const DELOAD = 0.1

export type Progression = {
  /** Prefill for each planned set. */
  sets: Pick<SetLog, "reps" | "weight">[]
  /** Set when the weight moved since the last workout. */
  change?: "up" | "deload"
}

type Outcome = { weight: number; ok: boolean; sets: SetLog[] }

/** Past workouts with this exercise, newest first: the working weight and whether every set hit `top`. */
function* outcomes(history: Session[], it: ProgramItem, top: number): Generator<Outcome> {
  for (const s of history) {
    const sets = s.exercises.filter((e) => e.ex === it.ex && parseReps(e.reps).kind !== "time")
      .flatMap((e) => e.sets).filter((x) => x.done && isMainSet(x))
    if (!sets.length) continue
    const weight = Math.max(...sets.map((x) => x.weight ?? 0))
    const ok = sets.length >= it.sets && sets.every((x) => (x.reps ?? 0) >= top && (x.weight ?? 0) >= weight)
    yield { weight, ok, sets }
  }
}

const round = (kg: number) => Math.round(kg * 100) / 100

/**
 * Next workout's targets for an exercise with auto-progression (`inc`), or undefined when it has none.
 *
 * Fixed reps (linear): all sets done for the reps → +inc. Range (double progression): all sets
 * reach the top of the range → +inc and back to the bottom; until then, one more rep per set.
 * Either way, DELOAD_AFTER failed workouts in a row at the same weight take DELOAD off it.
 */
export function progression(history: Session[], it: ProgramItem): Progression | undefined {
  const p = parseReps(it.reps)
  if (!it.inc || (p.kind !== "reps" && p.kind !== "range")) return
  const [bottom, top] = p.kind === "reps" ? [p.n, p.n] : [p.a, p.b]
  const plan = (weight: number | undefined, reps: (j: number) => number, change?: Progression["change"]): Progression => ({
    sets: Array.from({ length: it.sets }, (_, j) => ({ reps: reps(j), weight: weight && weight > 0 ? round(weight) : undefined })),
    change,
  })

  const past = outcomes(history, it, top)
  const first = past.next()
  const last = first.done ? undefined : first.value
  if (!last) return plan(it.weight, () => bottom)
  if (last.ok) return plan(last.weight + it.inc, () => bottom, "up")

  let fails = 1
  for (const o of past) {
    if (o.ok || o.weight !== last.weight || fails >= DELOAD_AFTER) break
    fails++
  }
  if (fails >= DELOAD_AFTER && last.weight > 0) {
    const weight = Math.floor(round((last.weight * (1 - DELOAD)) / it.inc)) * it.inc
    return plan(weight, () => bottom, "deload")
  }
  const prevReps = (j: number) => last.sets[Math.min(j, last.sets.length - 1)].reps ?? bottom
  return plan(last.weight, (j) => Math.min(top, Math.max(bottom, prevReps(j) + (top > bottom ? 1 : 0))))
}
