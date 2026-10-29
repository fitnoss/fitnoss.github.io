import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router"
import { ArrowUpRight, ChartNoAxesColumn } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { Empty, Panel } from "@/shared/ui/panel"
import { Segmented } from "@/shared/ui/segmented"
import { LineChart } from "@/shared/ui/line-chart"
import { useExercises } from "@/entities/exercise/store"
import { e1rm, useSessionStore } from "@/entities/session/store"

type Metric = "e1rm" | "weight" | "volume" | "reps"

export function ExerciseProgressPage() {
  const { code = "" } = useParams()
  const { t, i18n } = useTranslation()
  const ex = Number(code)
  const history = useSessionStore((s) => s.history)
  const { byCode, text } = useExercises()
  const [metric, setMetric] = useState<Metric>("e1rm")
  const exercise = byCode.get(ex)
  const fmt = new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "short" })

  const points = useMemo(
    () =>
      history
        .filter((s) => s.exercises.some((e) => e.ex === ex))
        .map((s) => {
          const sets = s.exercises.filter((e) => e.ex === ex).flatMap((e) => e.sets)
          return {
            at: s.startedAt,
            date: fmt.format(s.startedAt),
            e1rm: Math.round(Math.max(...sets.map((x) => e1rm(x.weight ?? 0, x.reps ?? 0)))),
            weight: Math.max(...sets.map((x) => x.weight ?? 0)),
            volume: Math.round(sets.reduce((a, x) => a + (x.weight ?? 0) * (x.reps ?? 0), 0)),
            reps: Math.max(...sets.map((x) => x.reps ?? 0)),
            sets,
          }
        })
        .reverse(),
    [history, ex], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const hasWeights = points.some((p) => p.weight > 0)
  const shown = hasWeights ? metric : "reps"
  const best = points.length ? Math.max(...points.map((p) => p[shown])) : 0

  return (
    <>
      <PageHeader title={exercise ? text(exercise).name : t("exercise.unknown")} back="/progress" />
      <div className="space-y-4 px-4 pb-8">
        {exercise && (
          <Link to={`/ex/${exercise.s}`} className="text-muted hover:text-fg inline-flex items-center gap-1 px-1 text-sm font-medium">
            {t("progress.openExercise")} <ArrowUpRight className="size-4" />
          </Link>
        )}
        {points.length === 0 ? (
          <Empty icon={<ChartNoAxesColumn />} title={t("progress.empty")} />
        ) : (
          <>
            {hasWeights && (
              <Segmented
                size="sm"
                value={metric}
                onChange={setMetric}
                options={(["e1rm", "weight", "volume", "reps"] as const).map((m) => ({ value: m, label: t(`progress.${m}`) }))}
              />
            )}
            <Panel className="p-4">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-muted text-sm">{t("progress.best")}</span>
                <span className="text-[28px] leading-none font-bold tracking-tight tabular-nums">{best}</span>
              </div>
              <LineChart key={shown} data={points.map((p) => ({ label: p.date, value: p[shown] }))} />
            </Panel>
            <Panel className="divide-y overflow-hidden">
              {[...points].reverse().map((p) => (
                <div key={p.at} className="flex items-center gap-3 px-4 py-3">
                  <div className="text-muted w-16 shrink-0 text-[13px]">{p.date}</div>
                  <div className="flex flex-1 flex-wrap gap-1.5">
                    {p.sets.map((x, j) => (
                      <span key={j} className="bg-page hairline rounded-md px-2 py-0.5 text-[13px] font-medium tabular-nums">
                        {x.weight ? `${x.weight}×` : ""}
                        {x.reps ?? "—"}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </Panel>
          </>
        )}
      </div>
    </>
  )
}
