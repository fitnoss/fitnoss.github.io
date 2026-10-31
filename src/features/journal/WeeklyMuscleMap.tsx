import { useState } from "react"
import { useTranslation } from "react-i18next"
import { MUSCLES, key, type Exercise } from "@/entities/exercise/types"
import type { Session } from "@/entities/session/store"
import { calendarWeek, weeklyMuscleVolume } from "@/entities/session/muscles"
import { MuscleMap, muscleColor } from "@/shared/components/MuscleMap"
import { Panel } from "@/shared/ui/panel"

export function WeeklyMuscleMap({ history, exercises }: { history: Session[]; exercises: ReadonlyMap<number, Exercise> }) {
  const { t, i18n } = useTranslation()
  const [selected, setSelected] = useState("chest")
  const now = Date.now()
  const volume = weeklyMuscleVolume(history, exercises, now)
  const { start, end } = calendarWeek(now)
  const date = new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "short" })
  const hasSets = Object.values(volume).some((v) => v.primary || v.secondary)
  return (
    <Panel className="space-y-4 p-4">
      <div>
        <h2 className="font-semibold">{t("muscleMap.title")}</h2>
        <p className="text-muted text-xs">{date.format(start)} – {date.format(end - 1)}</p>
      </div>
      <MuscleMap volume={volume} selected={selected} onSelect={setSelected} />
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted" aria-label={t("muscleMap.legend")}>
        {[0, 1, 5, 10].map((sets, i) => (
          <span key={sets} className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm" style={{ background: muscleColor(sets) }} />
            {["0", "1–4", "5–9", "10+"][i]}
          </span>
        ))}
      </div>
      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">{t("muscleMap.choose")}</span>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="bg-surface hairline h-11 w-full rounded-xl px-3">
          {MUSCLES.map((muscle) => <option key={muscle} value={muscle}>{t(`muscle.${key(muscle)}`)}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3" aria-live="polite" aria-atomic="true">
        {(["primary", "secondary"] as const).map((kind) => (
          <div key={kind} className="bg-surface rounded-xl p-3">
            <div className="text-xl font-bold tabular-nums">{volume[selected][kind]}</div>
            <div className="text-muted text-xs">{t(`muscleMap.${kind}`)}</div>
          </div>
        ))}
      </div>
      <p className="text-muted text-xs">{t(hasSets ? "muscleMap.hint" : "muscleMap.empty")}</p>
      <a href={`${import.meta.env.BASE_URL}licenses/react-body-highlighter.txt`} target="_blank" rel="noreferrer" className="text-muted block text-[11px] underline">{t("muscleMap.credit")}</a>
    </Panel>
  )
}
