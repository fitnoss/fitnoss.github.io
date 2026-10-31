import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Check, ChevronRight, Flame, History, Trophy } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { WeekStrip } from "@/shared/components/WeekStrip"
import { Empty, Panel } from "@/shared/ui/panel"
import { Segmented } from "@/shared/ui/segmented"
import { PaginatedList } from "@/shared/ui/paginated-list"
import { cn } from "@/shared/lib/utils"
import { useExercises } from "@/entities/exercise/store"
import { useSessionStore, type Session } from "@/entities/session/store"
import { e1rm, sessionVolume, sessionSetCount } from "@/entities/session/stats"
import { isCountedSet } from "@/entities/session/sets"
import { sessionDuration } from "@/entities/session/history"
import { parseReps, weekdayOf } from "@/entities/program/types"
import { weeklyActivity } from "@/entities/session/activity"
import { WeeklyMuscleMap } from "./WeeklyMuscleMap"
import { BodyProgress } from "@/features/body/BodyProgress"

const DAY = 86_400_000

export function JournalPage() {
  const { t, i18n } = useTranslation()
  const history = useSessionStore((s) => s.history)
  const { byCode, text } = useExercises()
  const [tab, setTab] = useState<"history" | "records" | "exercises" | "body">("history")
  const fmtDate = new Intl.DateTimeFormat(i18n.language, { weekday: "short", day: "numeric", month: "short" })

  const stats = useMemo(() => weeklyActivity(history, Date.now()), [history])

  const records = useMemo(() => {
    if (tab !== "records") return []
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
  }, [history, tab])

  const [query, setQuery] = useState("")
  const mine = useMemo(() => {
    if (tab !== "exercises") return []
    const found = new Map<number, { at: number; weight?: number; reps?: number; timed: boolean }>()
    for (const s of history) for (const e of s.exercises) {
      const last = e.sets.findLast(isCountedSet)
      if (last && !found.has(e.ex)) found.set(e.ex, { at: s.startedAt, weight: last.weight, reps: last.reps, timed: parseReps(e.reps).kind === "time" })
    }
    return [...found.entries()]
  }, [history, tab])
  const recent = history.filter((s) => s.startedAt >= Date.now() - 28 * DAY).length
  const prior = history.filter((s) => s.startedAt >= Date.now() - 56 * DAY && s.startedAt < Date.now() - 28 * DAY).length

  return (
    <>
      <PageHeader title={t("journal.title")} />
      <div className="space-y-6 px-4 pb-8">
        <Segmented
          size="sm"
          label={t("journal.title")}
          value={tab}
          onChange={setTab}
          options={[
            { value: "history", label: t("journal.history") },
            { value: "records", label: t("journal.records") },
            { value: "exercises", label: t("journal.myExercises") },
            { value: "body", label: t("body.tab") },
          ]}
        />
        {tab === "body" ? <BodyProgress /> : <>
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
          <WeekStrip today={weekdayOf(new Date())} days={stats.week.map(({ d, on }) => ({
            active: on,
            content: on ? <Check aria-hidden="true" className="size-4" /> : "",
            label: fmtDate.format(d),
          }))} />
        </Panel>

        <WeeklyMuscleMap history={history} exercises={byCode} />

        <div className="space-y-3">
          {tab === "exercises" ? <div className="space-y-3">
            <input type="search" aria-label={t("catalog.search")} placeholder={t("catalog.search")} value={query} onChange={(e) => setQuery(e.target.value)} className="bg-surface hairline h-11 w-full rounded-xl px-3" />
            <PaginatedList key={`exercises-${query}`} items={mine.filter(([code]) => text(byCode.get(code)).name.toLowerCase().includes(query.toLowerCase()))}>
              {([code, result]) => <Link key={code} to={"/progress/ex/" + code} className="hover:bg-surface-hover flex items-center gap-3 p-4"><div className="min-w-0 flex-1"><div className="text-sm font-medium">{text(byCode.get(code)).name}</div><div className="text-muted text-xs">{result.weight !== undefined ? t("units.kg", { n: result.weight }) + " × " : ""}{result.reps ?? "—"} {t(result.timed ? "workout.seconds" : "workout.reps")} · {fmtDate.format(result.at)}</div></div><ChevronRight className="size-4" /></Link>}
            </PaginatedList>
            {mine.length === 0 && <Empty title={t("journal.empty")} />}
          </div> : tab === "history" ? (
            history.length === 0 ? (
              <Empty icon={<History />} title={t("journal.empty")} />
            ) : (
              <PaginatedList key="history" items={history}>
                {(s) => (
                  <SessionRow key={s.id} s={s} date={fmtDate.format(s.startedAt)} />
                )}
              </PaginatedList>
            )
          ) : records.length === 0 ? (
            <Empty icon={<Trophy />} title={t("journal.noRecords")} />
          ) : (
            <PaginatedList key="records" items={records}>
              {([code, r]) => (
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
              )}
            </PaginatedList>
          )}
        </div>
        </>}
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
