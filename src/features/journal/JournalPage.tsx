import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { ChevronRight, Flame, History, Trophy } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { Empty, Panel } from "@/shared/ui/panel"
import { Segmented } from "@/shared/ui/segmented"
import { cn } from "@/shared/lib/utils"
import { useExercises } from "@/entities/exercise/store"
import { useSessionStore, type Session } from "@/entities/session/store"
import { e1rm, sessionVolume, sessionSetCount } from "@/entities/session/stats"
import { isCountedSet } from "@/entities/session/sets"
import { sessionDuration } from "@/entities/session/history"
import { parseReps } from "@/entities/program/types"

const DAY = 86_400_000

function startOfDay(t: number) {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function JournalPage() {
  const { t, i18n } = useTranslation()
  const history = useSessionStore((s) => s.history)
  const { byCode, text } = useExercises()
  const [tab, setTab] = useState<"history" | "records" | "exercises">("history")
  const fmtDate = new Intl.DateTimeFormat(i18n.language, { weekday: "short", day: "numeric", month: "short" })

  const stats = useMemo(() => {
    const today = startOfDay(Date.now())
    const days = new Set(history.map((s) => startOfDay(s.startedAt)))
    const week = Array.from({ length: 7 }, (_, i) => today - (6 - i) * DAY)
    // Streak in weeks with at least one workout.
    let streak = 0
    const weekStart = (ts: number) => {
      const d = new Date(ts)
      return startOfDay(ts - ((d.getDay() + 6) % 7) * DAY)
    }
    const weeks = new Set(history.map((s) => weekStart(s.startedAt)))
    // The current week without a workout yet doesn't break the streak.
    let w = weekStart(Date.now())
    if (!weeks.has(w)) w -= 7 * DAY
    for (; weeks.has(w); w -= 7 * DAY) streak++
    return {
      week: week.map((d) => ({ d, on: days.has(d) })),
      thisWeek: history.filter((s) => s.startedAt >= weekStart(Date.now())).length,
      streak,
    }
  }, [history])

  const records = useMemo(() => {
    const best = new Map<number, { e1rm: number; weight: number; reps: number; at: number }>()
    for (const s of history) {
      for (const e of s.exercises) {
        if (parseReps(e.reps).kind === "time") continue
        for (const set of e.sets) {
          if (!isCountedSet(set)) continue
          const v = e1rm(set.weight ?? 0, set.reps ?? 0)
          if (v > (best.get(e.ex)?.e1rm ?? 0)) best.set(e.ex, { e1rm: v, weight: set.weight!, reps: set.reps!, at: s.startedAt })
        }
      }
    }
    return [...best.entries()].sort((a, b) => b[1].at - a[1].at)
  }, [history])

  const [query, setQuery] = useState("")
  const mine = useMemo(() => {
    const found = new Map<number, { at: number; weight?: number; reps?: number; timed: boolean }>()
    for (const s of history) for (const e of s.exercises) {
      const last = e.sets.findLast(isCountedSet)
      if (last && !found.has(e.ex)) found.set(e.ex, { at: s.startedAt, weight: last.weight, reps: last.reps, timed: parseReps(e.reps).kind === "time" })
    }
    return [...found.entries()]
  }, [history])
  const recent = history.filter((s) => s.startedAt >= Date.now() - 28 * DAY).length
  const prior = history.filter((s) => s.startedAt >= Date.now() - 56 * DAY && s.startedAt < Date.now() - 28 * DAY).length
  const weekday = new Intl.DateTimeFormat(i18n.language, { weekday: "narrow" })

  return (
    <>
      <PageHeader title={t("journal.title")} />
      <div className="space-y-6 px-4 pb-8">
        <Panel className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            <Stat value={stats.thisWeek} label={t("journal.thisWeek")} />
            <Stat
              value={
                <span className="flex items-center gap-1">
                  <Flame className={cn("size-7", stats.streak ? "text-accent fill-accent/25" : "text-muted")} />
                  {stats.streak}
                </span>
              }
              label={t("journal.weekStreak")}
            />
          </div>
          <p className="text-muted text-sm">{t("journal.periodCompare", { recent: t("progress.sample", { count: recent }), change: recent - prior > 0 ? `+${recent - prior}` : recent - prior })}</p>
          <div className="grid grid-cols-7 gap-1.5">
            {stats.week.map(({ d, on }) => (
              <div key={d} className="flex flex-col items-center gap-1.5">
                <div className={cn("h-9 w-full rounded-lg", on ? "bg-accent" : "bg-page hairline")} />
                <span className="text-muted text-[11px] font-medium">{weekday.format(d)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-3">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "history", label: t("journal.history") },
              { value: "records", label: t("journal.records") },
              { value: "exercises", label: t("journal.myExercises") },
            ]}
          />
          {tab === "exercises" ? <div className="space-y-3">
            <input type="search" aria-label={t("catalog.search")} placeholder={t("catalog.search")} value={query} onChange={(e) => setQuery(e.target.value)} className="bg-surface hairline h-11 w-full rounded-xl px-3" />
            <Panel className="divide-y overflow-hidden">{mine.filter(([code]) => text(byCode.get(code)).name.toLowerCase().includes(query.toLowerCase())).map(([code, result]) => <Link key={code} to={"/progress/ex/" + code} className="hover:bg-surface-hover flex items-center gap-3 p-4"><div className="min-w-0 flex-1"><div className="text-sm font-medium">{text(byCode.get(code)).name}</div><div className="text-muted text-xs">{result.weight !== undefined ? t("units.kg", { n: result.weight }) + " × " : ""}{result.reps ?? "—"} {t(result.timed ? "workout.seconds" : "workout.reps")} · {fmtDate.format(result.at)}</div></div><ChevronRight className="size-4" /></Link>)}</Panel>
            {mine.length === 0 && <Empty title={t("journal.empty")} />}
          </div> : tab === "history" ? (
            history.length === 0 ? (
              <Empty icon={<History />} title={t("journal.empty")} />
            ) : (
              <Panel className="divide-y overflow-hidden">
                {history.map((s) => (
                  <SessionRow key={s.id} s={s} date={fmtDate.format(s.startedAt)} />
                ))}
              </Panel>
            )
          ) : records.length === 0 ? (
            <Empty icon={<Trophy />} title={t("journal.noRecords")} />
          ) : (
            <Panel className="divide-y overflow-hidden">
              {records.map(([code, r]) => (
                <Link key={code} to={`/progress/ex/${code}`} className="hover:bg-surface-hover flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-medium">{text(byCode.get(code)).name}</div>
                    <div className="text-muted text-[13px] tabular-nums">
                      {t("units.kg", { n: r.weight })} × {r.reps} · {fmtDate.format(r.at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[17px] font-bold tabular-nums">{t("units.kg", { n: Math.round(r.e1rm) })}</div>
                    <div className="text-muted text-[10px] font-medium">e1RM</div>
                  </div>
                </Link>
              ))}
            </Panel>
          )}
        </div>
      </div>
    </>
  )
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <div className="text-[34px] leading-none font-bold tracking-tight tabular-nums">{value}</div>
      <div className="text-muted mt-1.5 text-[13px]">{label}</div>
    </div>
  )
}

function SessionRow({ s, date }: { s: Session; date: string }) {
  const { t } = useTranslation()
  const sets = sessionSetCount(s)
  const minutes = Math.round(sessionDuration(s) / 60000)
  const volume = sessionVolume(s)
  return (
    <Link to={`/progress/session/${s.id}`} className="hover:bg-surface-hover flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium">{s.title}</div>
        <div className="text-muted text-[13px] tabular-nums">
          {date} · {t("units.min", { n: minutes })} · {t("journal.sets", { count: sets })}
          {volume > 0 && ` · ${t("units.kg", { n: Math.round(volume) })}`}
        </div>
      </div>
      <ChevronRight className="text-muted size-4 shrink-0" />
    </Link>
  )
}
