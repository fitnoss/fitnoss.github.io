import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { fetchLocale } from "@/shared/i18n"
import type { Exercise, ExerciseText, Video } from "./types"

type Texts = Record<string, ExerciseText>

type State = {
  list: Exercise[]
  byCode: Map<number, Exercise>
  bySlug: Map<string, Exercise>
  en: Texts
  local: Texts
  lang: string
  videos: Record<string, Video>
  ready: boolean
  load: (lang: string) => Promise<void>
}

const BASE = import.meta.env.BASE_URL
let corePromise: Promise<void> | null = null

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
    corePromise ??= (async () => {
      const [list, en, videos] = await Promise.all([
        fetch(`${BASE}data/exercises.json`).then((r) => r.json() as Promise<Exercise[]>),
        fetchLocale<Texts>("en", "exercises"),
        fetch(`${BASE}data/videos.json`)
          .then((r) => (r.ok ? (r.json() as Promise<Record<string, Video>>) : {}))
          .catch(() => ({})),
      ])
      set({
        list,
        byCode: new Map(list.map((e) => [e.c, e])),
        bySlug: new Map(list.map((e) => [e.s, e])),
        en: en ?? {},
        videos,
      })
    })()
    await corePromise
    if (get().lang === lang && get().ready) return
    const local = lang === "en" ? {} : ((await fetchLocale<Texts>(lang, "exercises")) ?? {})
    set({ local, lang, ready: true })
  },
}))

/** Loads exercise data for the current language and returns helpers. */
export function useExercises() {
  const { i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? "en"
  const state = useExerciseStore()
  useEffect(() => {
    state.load(lang)
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, text: (ex: Exercise | undefined) => exerciseText(state, ex) }
}

export function exerciseText(state: Pick<State, "en" | "local">, ex: Exercise | undefined): ExerciseText {
  if (!ex) return { name: "?", steps: [] }
  const en = state.en[ex.s] ?? { name: ex.s, steps: [] }
  const local = state.local[ex.s]
  return {
    name: local?.name || en.name,
    steps: local?.steps?.length ? local.steps : en.steps,
    machine: local?.machine,
  }
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
