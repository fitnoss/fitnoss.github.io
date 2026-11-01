import { describe, expect, it } from "vitest"
import { applyFilters, EMPTY_FILTERS, getSearchIndex, stem } from "./filters"
import MiniSearch from "minisearch"
import type { Exercise } from "@/entities/exercise/types"

describe("stem", () => {
  it("collapses Russian and English word forms", () => {
    expect(stem("Приседания")).toBe(stem("приседание"))
    expect(stem("приседа")).toBe(stem("присед"))
    expect(stem("отжимания")).toBe(stem("отжимание"))
    expect(stem("squats")).toBe(stem("squat"))
    expect(stem("жим")).toBe("жим")
  })
})

describe("equipment filters", () => {
  it("finds the secondary band without treating assisted pull-ups as an exercise with no equipment", () => {
    const exercise = { c: 1, eq: "pullupbar", eqExtra: ["bands"], pl: ["bars", "gym"] } as Exercise
    const index = new MiniSearch({ fields: ["name"] })
    expect(applyFilters([exercise], { ...EMPTY_FILTERS, equipment: ["bands"] }, index, [])).toEqual([exercise])
    expect(applyFilters([exercise], { ...EMPTY_FILTERS, equipment: ["body"] }, index, [])).toEqual([])
  })
})

describe("shared search index", () => {
  const exercise = { c: 1, s: "squat" } as Exercise
  const en = { squat: { name: "Squat" } }
  const ru = { squat: { name: "Приседания" } }
  const ids = (index: MiniSearch, query: string) => index.search(query).map((r) => r.id)

  it("reuses the index across consumers and searches both languages", () => {
    const list = [exercise]
    const index = getSearchIndex(list, en, ru)
    expect(getSearchIndex(list, en, ru)).toBe(index)
    expect(ids(index, "присед")).toEqual([1])
    expect(ids(index, "squats")).toEqual([1])
  })

  it("refreshes when translated names arrive or the language changes", () => {
    const list = [exercise]
    const empty = {}
    const loading = getSearchIndex(list, en, empty)
    expect(ids(loading, "присед")).toEqual([])
    const translated = getSearchIndex(list, en, ru)
    expect(translated).not.toBe(loading)
    expect(ids(translated, "присед")).toEqual([1])
    const german = getSearchIndex(list, en, { squat: { name: "Kniebeuge" } })
    expect(ids(german, "Kniebeuge")).toEqual([1])
    expect(ids(german, "присед")).toEqual([])
    const english = getSearchIndex(list, en, empty)
    expect(ids(english, "squat")).toEqual([1])
    expect(ids(english, "Kniebeuge")).toEqual([])
  })

  it("refreshes English fallback names and replaced catalog data", () => {
    const list = [exercise]
    const empty = {}
    const loading = getSearchIndex(list, empty, empty)
    const loaded = getSearchIndex(list, en, empty)
    expect(loaded).not.toBe(loading)
    const renamed = getSearchIndex(list, { squat: { name: "Barbell squat" } }, empty)
    expect(ids(renamed, "barbell")).toEqual([1])
    expect(ids(loaded, "barbell")).toEqual([])
    const restored = getSearchIndex(list, en, empty)
    expect(restored).not.toBe(renamed)
    const replacement = getSearchIndex([{ c: 2, s: "pullup" } as Exercise], { pullup: { name: "Pullup" } }, empty)
    expect(ids(replacement, "squat")).toEqual([])
    expect(ids(replacement, "pullup")).toEqual([2])
    expect(getSearchIndex(list, en, empty)).toBe(restored)
  })
})
