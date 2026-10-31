import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { fetchLocale } from "@/shared/i18n"
import type { Exercise, ExerciseName, ExerciseText, Video } from "./types"

type Names = Record<string, ExerciseName>
type Texts = Record<string, ExerciseText>

type State = {
  list: Exercise[]
  byCode: Map<number, Exercise>
  bySlug: Map<string, Exercise>
  en: Names
  local: Names
  lang: string
  videos: Record<string, Video>
  ready: boolean
  load: (lang: string) => Promise<void>
}

const BASE = import.meta.env.BASE_URL
let corePromise: Promise<void> | null = null
const namesPromises = new Map<string, Promise<Names>>()
const textPromises = new Map<string, Promise<Texts>>()
let requestedLanguage = ""

function loadLocale<T>(cache: Map<string, Promise<T>>, lang: string, file: string): Promise<T> {
  let promise = cache.get(lang)
  if (!promise) {
    promise = fetchLocale<T>(lang, file).then((data) => {
      if (data === null) {
        cache.delete(lang)
        return {} as T
      }
      return data
    })
    cache.set(lang, promise)
  }
  return promise
}

/** Full instructions are fetched only by an open exercise page or technique sheet. */
export function loadExerciseTexts(lang: string) {
  return loadLocale(textPromises, lang, "exercises")
}

export const useExerciseStore = create<State>()((set, get) => ({
  list: [],
  byCode: new Map(),
  bySlug: new Map(),
  en: {},
  local: {},
  lang: "",
  videos: {},
  ready: false,
  load: async (lang) => {
    requestedLanguage = lang
    if (get().lang === lang && get().ready) return
    corePromise ??= (async () => {
      const [list, videos] = await Promise.all([
        fetch(`${BASE}data/exercises.json`).then((r) => {
          if (!r.ok) throw new Error("Could not load exercise catalog")
          return r.json() as Promise<Exercise[]>
        }),
        fetch(`${BASE}data/videos.json`)
          .then((r) => (r.ok ? (r.json() as Promise<Record<string, Video>>) : {}))
          .catch(() => ({})),
      ])
      set({
        list,
        byCode: new Map(list.map((e) => [e.c, e])),
        bySlug: new Map(list.map((e) => [e.s, e])),
        videos,
      })
    })().catch((error) => {
      corePromise = null
      throw error
    })
    const [, en, local] = await Promise.all([
      corePromise,
      loadLocale(namesPromises, "en", "exercise-names"),
      lang === "en" ? Promise.resolve({}) : loadLocale(namesPromises, lang, "exercise-names"),
    ])
    if (requestedLanguage === lang && !(get().lang === lang && get().ready)) {
      set({ en, local, lang, ready: true })
    }
  },
}))

/** Loads exercise data for the current language and returns helpers. */
export function useExercises() {
  const { i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? "en"
  const state = useExerciseStore()
  const load = state.load
  useEffect(() => {
    void load(lang).catch(() => {})
  }, [lang, load])
  const { en, local } = state
  const text = useCallback((ex: Exercise | undefined): ExerciseName => ({
    name: ex ? local[ex.s]?.name || en[ex.s]?.name || ex.s : "?",
  }), [en, local])
  return { ...state, ready: state.ready && state.lang === lang, text }
}

export function exerciseText(state: { en: Texts; local: Texts }, ex: Exercise | undefined): ExerciseText {
  if (!ex) return { name: "?", steps: [] }
  const en = state.en[ex.s] ?? { name: ex.s, steps: [] }
  const local = state.local[ex.s]
  return {
    name: local?.name || en.name,
    steps: local?.steps?.length ? local.steps : en.steps,
    machine: local?.machine,
  }
}

export function useExerciseText(ex: Exercise | undefined): ExerciseText & { loading: boolean } {
  const { i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? "en"
  const name = useExerciseStore((s) => ex ? s.local[ex.s]?.name || s.en[ex.s]?.name || ex.s : "?")
  const [texts, setTexts] = useState<{ lang: string; en: Texts; local: Texts }>()
  const hasExercise = !!ex
  useEffect(() => {
    if (!hasExercise) return
    let current = true
    Promise.all([loadExerciseTexts("en"), lang === "en" ? Promise.resolve({}) : loadExerciseTexts(lang)])
      .then(([en, local]) => {
        if (current) setTexts({ lang, en, local })
      })
    return () => { current = false }
  }, [lang, hasExercise])
  if (!texts || texts.lang !== lang) return { name, steps: [], loading: hasExercise }
  return { ...exerciseText(texts, ex), loading: false }
}

type Favorites = { codes: number[]; toggle: (c: number) => void }

export const useFavorites = create<Favorites>()(
  persist(
    (set) => ({
      codes: [],
      toggle: (c) => set((s) => ({ codes: s.codes.includes(c) ? s.codes.filter((x) => x !== c) : [c, ...s.codes] })),
    }),
    { name: "fitnoss:favorites", version: 1 },
  ),
)
