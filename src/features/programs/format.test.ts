import { expect, it, vi } from "vitest"
import i18n from "@/shared/i18n"
import { formatWeekdays, weekdayName } from "./format"

vi.mock("@/shared/i18n", () => ({ default: { resolvedLanguage: "en" } }))

it("reuses weekday labels across renders while keeping language and style changes correct", () => {
  const NativeDateTimeFormat = Intl.DateTimeFormat
  const formatter = vi.spyOn(Intl, "DateTimeFormat").mockImplementation(function (...args: Parameters<typeof Intl.DateTimeFormat>) {
    return new NativeDateTimeFormat(...args)
  })
  try {
    expect(formatWeekdays([0, 2, 6])).toBe("Mon, Wed, Sun")
    expect(formatWeekdays([0, 2, 6])).toBe("Mon, Wed, Sun")
    expect(formatter).toHaveBeenCalledTimes(1)
    expect(weekdayName(0, "long")).toBe("Monday")
    expect(formatter).toHaveBeenCalledTimes(2)
    i18n.resolvedLanguage = "ru"
    expect(formatWeekdays([0, 2, 6])).toBe("Пн, Ср, Вс")
    expect(weekdayName(0, "long")).toBe("понедельник")
    expect(formatter).toHaveBeenCalledTimes(4)
    i18n.resolvedLanguage = "en"
    expect(weekdayName(0)).toBe("Mon")
    expect(formatter).toHaveBeenCalledTimes(4)
  } finally {
    formatter.mockRestore()
    i18n.resolvedLanguage = "en"
  }
})
