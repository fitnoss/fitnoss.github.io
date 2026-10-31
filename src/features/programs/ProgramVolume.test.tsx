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
  useExercises: () => ({ byCode: new Map([[1, { pm: ["chest"], sm: ["triceps"] } as Exercise]]) }),
}))

it("shows translated totals and updates the period and coverage after program edits", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  const i18n = createInstance()
  await i18n.init({ lng: "ru", resources: { ru: { translation: ru } }, interpolation: { escapeValue: false } })
  const container = document.createElement("div")
  const root = createRoot(container)
  const plan: ProgramData = { name: "Test", days: [{ name: "A", weekdays: [0, 3], items: [{ ex: 1, sets: 3, reps: "10", rest: 60 }] }] }
  const render = () => act(() => root.render(<I18nextProvider i18n={i18n}><ProgramVolume program={plan} /></I18nextProvider>))
  try {
    render()
    expect(container.querySelector("summary")?.textContent).toContain("Подходы по мышцам · неделя")
    expect(container.querySelector("summary")?.textContent).toContain("2 из 17")
    const chest = () => [...container.querySelectorAll("tbody tr")].find((row) => row.querySelector("th")?.textContent === ru.muscle.chest)!
    expect([...chest().querySelectorAll("td")].map((cell) => cell.textContent)).toEqual(["6", "0"])
    plan.days[0].weekdays = undefined
    plan.days[0].items[0].sets = 4
    render()
    expect(container.querySelector("summary")?.textContent).toContain("Подходы по мышцам · цикл")
    expect(chest().querySelector("td")?.textContent).toBe("4")
    plan.days[0].items = []
    render()
    expect(container.querySelector("summary")?.textContent).toContain("0 из 17")
    expect(chest().querySelector("td")?.textContent).toBe("0")
  } finally {
    act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})
