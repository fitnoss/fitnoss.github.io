import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { MUSCLES, key } from "@/entities/exercise/types"
import { useExercises } from "@/entities/exercise/store"
import type { ProgramData } from "@/entities/program/types"
import { programMuscleVolume } from "@/entities/program/volume"

export function ProgramVolume({ program }: { program: ProgramData }) {
  const { t } = useTranslation()
  const { byCode } = useExercises()
  const { volume, weekly, missingExercises } = programMuscleVolume(program, byCode)
  const uncovered = MUSCLES.filter((muscle) => !volume[muscle].primary && !volume[muscle].secondary)
  return (
    <details className="bg-surface hairline rounded-panel group mt-4">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t(weekly ? "programVolume.weekly" : "programVolume.cycle")}</span>
          <span className="text-muted block text-xs">{t("programVolume.covered", { count: MUSCLES.length - uncovered.length, total: MUSCLES.length })}</span>
        </span>
        <ChevronDown className="text-muted size-5 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 px-4 pb-4">
        <p className="text-muted text-xs leading-relaxed">{t(weekly ? "programVolume.weeklyHint" : "programVolume.cycleHint")}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-muted text-xs">
              <th scope="col" className="pb-2 text-left font-medium">{t("muscleMap.choose")}</th>
              <th scope="col" className="pb-2 pl-2 text-right font-medium">{t("muscleMap.primary")}</th>
              <th scope="col" className="pb-2 pl-2 text-right font-medium">{t("muscleMap.secondary")}</th>
            </tr></thead>
            <tbody>{MUSCLES.map((muscle) => (
              <tr key={muscle} className="border-line border-t">
                <th scope="row" className="py-2 text-left font-medium">{t(`muscle.${key(muscle)}`)}</th>
                <td className="py-2 pl-2 text-right tabular-nums">{volume[muscle].primary}</td>
                <td className="text-muted py-2 pl-2 text-right tabular-nums">{volume[muscle].secondary}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {uncovered.length > 0 && <p className="text-muted text-xs leading-relaxed"><span className="text-fg font-medium">{t("programVolume.uncovered")}: </span>{uncovered.map((muscle) => t(`muscle.${key(muscle)}`)).join(", ")}</p>}
        {missingExercises > 0 && <p role="status" className="text-muted text-xs">{t("programVolume.missing", { count: missingExercises })}</p>}
      </div>
    </details>
  )
}
