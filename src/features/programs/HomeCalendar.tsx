import { lazy, Suspense, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { CalendarDays, Check, ChevronLeft, ChevronRight, Play, Plus, Timer } from "lucide-react"
import { useProgramStore } from "@/entities/program/store"
import { scheduleOn, workoutIndex, type ScheduleEntry } from "@/entities/program/schedule"
import { useSessionStore, type Session } from "@/entities/session/store"
import { useStartDay } from "@/features/workout/useStartDay"
import { calendarDate, dateValue, monthDays, moveCalendarMonth } from "@/shared/lib/calendar"
import { cn } from "@/shared/lib/utils"
import { Button, buttonClass } from "@/shared/ui/button"
import { Menu, MenuItem } from "@/shared/ui/menu"
import { Panel } from "@/shared/ui/panel"
import { dayName, weekdayName } from "./format"

const ScheduleSheet = lazy(() => import("./ScheduleSheet").then((module) => ({ default: module.ScheduleSheet })))

type WorkoutLookup = ReturnType<typeof workoutIndex>
type Row = { entry?: ScheduleEntry; session?: Session; active?: boolean; time?: string }

function sessionDate(session: Session) {
  return session.occurrence?.date ?? dateValue(new Date(session.startedAt))
}

/** Match results by occurrence. Keep archived results visible when the rule moves or disappears. */
function rowsOn(date: string, schedule: ScheduleEntry[], history: Session[], active?: Session): Row[] {
  const entries = scheduleOn(schedule, date)
  const matchingActive = active && sessionDate(active) === date ? active : undefined
  const sessions = matchingActive ? [matchingActive, ...history] : history
  const matched = new Set<string>()
  const rows: Row[] = entries.map((entry) => {
    const session = sessions.find((item) => item.occurrence?.entryId === entry.id)
    if (session) matched.add(session.id)
    return { entry, session, active: !!session && session === matchingActive, time: entry.time }
  })
  for (const session of sessions) {
    if (!matched.has(session.id)) rows.push({ session, active: session === matchingActive, time: session.occurrence?.time })
  }
  return rows.sort((a, b) => (a.time ?? "24:00").localeCompare(b.time ?? "24:00"))
}

export function HomeCalendar() {
  const { t, i18n } = useTranslation()
  const [today, setToday] = useState(() => dateValue(new Date()))
  const [selection, setSelection] = useState<string>()
  // Following today by default keeps the calendar current across local midnight.
  const selected = selection ?? today
  useEffect(() => {
    const refresh = () => setToday(dateValue(new Date()))
    const timer = window.setInterval(refresh, 30_000)
    window.addEventListener("focus", refresh)
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh) }
  }, [])
  const [scheduleSheet, setScheduleSheet] = useState<{ date: string; entry?: ScheduleEntry }>()
  const programs = useProgramStore((state) => state.programs)
  const schedule = useProgramStore((state) => state.schedule)
  const history = useSessionStore((state) => state.history)
  const active = useSessionStore((state) => state.active)
  const workouts = useMemo(() => workoutIndex(programs), [programs])
  const archive = useMemo(() => {
    const dates = new Map<string, Session[]>()
    for (const session of history) {
      const date = sessionDate(session)
      const list = dates.get(date)
      if (list) list.push(session)
      else dates.set(date, [session])
    }
    return dates
  }, [history])
  const rows = (date: string) => rowsOn(date, schedule, archive.get(date) ?? [], active)
  const current = calendarDate(selected)
  const days = monthDays(current)
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: "full" })
  const month = new Intl.DateTimeFormat(i18n.language, { month: "long", year: "numeric" }).format(current)
  const grid = useRef<HTMLDivElement>(null)
  const focusDate = useRef(false)
  useEffect(() => {
    if (!focusDate.current) return
    focusDate.current = false
    grid.current?.querySelector<HTMLButtonElement>(`[data-date="${selected}"]`)?.focus()
  }, [selected])
  const choose = (date: string) => setSelection(date === today ? undefined : date)
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, day: Date) => {
    const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key]
    if (offset === undefined) return
    event.preventDefault()
    const next = new Date(day)
    next.setDate(next.getDate() + offset)
    focusDate.current = true
    choose(dateValue(next))
  }
  const edit = (entry: ScheduleEntry, date: string) => setScheduleSheet({ date, entry })
  const plannedDot = "bg-accent-ink"
  const completedDot = "bg-success"

  return (
    <>
      <section aria-labelledby="home-today" className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 px-1">
          <h2 id="home-today" className="text-xl font-bold tracking-tight">{t("datePicker.today")}</h2>
          <p className="text-muted text-sm first-letter:uppercase">{dateFormat.format(calendarDate(today))}</p>
        </div>
        <WorkoutRows rows={rows(today)} date={today} workouts={workouts} onEdit={edit} empty={t("schedule.emptyToday")} />
        {active && sessionDate(active) !== today && <Link to="/workout" className={buttonClass("default", "md", "w-full justify-between")}>
          <span className="min-w-0 truncate">{active.title}</span><span className="flex items-center gap-1.5"><Play className="size-4" />{t("home.continue")}</span>
        </Link>}
      </section>

      <section aria-labelledby="home-calendar" className="space-y-3">
        <h2 id="home-calendar" className="px-1 text-xl font-bold tracking-tight">{t("schedule.calendar")}</h2>
        <Panel className="space-y-2 p-2.5 sm:p-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label={t("datePicker.previousMonth")} onClick={() => choose(dateValue(moveCalendarMonth(current, -1)))}><ChevronLeft /></Button>
            <h3 className="min-w-0 flex-1 text-center text-base font-semibold first-letter:uppercase" aria-live="polite">{month}</h3>
            <Button size="sm" onClick={() => setSelection(undefined)}>{t("datePicker.today")}</Button>
            <Button variant="ghost" size="icon" aria-label={t("datePicker.nextMonth")} onClick={() => choose(dateValue(moveCalendarMonth(current, 1)))}><ChevronRight /></Button>
          </div>
          <div ref={grid} role="grid" aria-label={month} className="space-y-0.5">
            <div role="row" className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: 7 }, (_, day) => <span key={day} role="columnheader" aria-label={weekdayName(day, "long")}
                className="text-muted py-1 text-center text-xs font-medium">{weekdayName(day)}</span>)}
            </div>
            {Array.from({ length: 6 }, (_, week) => <div key={week} role="row" className="grid grid-cols-7 gap-0.5">
              {days.slice(week * 7, week * 7 + 7).map((day) => {
                const date = dateValue(day)
                const dayRows = rows(date)
                const planned = dayRows.filter((row) => row.entry && (!row.session || row.active)).length
                const done = dayRows.filter((row) => row.session && !row.active).length
                const label = [dateFormat.format(day), planned && t("schedule.plannedCount", { count: planned }), done && t("schedule.completedCount", { count: done })].filter(Boolean).join(" · ")
                return <div key={date} role="gridcell" aria-selected={date === selected}>
                  <button type="button" data-date={date} aria-label={label} aria-current={date === today ? "date" : undefined}
                    tabIndex={date === selected ? 0 : -1} onClick={() => choose(date)} onKeyDown={(event) => onKeyDown(event, day)}
                    className={cn("rounded-control relative flex h-10 w-full flex-col items-center justify-center pb-1.5 text-sm font-semibold tabular-nums outline-offset-2 focus-visible:outline-2 focus-visible:outline-fg sm:h-11",
                      date === selected ? "bg-[var(--wash)] text-accent-ink ring-1 ring-inset ring-accent-ink" : "hover:bg-surface-hover",
                      day.getMonth() !== current.getMonth() && date !== selected && "text-muted opacity-60",
                      date === today && date !== selected && "ring-line ring-1 ring-inset",
                    )}>
                    {day.getDate()}
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-1.5 flex justify-center gap-1">
                      {planned > 0 && <span className={cn("size-1.5 rounded-full", plannedDot)} />}
                      {done > 0 && <span className={cn("size-1.5 rounded-full", completedDot)} />}
                    </span>
                  </button>
                </div>
              })}
            </div>)}
          </div>
          <div className="text-muted flex flex-wrap justify-center gap-x-4 gap-y-1 px-1 pt-1 text-xs">
            <span className="flex items-center gap-1.5"><span className={cn("size-1.5 rounded-full", plannedDot)} />{t("schedule.planned")}</span>
            <span className="flex items-center gap-1.5"><span className={cn("size-1.5 rounded-full", completedDot)} />{t("schedule.completed")}</span>
          </div>
        </Panel>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <h3 className="min-w-0 text-sm font-semibold first-letter:uppercase">{dateFormat.format(current)}</h3>
            <Button size="sm" variant="primary" onClick={() => setScheduleSheet({ date: selected })}><Plus /> {t("schedule.plan")}</Button>
          </div>
          <WorkoutRows rows={rows(selected)} date={selected} workouts={workouts} onEdit={edit} empty={t("schedule.emptyDate")} />
        </div>
      </section>
      {scheduleSheet && <Suspense fallback={<p role="status" className="text-muted text-sm">{t("common.loading")}</p>}>
        <ScheduleSheet {...scheduleSheet} onClose={() => setScheduleSheet(undefined)}
          onSave={(date) => choose(scheduleSheet.entry?.repeat === "weekly" ? scheduleSheet.date : date)} />
      </Suspense>}
    </>
  )
}

