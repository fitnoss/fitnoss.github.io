import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router"
import { ArrowUpRight, ChartNoAxesColumn } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { LoggedSet } from "@/shared/components/LoggedSet"
import { Empty, Panel } from "@/shared/ui/panel"
import { Segmented } from "@/shared/ui/segmented"
import { LineChart } from "@/shared/ui/line-chart"
import { useExercises } from "@/entities/exercise/store"
import { useSessionStore } from "@/entities/session/store"
import { exercisePoints, metricPeriod, type Metric, type Period } from "./progress"

const METRICS: Metric[] = ["e1rm", "weight", "volume", "reps", "duration"]

export function ExerciseProgressPage() {
  const { code = "" } = useParams()
  const { t, i18n } = useTranslation()
  const history = useSessionStore((state) => state.history)
  const { byCode, text } = useExercises()
  const [metric, setMetric] = useState<Metric>("e1rm")
  const [period, setPeriod] = useState<Period>("all")
  const exercise = byCode.get(Number(code))
  const fmt = new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "short", year: "2-digit" })
  const points = useMemo(() => exercisePoints(history, Number(code)), [history, code])
  const available = METRICS.filter((key) => points.some((point) => point.values[key] !== undefined))
  const shown = available.includes(metric) ? metric : (available[0] ?? "reps")
  const { current, previous, best, previousBest } = metricPeriod(points, shown, period)
  const unit = t(shown === "duration" ? "workout.seconds" : shown === "reps" ? "workout.reps" : "workout.kg")
  const lastChange = current.length > 1 ? current.at(-1)!.values[shown]! - current.at(-2)!.values[shown]! : undefined
  const periodChange = best !== undefined && previousBest !== undefined ? best - previousBest : undefined
  const signed = (number: number) => `${number > 0 ? "+" : ""}${Math.round(number * 100) / 100} ${unit}`

  return (
    <>
      <PageHeader title={exercise ? text(exercise).name : t("exercise.unknown")} back="/progress" wrapTitle />
      <div className="space-y-4 px-4 pb-8">
        {exercise && <Link to={`/ex/${exercise.s}`} className="text-muted hover:text-fg inline-flex min-h-11 items-center gap-1 px-1 text-sm font-medium">
          {t("progress.openExercise")} <ArrowUpRight className="size-4" />
        </Link>}
        {!points.length ? <Empty icon={<ChartNoAxesColumn />} title={t("progress.empty")} /> : <>
          <Segmented value={period} onChange={setPeriod} label={t("progress.period")}
            options={(["28", "84", "all"] as const).map((value) => ({ value, label: t(`progress.periods.${value}`) }))} />
          {available.length > 1 && <Segmented size="sm" value={shown} onChange={setMetric} label={t("progress.metric")}
            options={available.map((value) => ({ value, label: t(`progress.${value}`) }))} />}
          {!current.length ? <Empty title={t("progress.noPeriodResults")} /> : <>
            <Panel className="space-y-3 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted text-sm">{t("progress.best")}</span>
                <span className="text-[28px] leading-none font-bold tracking-tight tabular-nums">{best} {unit}</span>
              </div>
              <p className="text-muted text-xs">{t("progress.sample", { count: current.length })} · {fmt.format(current[0].at)} — {fmt.format(current.at(-1)!.at)}</p>
              {period !== "all" && <p className="text-sm">{t("progress.previousPeriod", { count: previous.length, days: period })}
                {periodChange !== undefined && <> · {t("progress.bestChange")}: {signed(periodChange)}</>}
              </p>}
              {lastChange !== undefined && <p className="text-sm">{t("progress.change")}: {signed(lastChange)}</p>}
              {current.length > 1
                ? <LineChart key={`${shown}-${period}`} unit={unit} label={t(`progress.${shown}`)} data={current.map((point) => ({ label: fmt.format(point.at), value: point.values[shown]! }))} />
                : <p className="text-muted text-sm">{t("progress.oneEntry")}</p>}
            </Panel>
            <Panel className="divide-y overflow-hidden">
              {[...current].reverse().map((point) => (
                <div key={point.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="text-muted shrink-0 text-[13px]">{fmt.format(point.at)}</div>
                  <div className="flex flex-1 flex-wrap gap-1.5">
                    {point.sets.map(({ set, timed }, j) => <LoggedSet key={j} set={set} timed={timed} />)}
                  </div>
                </div>
              ))}
            </Panel>
          </>}
        </>}
      </div>
    </>
  )
}
