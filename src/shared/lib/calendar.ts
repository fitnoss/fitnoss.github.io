/** Calendar arithmetic at local noon, so DST does not shift a selected date. */
export function calendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  date.setHours(12, 0, 0, 0)
  return date
}

export function dateValue(date: Date) {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function moveCalendarMonth(date: Date, offset: number) {
  const next = new Date(date)
  const day = next.getDate()
  next.setDate(1)
  next.setMonth(next.getMonth() + offset)
  const end = new Date(next)
  end.setMonth(end.getMonth() + 1, 0)
  next.setDate(Math.min(day, end.getDate()))
  return next
}

export function monthDays(month: Date) {
  const first = new Date(month)
  first.setDate(1)
  first.setDate(1 - (first.getDay() + 6) % 7)
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first)
    date.setDate(first.getDate() + index)
    return date
  })
}
