import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate } from "react-router"
import { CalendarDays, Check, ChevronRight, Coffee, ListChecks, Play, Plus, Timer } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { Logo, Wordmark } from "@/shared/components/Logo"
import { Button } from "@/shared/ui/button"
import { Empty, Panel, Section } from "@/shared/ui/panel"
import { cn } from "@/shared/lib/utils"
import { useExercises } from "@/entities/exercise/store"
import { useProgramStore } from "@/entities/program/store"
import { weekdayOf, type Program } from "@/entities/program/types"
import { useSessionStore } from "@/entities/session/store"
import { primeAudio } from "@/features/workout/RestTimerBar"
import { useStartDay } from "@/features/workout/useStartDay"
import { NewProgramSheet } from "./NewProgramSheet"
import { dayName, weekdayName } from "./format"

type Slot = { program: Program; day: number }

/** Program days scheduled on a weekday (with exercises to do). */
function slotsOn(programs: Program[], wd: number): Slot[] {
  return programs.flatMap((program) =>
    program.days.flatMap((d, day) => (d.items.length && d.weekdays?.includes(wd) ? [{ program, day }] : [])),
  )
}

/** Home screen: today's workout one tap away, then the programs. Templates live in the "New" sheet. */
export function ProgramsPage() {
  const { t } = useTranslation()
  const programs = useProgramStore((s) => s.programs)
  const active = useSessionStore((s) => s.active)
  const historyCount = useSessionStore((s) => s.history.length)
  const location = useLocation()
  const navigate = useNavigate()
  // Other screens link here with { newProgram: true } to open the sheet right away.
  const [newOpen, setNewOpen] = useState(() => !!(location.state as { newProgram?: boolean } | null)?.newProgram)
  useEffect(() => {
    // Drop the flag so a reload or going back doesn't open the sheet again.
    if (location.state) navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Logo className="h-12 w-14 md:h-16 md:w-[4.5rem]" />
            <Wordmark />
          </span>
        }
        actions={
          programs.length > 0 && <Button variant="primary" size="sm" className="h-11" onClick={() => setNewOpen(true)}>
            <Plus /> {t("programs.new")}
          </Button>
        }
      />
      <div className="space-y-8 px-4 pb-8">
        {historyCount >= 5 && !localStorage.getItem("fitnoss:last-export") && <Link to="/more?section=data" className="text-muted block text-sm underline underline-offset-4">{t("more.backupReminder")}</Link>}
        <Today programs={programs} />
        {!active && <Button size="lg" className="h-14 w-full" onClick={() => {
          primeAudio()
          useSessionStore.getState().start({ title: t("workout.free") })
          navigate("/workout")
        }}><Play className="size-5" />{t("workout.startFree")}</Button>}

        {programs.length === 0 ? (
          <Panel className="pb-6">
            <Empty icon={<ListChecks />} title={t("programs.emptyTitle")}>
              {t("programs.emptyText")}
            </Empty>
            <div className="flex justify-center">
              <Button variant="primary" onClick={() => setNewOpen(true)}>
                <Plus /> {t("programs.choose")}
              </Button>
            </div>
          </Panel>
        ) : (
          <Section title={t("programs.myPrograms")}>
            <div className="space-y-2">
              {programs.map((p) => (
                <ProgramRow key={p.id} program={p} />
              ))}
            </div>
          </Section>
        )}
      </div>
      <NewProgramSheet open={newOpen} onOpenChange={setNewOpen} />
    </>
  )
}

