import { useMemo } from "react"
import { useSearchParams } from "react-router"
import MiniSearch from "minisearch"
import { exerciseEquipment, type Exercise, type ExerciseText, type Level, type Place } from "@/entities/exercise/types"

export type Filters = {
  q: string
  places: Place[]
  muscles: string[]
  equipment: string[]
  levels: Level[]
  categories: string[]
  favorites: boolean
}

export const EMPTY_FILTERS: Filters = {
  q: "",
  places: [],
  muscles: [],
  equipment: [],
  levels: [],
  categories: [],
  favorites: false,
}

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : [])

export function countAdvanced(f: Filters) {
  return f.muscles.length + f.equipment.length + f.levels.length + f.categories.length + (f.favorites ? 1 : 0)
}

/** Filters stored in the URL so a filtered catalog can be shared. */
export function useUrlFilters(): [Filters, (f: Filters) => void] {
  const [params, setParams] = useSearchParams()
  const filters: Filters = {
    q: params.get("q") ?? "",
    places: list(params.get("pl")) as Place[],
    muscles: list(params.get("m")),
    equipment: list(params.get("eq")),
    levels: list(params.get("lvl")) as Level[],
    categories: list(params.get("cat")),
    favorites: params.get("fav") === "1",
  }
  const set = (f: Filters) => {
    const p = new URLSearchParams()
    if (f.q) p.set("q", f.q)
    if (f.places.length) p.set("pl", f.places.join(","))
    if (f.muscles.length) p.set("m", f.muscles.join(","))
    if (f.equipment.length) p.set("eq", f.equipment.join(","))
    if (f.levels.length) p.set("lvl", f.levels.join(","))
    if (f.categories.length) p.set("cat", f.categories.join(","))
    if (f.favorites) p.set("fav", "1")
    setParams(p, { replace: true })
  }
  return [filters, set]
}

type TextFn = (ex: Exercise) => ExerciseText

const RU_ENDING = /(иями|ями|ами|иях|ание|ания|ение|ения|ого|его|ому|ему|ыми|ими|ой|ей|ий|ый|ая|яя|ое|ее|ые|ие|ов|ев|ам|ям|ах|ях|ом|ем|ую|юю|а|я|ы|и|у|ю|е|о|ь)$/
const EN_ENDING = /(ings|ing|es|s)$/

/** Tiny stemmer so word forms match each other ("приседания" ≈ "приседание" ≈ "присед"). */
export function stem(term: string) {
  const t = term.toLowerCase().replace(/ё/g, "е")
  const re = /[а-я]/.test(t) ? RU_ENDING : EN_ENDING
  const cut = t.replace(re, "")
  return cut.length >= 3 ? cut : t
}

export function useSearchIndex(list: Exercise[], text: TextFn, en: Record<string, ExerciseText>, lang: string) {
  return useMemo(() => {
    const ms = new MiniSearch<{ id: number; name: string; en: string }>({
      fields: ["name", "en"],
      processTerm: stem,
      searchOptions: {
        prefix: true,
        fuzzy: 0.2,
        boost: { name: 2 },
        // Codes are ordered by popularity: the basics outrank rare variations.
        boostDocument: (id) => 1 + 1 / (1 + Number(id) / 40),
      },
    })
    ms.addAll(list.map((ex) => ({ id: ex.c, name: text(ex).name, en: en[ex.s]?.name ?? "" })))
    return ms
  }, [list, lang]) // eslint-disable-line react-hooks/exhaustive-deps
}

export function applyFilters(list: Exercise[], f: Filters, index: MiniSearch, favorites: number[]) {
  const pass = (ex: Exercise) =>
    (!f.places.length || f.places.some((p) => ex.pl.includes(p))) &&
    (!f.muscles.length || f.muscles.some((m) => ex.pm.includes(m))) &&
    (!f.equipment.length || exerciseEquipment(ex).some((equipment) => f.equipment.includes(equipment))) &&
    (!f.levels.length || f.levels.includes(ex.lvl)) &&
    (!f.categories.length || f.categories.includes(ex.cat)) &&
    (!f.favorites || favorites.includes(ex.c))

  const q = f.q.trim()
  if (!q) return list.filter(pass)
  const byCode = new Map(list.map((e) => [e.c, e]))
  return index
    .search(q)
    .map((r) => byCode.get(r.id as number))
    .filter((e): e is Exercise => !!e && pass(e))
}
