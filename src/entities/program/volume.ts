import { MUSCLES, type Exercise } from "@/entities/exercise/types"
import type { ProgramData } from "./types"

/** Use a week only when every nonempty day is scheduled; otherwise count one full cycle. */
export function programMuscleVolume(program: ProgramData, exercises: ReadonlyMap<number, Exercise>) {
  const days = program.days.filter((day) => day.items.length)
  const weekly = days.length > 0 && days.every((day) => day.weekdays?.length)
  const volume = Object.fromEntries(MUSCLES.map((muscle) => [muscle, { primary: 0, secondary: 0 }]))
  const missingExercises = new Set<number>()
  for (const day of days) {
    const frequency = weekly ? new Set(day.weekdays).size : 1
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
