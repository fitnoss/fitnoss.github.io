import { MUSCLES, type Exercise } from "@/entities/exercise/types"
import type { Session } from "./store"
import { isCountedSet } from "./sets"

export type MuscleVolume = Record<string, { primary: number; secondary: number }>

/** Local calendar week, Monday through Sunday, including DST transitions. */
export function calendarWeek(now: number) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (start.getDay() + 6) % 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return { start: start.getTime(), end: end.getTime() }
}

/** Each completed non-warmup set counts once per muscle; indirect work stays separate. */
export function weeklyMuscleVolume(history: Session[], exercises: ReadonlyMap<number, Exercise>, now: number): MuscleVolume {
  const volume: MuscleVolume = Object.fromEntries(MUSCLES.map((muscle) => [muscle, { primary: 0, secondary: 0 }]))
  const { start, end } = calendarWeek(now)
  for (const session of history) {
    if (session.startedAt < start || session.startedAt >= end || session.startedAt > now) continue
    for (const logged of session.exercises) {
      const exercise = exercises.get(logged.ex)
      if (!exercise) continue
      const sets = logged.sets.filter(isCountedSet).length
      for (const muscle of new Set(exercise.pm)) {
        if (volume[muscle]) volume[muscle].primary += sets
      }
      for (const muscle of new Set(exercise.sm)) {
        if (volume[muscle] && !exercise.pm.includes(muscle)) volume[muscle].secondary += sets
      }
    }
  }
  return volume
}
