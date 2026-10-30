import { parseReps } from "@/entities/program/types"
import { exerciseMetrics } from "@/entities/session/stats"
import { isCountedSet } from "@/entities/session/sets"
import type { Session } from "@/entities/session/store"

export type Metric = "e1rm" | "weight" | "volume" | "reps" | "duration"
export type Period = "28" | "84" | "all"
const DAY = 86_400_000

export function exercisePoints(history: Session[], code: number) {
  return history.flatMap((session) => {
    const exercises = session.exercises.filter((exercise) => exercise.ex === code)
    const sets = exercises.flatMap((exercise) => exercise.sets.filter(isCountedSet).map((set) => ({
      set, timed: parseReps(exercise.reps).kind === "time",
    })))
    if (!sets.length) return []
    const repetitions = sets.filter((item) => !item.timed).map((item) => item.set)
    const durations = sets.filter((item) => item.timed).map((item) => item.set)
    const metrics = exerciseMetrics(repetitions)
    const weighted = sets.some((item) => (item.set.weight ?? 0) > 0)
    return [{
      id: session.id,
      at: session.startedAt,
      sets,
      values: {
        e1rm: metrics.e1rm > 0 ? Math.round(metrics.e1rm) : undefined,
        weight: weighted ? Math.max(...sets.map((item) => item.set.weight ?? 0)) : undefined,
        volume: metrics.volume > 0 ? Math.round(metrics.volume) : undefined,
        reps: repetitions.length ? metrics.reps : undefined,
        duration: durations.length ? Math.max(...durations.map((set) => set.reps ?? 0)) : undefined,
      } satisfies Record<Metric, number | undefined>,
    }]
  }).sort((a, b) => a.at - b.at)
}

export function metricPeriod(points: ReturnType<typeof exercisePoints>, metric: Metric, period: Period, now = Date.now()) {
  const dated = points.filter((point) => point.values[metric] !== undefined && point.at <= now)
  const span = period === "all" ? Infinity : Number(period) * DAY
  const current = dated.filter((point) => point.at > now - span)
  const previous = period === "all" ? [] : dated.filter((point) => point.at > now - 2 * span && point.at <= now - span)
  const best = (entries: typeof points) => entries.length ? Math.max(...entries.map((point) => point.values[metric]!)) : undefined
  return { current, previous, best: best(current), previousBest: best(previous) }
}
