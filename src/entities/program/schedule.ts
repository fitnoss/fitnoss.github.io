import { calendarDate, dateValue } from "@/shared/lib/calendar"
import { weekdayOf, type Program } from "./types"

export type ScheduleRule = {
  /** Local YYYY-MM-DD, or the first date on which the weekly rule can apply. */
  date: string
  /** Local HH:mm. Omitted for an any-time workout. */
  time?: string
} & ({ repeat: "once" } | { repeat: "weekly"; weekdays: number[] })

export type ScheduleEntry = ScheduleRule & { id: string; workoutId: string }
export type ScheduledOccurrence = { entryId: string; date: string; time?: string }

export function validDate(value: string) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && dateValue(calendarDate(value)) === value
}

export function validTime(value?: string) {
  return value === undefined || (typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value))
}

export function validSchedule(entry: ScheduleEntry) {
  return typeof entry?.id === "string" && !!entry.id && typeof entry.workoutId === "string" &&
    !!entry.workoutId && validDate(entry.date) &&
    validTime(entry.time) &&
    (entry.repeat === "once" || (entry.repeat === "weekly" && Array.isArray(entry.weekdays) &&
      entry.weekdays.length > 0 && entry.weekdays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) &&
      new Set(entry.weekdays).size === entry.weekdays.length))
}

export function occursOn(entry: ScheduleEntry, date: string, weekday = weekdayOf(calendarDate(date))) {
  return entry.repeat === "once" ? entry.date === date : entry.date <= date && entry.weekdays.includes(weekday)
}

export function scheduleOn(entries: ScheduleEntry[], date: string) {
  const weekday = weekdayOf(calendarDate(date))
  return entries.filter((entry) => occursOn(entry, date, weekday))
    .sort((a, b) => (a.time ?? "24:00").localeCompare(b.time ?? "24:00"))
}

export function workoutIndex(programs: Program[]) {
  return new Map(programs.flatMap((program) => program.days.map((workout, index) => [workout.id, { program, workout, index }] as const)))
}
