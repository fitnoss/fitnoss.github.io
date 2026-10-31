import { describe, expect, it } from "vitest"
import { calendarDate, dateValue, monthDays, moveCalendarMonth } from "./calendar"

describe("calendar dates", () => {
  it("starts calendar rows on Monday and includes adjacent month dates", () => {
    const days = monthDays(calendarDate("2026-10-31"))
    expect(days).toHaveLength(42)
    expect(days[0].getDay()).toBe(1)
    expect(dateValue(days[0])).toBe("2026-09-28")
    expect(dateValue(days.at(-1)!)).toBe("2026-11-08")
    expect(days.every((date) => date.getHours() === 12)).toBe(true)
  })
  it("clamps month navigation to the last day, including leap years and year changes", () => {
    expect(dateValue(moveCalendarMonth(calendarDate("2026-01-31"), 1))).toBe("2026-02-28")
    expect(dateValue(moveCalendarMonth(calendarDate("2028-01-31"), 1))).toBe("2028-02-29")
    expect(dateValue(moveCalendarMonth(calendarDate("2026-12-31"), 1))).toBe("2027-01-31")
    expect(dateValue(moveCalendarMonth(calendarDate("2026-01-31"), -1))).toBe("2025-12-31")
    expect(dateValue(moveCalendarMonth(calendarDate("2028-02-29"), -12))).toBe("2027-02-28")
  })
})
