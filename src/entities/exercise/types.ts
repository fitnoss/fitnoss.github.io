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
  pm: string[]
  sm: string[]
  pl: Place[]
  img: number
}

export type ExerciseText = { name: string; steps: string[]; machine?: boolean }

export type Video = { yt: string; start?: number; end?: number; ru?: string }

export const PLACES: Place[] = ["home", "bars", "dumbbell", "kettlebell", "bands", "gym"]

export const MUSCLES = [
  "chest", "lats", "middle back", "lower back", "traps", "shoulders", "biceps", "triceps", "forearms",
  "abdominals", "quadriceps", "hamstrings", "glutes", "calves", "adductors", "abductors", "neck",
]

export const EQUIPMENT = [
  "body", "dumbbell", "barbell", "kettlebell", "bands", "cable", "machine", "ezbar", "medball", "fitball", "foamroll", "other",
]

export const CATEGORIES = ["strength", "stretching", "plyometrics", "powerlifting", "olympic weightlifting", "strongman", "cardio"]

export const LEVELS: Level[] = ["beginner", "intermediate", "expert"]

export function imageUrl(ex: Pick<Exercise, "c">, n = 0) {
  return `${import.meta.env.BASE_URL}img/ex/${ex.c}-${n}.webp`
}

/** i18n key for a muscle / category value ("middle back" → "middle_back"). */
export const key = (v: string) => v.replace(/\s+/g, "_")
