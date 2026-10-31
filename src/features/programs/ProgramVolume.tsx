import { useTranslation } from "react-i18next"
import { MUSCLES, key } from "@/entities/exercise/types"
import { useExercises } from "@/entities/exercise/store"
import type { ProgramData } from "@/entities/program/types"
import { programMuscleVolume } from "@/entities/program/volume"
import { MuscleMap, muscleColor } from "@/shared/components/MuscleMap"
import { Panel } from "@/shared/ui/panel"

export function ProgramVolume({ program }: { program: ProgramData }) {
  const { t } = useTranslation()
  const { byCode } = useExercises()
  const { volume, weekly, missingExercises } = programMuscleVolume(program, byCode)
  const uncovered = MUSCLES.filter((muscle) => !volume[muscle].primary && !volume[muscle].secondary)
  const indirect = MUSCLES.filter((muscle) => !volume[muscle].primary && volume[muscle].secondary > 0)
  const direct = MUSCLES.filter((muscle) => volume[muscle].primary > 0)
  const colors = { direct: "var(--accent)", indirect: "#3b82f6", uncovered: muscleColor(0) }
  const muscleNames = (muscles: string[]) => muscles.map((muscle) => t(`muscle.${key(muscle)}`)).join(", ") || t("programVolume.none")
  return (
    <Panel className="mt-4 space-y-4 p-4">
      <div>
        <h2 className="font-semibold">{t(weekly ? "programVolume.weekly" : "programVolume.cycle")}</h2>
        <p className="text-muted mt-1 text-xs leading-relaxed">{t(weekly ? "programVolume.weeklyHint" : "programVolume.cycleHint")}</p>
      </div>
      <MuscleMap colorFor={(muscle) => volume[muscle]?.primary ? colors.direct : volume[muscle]?.secondary ? colors.indirect : colors.uncovered} />
      <div className="text-muted flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
        {(["direct", "indirect", "uncovered"] as const).map((kind) => (
          <span key={kind} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3 rounded-sm" style={{ background: colors[kind] }} />
            {t(`programVolume.${kind}`)}
          </span>
        ))}
      </div>
      <dl className="space-y-3 text-sm leading-relaxed">
        <div className="sr-only"><dt>{t("programVolume.direct")}</dt><dd>{muscleNames(direct)}</dd></div>
        <div><dt className="font-medium">{t("programVolume.uncovered")}</dt><dd className="text-muted">{muscleNames(uncovered)}</dd></div>
        <div><dt className="font-medium">{t("programVolume.indirectOnly")}</dt><dd className="text-muted">{muscleNames(indirect)}</dd></div>
      </dl>
      {missingExercises > 0 && <p role="status" className="text-muted text-xs">{t("programVolume.missing", { count: missingExercises })}</p>}
    </Panel>
  )
}
