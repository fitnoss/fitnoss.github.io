// @vitest-environment jsdom
import { act, useState } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { createInstance } from "i18next"
import { I18nextProvider } from "react-i18next"
import ru from "../../../locales/ru/ui.json"
import { DatePicker } from "./date-picker"

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 31, 12))
  HTMLDialogElement.prototype.showModal = function () { this.open = true }
  HTMLDialogElement.prototype.close = function () { this.open = false }
  host = document.createElement("div")
  document.body.append(host)
  root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); vi.unstubAllGlobals() })

it("chooses local dates, moves by keyboard across months and leaves the value alone on cancel", async () => {
  const i18n = createInstance()
  await i18n.init({ lng: "ru", resources: { ru: { translation: ru } } })
  function Example() {
    const [value, setValue] = useState("2026-10-31")
    return <><DatePicker label="Дата" value={value} onChange={setValue} /><output>{value}</output></>
  }
  act(() => root.render(<I18nextProvider i18n={i18n}><Example /></I18nextProvider>))
  const click = (button: Element) => act(() => (button as HTMLButtonElement).click())
  const trigger = () => host.querySelector('[aria-haspopup="dialog"]')!
  click(trigger())
  const october31 = host.querySelector('[data-date="2026-10-31"]')!
  expect(october31.getAttribute("tabindex")).toBe("0")
  act(() => october31.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })))
  expect(document.activeElement?.getAttribute("data-date")).toBe("2026-11-01")
  click(document.activeElement!)
  expect(host.querySelector("output")?.textContent).toBe("2026-11-01")
  expect(trigger().getAttribute("aria-expanded")).toBe("false")
  click(trigger())
  click(host.querySelector('[aria-label="Предыдущий месяц"]')!)
  click(host.querySelector('[aria-label="Закрыть"]')!)
  expect(host.querySelector("output")?.textContent).toBe("2026-11-01")
  click(trigger())
  click([...host.querySelectorAll("button")].find((button) => button.textContent === "Сегодня")!)
  expect(host.querySelector("output")?.textContent).toBe("2026-10-31")
})
