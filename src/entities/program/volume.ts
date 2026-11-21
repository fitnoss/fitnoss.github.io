import { MUSCLES, type Exercise } from "@/entities/exercise/types"
import type { Program } from "./types"
import type { ScheduleEntry } from "./schedule"

/** Use a week only when every nonempty day is scheduled; otherwise count one full cycle. */
export function programMuscleVolume(program: Pick<Program, "days">, exercises: ReadonlyMap<number, Exercise>, schedule: ScheduleEntry[] = []) {
  const days = program.days.filter((day) => day.items.length && day.mode !== "checklist")
  const frequencies = new Map<string, number>()
  for (const entry of schedule) if (entry.repeat === "weekly") {
    frequencies.set(entry.workoutId, (frequencies.get(entry.workoutId) ?? 0) + entry.weekdays.length)
  }
  const weekly = days.length > 0 && days.every((day) => frequencies.has(day.id))
  const volume = Object.fromEntries(MUSCLES.map((muscle) => [muscle, { primary: 0, secondary: 0 }]))
  const missingExercises = new Set<number>()
  for (const day of days) {
    const frequency = weekly ? frequencies.get(day.id)! : 1
    for (const item of day.items) {
      const exercise = exercises.get(item.ex)
      if (!exercise) { missingExercises.add(item.ex); continue }
      const sets = item.sets * frequency
      for (const muscle of new Set(exercise.pm)) {
        if (volume[muscle]) volume[muscle].primary += sets
      }
      for (const muscle of new Set(exercise.sm)) {
        if (volume[muscle] && !exercise.pm.includes(muscle)) volume[muscle].secondary += sets
      }
    }
  }
  return { volume, weekly, missingExercises: missingExercises.size }
}
