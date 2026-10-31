export type Place = "home" | "bars" | "dumbbell" | "kettlebell" | "bands" | "gym"
export type Level = "beginner" | "intermediate" | "expert"

export type Exercise = {
  /** Stable numeric code (index in data/id-map.json). */
  c: number
  /** URL slug and translation key. */
  s: string
  cat: string
  lvl: Level
  mech: string | null
  force: string | null
  eq: string
  eqExtra?: string[]
  pm: string[]
  sm: string[]
  pl: Place[]
  img: number
}

export type ExerciseName = { name: string }
export type ExerciseText = ExerciseName & { steps: string[]; machine?: boolean }

export type Video = { yt: string; start?: number; end?: number; ru?: string }

export const PLACES: Place[] = ["home", "bars", "dumbbell", "kettlebell", "bands", "gym"]

export const MUSCLES = [
  "chest", "lats", "middle back", "lower back", "traps", "shoulders", "biceps", "triceps", "forearms",
  "abdominals", "quadriceps", "hamstrings", "glutes", "calves", "adductors", "abductors", "neck",
]

export const EQUIPMENT = [
  "body", "dumbbell", "barbell", "kettlebell", "bands", "cable", "machine", "ezbar", "medball", "fitball", "foamroll",
  "pullupbar", "parallelbars", "rings", "suspension", "bench", "plate", "other",
]

/** Required equipment, including secondary items such as a band used on a pull-up bar. */
export function exerciseEquipment(exercise: Pick<Exercise, "eq" | "eqExtra">) {
  return [...new Set([exercise.eq, ...(exercise.eqExtra ?? [])])]
}

export const CATEGORIES = ["strength", "stretching", "plyometrics", "powerlifting", "olympic weightlifting", "strongman", "cardio"]

export const LEVELS: Level[] = ["beginner", "intermediate", "expert"]

/** "s" is a list thumbnail, "l" the full photo for the exercise page (sizes in scripts/build-data.ts). */
export type ImageSize = "s" | "l"

export function imageUrl(ex: Pick<Exercise, "c">, n = 0, size: ImageSize = "s") {
  return `${import.meta.env.BASE_URL}img/ex/${size}/${ex.c}-${n}.webp`
}

/** i18n key for a muscle / category value ("middle back" → "middle_back"). */
export const key = (v: string) => v.replace(/\s+/g, "_")
