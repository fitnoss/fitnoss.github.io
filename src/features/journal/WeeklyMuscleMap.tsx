import { memo, useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { MUSCLES, key, type Exercise } from "@/entities/exercise/types"
import type { Session } from "@/entities/session/store"
import { calendarWeek, weeklyMuscleVolume } from "@/entities/session/muscles"
import { MuscleMap, muscleColor } from "@/shared/components/MuscleMap"
import { Panel } from "@/shared/ui/panel"
import { Select } from "@/shared/ui/select"

export const WeeklyMuscleMap = memo(function WeeklyMuscleMap({ history, exercises }: { history: Session[]; exercises: ReadonlyMap<number, Exercise> }) {
  const { t, i18n } = useTranslation()
  const [selected, setSelected] = useState("chest")
  const now = Date.now()
  const { start, end } = calendarWeek(now)
  const volume = useMemo(() => weeklyMuscleVolume(history, exercises, Date.now()), [history, exercises, start])
  const colorFor = useCallback((muscle: string) => muscleColor(volume[muscle]?.primary ?? 0), [volume])
  const date = new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "short" })
  const hasSets = Object.values(volume).some((v) => v.primary || v.secondary)
  return (
    <Panel className="space-y-4 p-4">
      <div>
        <h2 className="font-semibold">{t("muscleMap.title")}</h2>
        <p className="text-muted text-xs">{date.format(start)} – {date.format(end - 1)}</p>
      </div>
      <MuscleMap colorFor={colorFor} selected={selected} onSelect={setSelected} />
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted" aria-label={t("muscleMap.legend")}>
        {[0, 1, 5, 10].map((sets, i) => (
          <span key={sets} className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm" style={{ background: muscleColor(sets) }} />
            {["0", "1–4", "5–9", "10+"][i]}
          </span>
        ))}
      </div>
      <div className="text-sm">
        <span className="mb-1.5 flex items-center gap-2 text-muted"><span className="size-3 rounded-sm bg-blue-500" aria-hidden="true" />{t("muscleMap.choose")}</span>
        <Select label={t("muscleMap.choose")} value={selected} onChange={setSelected}
          options={MUSCLES.map((muscle) => ({ value: muscle, label: t(`muscle.${key(muscle)}`) }))} />
      </div>
      <div className="grid grid-cols-2 gap-3" aria-live="polite" aria-atomic="true">
        {(["primary", "secondary"] as const).map((kind) => (
          <div key={kind} className="bg-surface rounded-xl p-3">
            <div className="text-xl font-bold tabular-nums">{volume[selected][kind]}</div>
            <div className="text-muted text-xs">{t(`muscleMap.${kind}`)}</div>
          </div>
        ))}
      </div>
      <p className="text-muted text-xs">{t(hasSets ? "muscleMap.hint" : "muscleMap.empty")}</p>
    </Panel>
  )
})
