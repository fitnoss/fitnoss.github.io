import { create } from "zustand"
import { persist } from "zustand/middleware"
import { CATEGORIES, EQUIPMENT, MUSCLES, type Exercise, type Place } from "./types"

export const CUSTOM_CODE_START = 1_000_000_000
const CUSTOM_CODE_END = 0xFFFFFFFF
export const CUSTOM_NAME_LIMIT = 100
export const CUSTOM_INSTRUCTIONS_LIMIT = 1000

export type CustomExerciseData = {
  name: string
  category?: string
  equipment?: string
  muscles?: string[]
  instructions?: string
}

export type CustomExercise = CustomExerciseData & { code: number }

export function isCustomCode(code: number) {
  return Number.isInteger(code) && code >= CUSTOM_CODE_START && code <= CUSTOM_CODE_END
}

export function validCustomExercise(exercise: CustomExercise) {
  return isCustomCode(exercise?.code) && typeof exercise.name === "string" &&
    !!exercise.name.trim() && exercise.name.length <= CUSTOM_NAME_LIMIT &&
    (exercise.category === undefined || CATEGORIES.includes(exercise.category)) &&
    (exercise.equipment === undefined || EQUIPMENT.includes(exercise.equipment)) &&
    (exercise.muscles === undefined || (Array.isArray(exercise.muscles) &&
      exercise.muscles.every((muscle) => MUSCLES.includes(muscle)) &&
      new Set(exercise.muscles).size === exercise.muscles.length)) &&
    (exercise.instructions === undefined || (typeof exercise.instructions === "string" &&
      exercise.instructions.length <= CUSTOM_INSTRUCTIONS_LIMIT))
}

function normalize({ name, category, equipment, muscles, instructions }: CustomExerciseData): CustomExerciseData {
  return {
    name: name.trim(),
    ...(category ? { category } : {}),
    ...(equipment ? { equipment } : {}),
    ...(muscles?.length ? { muscles: MUSCLES.filter((muscle) => muscles.includes(muscle)) } : {}),
    ...(instructions?.trim() ? { instructions: instructions.trim() } : {}),
  }
}

function nextCode(used: ReadonlySet<number>) {
  let code = CUSTOM_CODE_START
  while (used.has(code)) code++
  return code
}

/** Resolve sender-local codes without overwriting local definitions. */
export function mergeCustomExercises(local: CustomExercise[], incoming: CustomExercise[]) {
  const used = new Map(local.map((exercise) => [exercise.code, exercise]))
  const keys = new Map(local.map((exercise) => [exercise.code, JSON.stringify(normalize(exercise))]))
  const definitions = new Map([...keys].map(([code, key]) => [key, code]))
  const reserved = new Set([...used.keys(), ...incoming.map((exercise) => exercise.code)])
  const codes = new Map<number, number>()
  for (const exercise of incoming) {
    const data = normalize(exercise)
    const key = JSON.stringify(data)
    const match = keys.get(exercise.code) === key ? exercise.code : definitions.get(key)
    if (match !== undefined) {
      codes.set(exercise.code, match)
      continue
    }
    const code = used.has(exercise.code) ? nextCode(reserved) : exercise.code
    reserved.add(code)
    used.set(code, { code, ...data })
    keys.set(code, key)
    definitions.set(key, code)
    codes.set(exercise.code, code)
  }
  return { exercises: [...used.values()], codes }
}

type State = {
  exercises: CustomExercise[]
  create: (data: CustomExerciseData) => CustomExercise
}

export const useCustomExerciseStore = create<State>()(persist((set, get) => ({
  exercises: [],
  create: (data) => {
    const local = get().exercises
    const code = nextCode(new Set(local.map((exercise) => exercise.code)))
    const exercise = { code, ...normalize(data) }
    if (!validCustomExercise(exercise)) throw new Error("invalid custom exercise")
    set({ exercises: [...local, exercise] })
    return exercise
  },
}), { name: "fitnoss:custom-exercises", version: 1 }))

export function customCatalogExercise(exercise: CustomExercise): Exercise {
  const places: Record<string, Place> = { body: "home", dumbbell: "dumbbell", kettlebell: "kettlebell", bands: "bands", pullupbar: "bars", parallelbars: "bars" }
  return {
    c: exercise.code,
    s: `custom-${exercise.code}`,
    cat: exercise.category ?? "",
    eq: exercise.equipment ?? "",
    pm: exercise.muscles ?? [],
    sm: [],
    lvl: "beginner",
    force: null,
    mech: null,
    pl: exercise.equipment ? [places[exercise.equipment] ?? "gym"] : [],
    img: 0,
    custom: exercise,
  }
}