/** The workout in progress, today's scheduled one, or when the next one is. */
function Today({ programs }: { programs: Program[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const startDay = useStartDay()
  const active = useSessionStore((s) => s.active)
  const history = useSessionStore((s) => s.history)
  const now = new Date()
  const today = weekdayOf(now)

  if (active) {
    const done = active.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
    const total = active.exercises.reduce((n, e) => n + e.sets.length, 0)
    return (
      <Panel className="space-y-4 p-4">
        <div>
          <div className="text-accent flex items-center gap-1.5 text-[13px] font-semibold">
            <Timer className="size-4" /> {t("home.inProgress")}
          </div>
          <div className="mt-1 text-[20px] leading-tight font-bold tracking-tight">{active.title}</div>
          <div className="text-muted mt-1 text-sm tabular-nums">
            {done} / {t("home.setsCount", { count: total })}
          </div>
        </div>
        <Button variant="primary" size="lg" className="h-14 w-full text-base" onClick={() => navigate("/workout")}>
          <Play className="size-5 fill-current" /> {t("home.continue")}
        </Button>
      </Panel>
    )
  }

  const slots = slotsOn(programs, today)
  if (slots.length) {
    return (
      <div className="space-y-2">
        {slots.map(({ program, day }) => {
          const doneToday = history.some(
            (s) => s.programId === program.id && s.day === day && new Date(s.startedAt).toDateString() === now.toDateString(),
          )
          return (
            <TodayCard
              key={`${program.id}-${day}`}
              program={program}
              day={day}
              label={t("home.today", { weekday: weekdayName(today, "long") })}
              done={doneToday}
              onStart={() => startDay(program, day)}
            />
          )
        })}
      </div>
    )
  }

  for (let k = 1; k <= 7; k++) {
    const wd = (today + k) % 7
    const [next] = slotsOn(programs, wd)
    if (!next) continue
    const when = k === 1 ? t("home.tomorrow") : weekdayName(wd, "long")
    return (
      <Panel className="flex items-center gap-3 p-4">
        <div className="bg-page hairline text-muted flex size-11 shrink-0 items-center justify-center rounded-2xl">
          <Coffee className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{t("home.restDay")}</div>
          <div className="text-muted text-sm leading-snug">
            {t("home.next", { when })}: {dayName(t, next.program.days[next.day].name, next.day)}
          </div>
        </div>
        <Button size="sm" className="bg-page" onClick={() => startDay(next.program, next.day)}>
          {t("home.startNow")}
        </Button>
      </Panel>
    )
  }

  if (!programs.length) return null
  return (
    <Link to={`/programs/${programs[0].id}`} className="block">
      <Panel className="hover:bg-surface-hover flex items-center gap-3 p-4 transition-colors">
        <CalendarDays className="text-muted size-5 shrink-0" />
        <p className="text-muted flex-1 text-sm leading-snug">{t("home.scheduleHint")}</p>
        <ChevronRight className="text-muted size-5 shrink-0" />
      </Panel>
    </Link>
  )
}

function TodayCard({
  program,
  day,
  label,
  done,
  onStart,
}: {
  program: Program
  day: number
  label: string
  done: boolean
  onStart: () => void
}) {
  const { t } = useTranslation()
  const { byCode, text } = useExercises()
  const d = program.days[day]
  const shown = d.items.slice(0, 5)
  const sets = d.items.reduce((n, it) => n + it.sets, 0)

  return (
    <Panel className="space-y-4 p-4">
      <Link to={`/programs/${program.id}`} className="block">
        <div className="flex items-center justify-between gap-2">
          <span className="text-accent text-[13px] font-semibold">{label}</span>
          {done && (
            <span className="text-success flex items-center gap-1 text-[13px] font-semibold">
              <Check className="size-4" strokeWidth={3} /> {t("home.doneToday")}
            </span>
          )}
        </div>
        <div className="mt-1 text-[22px] leading-tight font-bold tracking-tight">{dayName(t, d.name, day)}</div>
        <div className="text-muted mt-1 text-sm">
          <div className="truncate">{program.name || t("programs.untitled")}</div>
          <div className="tabular-nums">
            {t("programs.exercisesCount", { count: d.items.length })} · {t("home.setsCount", { count: sets })}
          </div>
        </div>
      </Link>
      <div className="flex gap-1.5">
        {shown.map((it, i) => {
          const ex = byCode.get(it.ex)
          return ex ? (
            <Link key={i} to={`/ex/${ex.s}`} className="shrink-0" aria-label={text(ex).name}>
              <ExerciseImage ex={ex} alt="" animate={false} className="hairline size-12 rounded-[10px]" />
            </Link>
          ) : (
            <div key={i} className="bg-page size-12 shrink-0 rounded-[10px]" />
          )
        })}
        {d.items.length > shown.length && (
          <div className="bg-page hairline text-muted flex size-12 shrink-0 items-center justify-center rounded-[10px] text-sm font-semibold tabular-nums">
            +{d.items.length - shown.length}
          </div>
        )}
      </div>
      <Button variant={done ? "default" : "primary"} size="lg" className={cn("h-14 w-full text-base", done && "bg-page")} onClick={onStart}>
        <Play className="size-5 fill-current" /> {t(done ? "home.again" : "home.start")}
      </Button>
    </Panel>
  )
}

function ProgramRow({ program }: { program: Program }) {
  const { t } = useTranslation()
  const scheduled = program.days.some((d) => d.weekdays?.length)
  const today = weekdayOf(new Date())

  return (
    <Link to={`/programs/${program.id}`} className="block">
      <Panel className="hover:bg-surface-hover space-y-3 p-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{program.name || t("programs.untitled")}</div>
            <div className="text-muted mt-0.5 truncate text-sm">
              {program.days.map((d, i) => `${scheduled ? `${i + 1} ` : ""}${dayName(t, d.name, i)}`).join(" · ")}
            </div>
          </div>
          {!scheduled && (
            <div className="text-muted shrink-0 text-right text-xs leading-relaxed tabular-nums">
              <div>{t("programs.daysCount", { count: program.days.length })}</div>
              <div>{t("programs.exercisesCount", { count: program.days.reduce((n, d) => n + d.items.length, 0) })}</div>
            </div>
          )}
          <ChevronRight className="text-muted size-5 shrink-0" />
        </div>
        {scheduled && (
          <div className="grid grid-cols-7 gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map((wd) => {
              const day = program.days.findIndex((d) => d.weekdays?.includes(wd))
              return (
                <div key={wd} className="flex flex-col items-center gap-1">
                  <span className={cn("text-[11px] font-medium", wd === today ? "text-fg" : "text-muted")}>{weekdayName(wd, "short")}</span>
                  <span
                    className={cn(
                      "flex h-7 w-full items-center justify-center rounded-lg text-xs font-semibold tabular-nums",
                      day >= 0 ? "bg-inverse text-inverse-fg" : "bg-page",
                      wd === today && "ring-accent ring-2 ring-offset-0",
                    )}
                  >
                    {day >= 0 ? day + 1 : ""}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Panel>
    </Link>
  )
}
