// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { expect, it, vi } from "vitest"
import { createInstance } from "i18next"
import { I18nextProvider } from "react-i18next"
import ru from "../../../locales/ru/ui.json"
import type { Exercise } from "@/entities/exercise/types"
import type { ProgramData } from "@/entities/program/types"
import { ProgramVolume } from "./ProgramVolume"

vi.mock("@/entities/exercise/store", () => ({
  useExercises: () => ({ byCode: new Map([
    [1, { pm: ["chest"], sm: ["triceps"] } as Exercise],
    [2, { pm: ["triceps"], sm: [] } as unknown as Exercise],
  ]) }),
}))

it("shows a muscle map and updates uncovered and indirect-only lists after program edits", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  const i18n = createInstance()
  await i18n.init({ lng: "ru", resources: { ru: { translation: ru } }, interpolation: { escapeValue: false } })
  const container = document.createElement("div")
  const root = createRoot(container)
  const plan: ProgramData = { name: "Test", days: [{ name: "A", weekdays: [0, 3], items: [{ ex: 1, sets: 3, reps: "10", rest: 60 }] }] }
  const render = () => act(() => root.render(<I18nextProvider i18n={i18n}><ProgramVolume program={plan} /></I18nextProvider>))
  try {
    render()
    expect(container.querySelector("h2")?.textContent).toBe("Карта мышц · неделя")
    expect(container.querySelector("table")).toBeNull()
    expect(container.querySelectorAll("svg")).toHaveLength(2)
    const list = (label: string) => [...container.querySelectorAll("dt")].find((dt) => dt.textContent === label)?.nextElementSibling?.textContent
    const fill = (name: string) => [...container.querySelectorAll("g")].find((g) => g.querySelector("title")?.textContent === name)?.querySelector("polygon")?.getAttribute("fill")
    expect(fill(ru.muscle.chest)).toBe("#ef4444")
    expect(fill(ru.muscle.triceps)).toBe("#facc15")
    expect(list(ru.programVolume.indirectOnly)).toBe(ru.muscle.triceps)
    expect(list(ru.programVolume.uncovered)).toContain(ru.muscle.calves)
    expect(list(ru.programVolume.uncovered)).not.toContain(ru.muscle.chest)
    expect(list(ru.programVolume.uncovered)).not.toContain(ru.muscle.triceps)
    plan.days[0].weekdays = undefined
    plan.days[0].items.push({ ex: 2, sets: 2, reps: "10", rest: 60 })
    render()
    expect(container.querySelector("h2")?.textContent).toBe("Карта мышц · цикл")
    expect(list(ru.programVolume.indirectOnly)).toBe(ru.programVolume.none)
    expect(fill(ru.muscle.triceps)).toBe("#ef4444")
    plan.days[0].items = []
    render()
    expect(list(ru.programVolume.uncovered)).toContain(ru.muscle.chest)
    expect(list(ru.programVolume.uncovered)).toContain(ru.muscle.triceps)
    expect(fill(ru.muscle.chest)).toBe(fill(ru.muscle.calves))
  } finally {
    act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})
