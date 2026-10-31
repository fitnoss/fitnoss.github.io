import { calendarWeek } from "./muscles"

function previousWeek(start: number) {
  const date = new Date(start)
  date.setDate(date.getDate() - 7)
  return date.getTime()
}

export function weeklyActivity(history: { startedAt: number }[], now: number) {
  const sessions = history.filter((entry) => entry.startedAt <= now)
  const { start } = calendarWeek(now)
  const localDay = (time: number) => {
    const date = new Date(time)
    date.setHours(0, 0, 0, 0)
    return date.getTime()
  }
  const days = new Set(sessions.map((entry) => localDay(entry.startedAt)))
  const weeks = new Set(sessions.map((entry) => calendarWeek(entry.startedAt).start))
  let current = weeks.has(start) ? start : previousWeek(start)
  let streak = 0
  while (weeks.has(current)) { streak++; current = previousWeek(current) }
  return {
    week: Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start)
      date.setDate(date.getDate() + index)
      const d = date.getTime()
      return { d, on: days.has(d) }
    }),
    thisWeek: sessions.filter((entry) => entry.startedAt >= start).length,
    streak,
  }
}
