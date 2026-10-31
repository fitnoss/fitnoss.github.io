import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { calendarDate, dateValue, monthDays, moveCalendarMonth } from "@/shared/lib/calendar"
import { cn } from "@/shared/lib/utils"
import { Button } from "./button"
import { Select } from "./select"
import { Sheet } from "./sheet"

type Props = { value: string; onChange: (date: string) => void; label: string; disabled?: boolean }

/** Custom calendar in the app's sheet; the selected value is always a local YYYY-MM-DD. */
export function DatePicker({ value, onChange, label, disabled }: Props) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(value)
  const grid = useRef<HTMLDivElement>(null)
  const focusDay = useRef(false)
  const current = calendarDate(cursor)
  const today = dateValue(new Date())
  const days = monthDays(current)
  const monthFormat = new Intl.DateTimeFormat(i18n.language, { month: "long" })
  const weekdayFormat = new Intl.DateTimeFormat(i18n.language, { weekday: "short" })
  const fullFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: "full" })
  const years = Array.from(new Set([...Array.from({ length: 121 }, (_, i) => new Date().getFullYear() - 100 + i), current.getFullYear()])).sort((a, b) => a - b)
  const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

  useLayoutEffect(() => {
    if (open && focusDay.current) {
      grid.current?.querySelector<HTMLButtonElement>(`[data-date="${cursor}"]`)?.focus()
      focusDay.current = false
    }
  }, [cursor, open])

  const choose = (date: string) => { onChange(date); setOpen(false) }
  const move = (offset: number) => setCursor(dateValue(moveCalendarMonth(current, offset)))
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, day: Date) => {
    const next = new Date(day)
    const weekday = (day.getDay() + 6) % 7
    const offset = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" ? -7 : event.key === "ArrowDown" ? 7
      : event.key === "Home" ? -weekday : event.key === "End" ? 6 - weekday : undefined
    if (offset !== undefined) next.setDate(next.getDate() + offset)
    else if (event.key === "PageUp" || event.key === "PageDown") next.setTime(moveCalendarMonth(day, event.key === "PageUp" ? -1 : 1).getTime())
    else return
    event.preventDefault()
    focusDay.current = true
    setCursor(dateValue(next))
  }

  return (
    <div className="space-y-1.5">
      <span className="text-muted block text-xs font-medium">{label}</span>
      <Button className="w-full justify-between text-left font-normal" aria-label={`${label}: ${fullFormat.format(calendarDate(value))}`}
        aria-haspopup="dialog" aria-expanded={open} disabled={disabled} onClick={() => { setCursor(value); setOpen(true) }}>
        <span>{new Intl.DateTimeFormat(i18n.language, { dateStyle: "long" }).format(calendarDate(value))}</span>
        <CalendarDays aria-hidden="true" className="text-muted size-[18px]" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen} title={label} footer={<Button className="w-full" onClick={() => choose(today)}>{t("datePicker.today")}</Button>}>
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" aria-label={t("datePicker.previousMonth")} onClick={() => move(-1)}><ChevronLeft /></Button>
            <Select className="min-w-0 flex-1" label={t("datePicker.month")} value={String(current.getMonth())} onChange={(month) => move(Number(month) - current.getMonth())}
              options={Array.from({ length: 12 }, (_, month) => ({ value: String(month), label: capitalize(monthFormat.format(new Date(2024, month, 1))) }))} />
            <Select className="w-24 shrink-0" label={t("datePicker.year")} value={String(current.getFullYear())} onChange={(year) => move((Number(year) - current.getFullYear()) * 12)}
              options={years.map((year) => ({ value: String(year), label: String(year) }))} />
            <Button size="icon" variant="ghost" aria-label={t("datePicker.nextMonth")} onClick={() => move(1)}><ChevronRight /></Button>
          </div>
          <div ref={grid} role="grid" aria-label={new Intl.DateTimeFormat(i18n.language, { month: "long", year: "numeric" }).format(current)}>
            <div role="row" className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }, (_, day) => <span key={day} role="columnheader" className="text-muted py-2 text-center text-xs font-medium">{capitalize(weekdayFormat.format(new Date(2024, 0, 1 + day)))}</span>)}
            </div>
            {Array.from({ length: 6 }, (_, week) => <div key={week} role="row" className="grid grid-cols-7 gap-1">
              {days.slice(week * 7, week * 7 + 7).map((day) => {
                const date = dateValue(day)
                return <div key={date} role="gridcell" aria-selected={date === value}>
                  <button type="button" data-date={date} aria-label={fullFormat.format(day)} aria-current={date === today ? "date" : undefined}
                    tabIndex={date === cursor ? 0 : -1} onClick={() => choose(date)} onKeyDown={(event) => onKeyDown(event, day)}
                    className={cn("my-0.5 flex h-11 w-full items-center justify-center rounded-control text-sm font-medium tabular-nums outline-offset-2 focus-visible:outline-2 focus-visible:outline-fg",
                      date === value ? "bg-inverse text-inverse-fg" : "hover:bg-surface-hover",
                      day.getMonth() !== current.getMonth() && date !== value && "text-muted",
                      date === today && date !== value && "ring-fg ring-1 ring-inset",
                    )}>{day.getDate()}</button>
                </div>
              })}
            </div>)}
          </div>
        </div>
      </Sheet>
    </div>
  )
}