function WorkoutRows({ rows, date, workouts, onEdit, empty }: {
  rows: Row[]; date: string; workouts: WorkoutLookup; onEdit: (entry: ScheduleEntry, date: string) => void; empty: string
}) {
  const { t, i18n } = useTranslation()
  const start = useStartDay()
  const timeFormat = new Intl.DateTimeFormat(i18n.language, { hour: "numeric", minute: "2-digit", timeZone: "UTC" })
  const timeLabel = (time?: string) => {
    if (!time) return t("schedule.anyTime")
    const [hours, minutes] = time.split(":").map(Number)
    return timeFormat.format(Date.UTC(2000, 0, 1, hours, minutes))
  }
  if (!rows.length) return <Panel className="text-muted flex items-center gap-2.5 px-3.5 py-3 text-sm">
    <CalendarDays className="size-4 shrink-0" />{empty}
  </Panel>
  return <Panel><ul className="divide-y">
    {rows.map(({ entry, session, active, time }) => {
      const found = entry && workouts.get(entry.workoutId)
      const name = found ? dayName(t, found.workout.name, found.index) : session?.title
      const mode = session ? session.mode : found ? found.workout.mode : undefined
      const done = session && !active
      const status = t(done ? "schedule.completed" : active ? "home.inProgress" : "schedule.planned")
      const title = found ? <Link className="block truncate hover:underline" to={`/programs/${found.program.id}?workout=${found.workout.id}`}>{name}</Link> : name
      return <li key={entry?.id ?? session?.id} className="flex min-h-[3.75rem] items-center gap-1 px-2.5 py-1.5 sm:gap-2 sm:px-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold leading-snug">{title}</div>
          <div className="text-muted flex flex-wrap gap-x-1 text-xs leading-tight">
            <span>{timeLabel(time)}</span><span aria-hidden="true">·</span>
            <span>{t(mode === "checklist" ? "schedule.checklist" : "schedule.detailed")}</span><span aria-hidden="true">·</span>
            <span className={cn(done && "text-success", active && "text-accent-ink")}>{status}</span>
          </div>
        </div>
        {done ? <Link to={`/progress/session/${session.id}`} aria-label={`${t("schedule.viewResult")} · ${name}`}
          title={t("schedule.viewResult")} className={buttonClass("ghost", "icon", "text-success")}><Check /></Link> :
          active ? <Link to="/workout" className={buttonClass("primary", "sm")}>{t("home.continue")}</Link> :
          found && <Button size="icon" variant="ghost" disabled={!found.workout.items.length}
            aria-label={`${t("home.start")} · ${name}`} title={t("home.start")} onClick={() => start(found.program, found.index, { entryId: entry.id, date, time })}><Play /></Button>}
        {entry && <Menu><MenuItem onClick={() => onEdit(entry, date)}><Timer /> {t(entry.repeat === "weekly" ? "schedule.editWeekly" : "schedule.edit")}</MenuItem></Menu>}
      </li>
    })}
  </ul></Panel>
}
