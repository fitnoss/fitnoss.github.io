import { useTranslation } from "react-i18next"
import { key, type Exercise } from "@/entities/exercise/types"
import { MuscleMap, muscleColor } from "@/shared/components/MuscleMap"

const PRIMARY = "#3b82f6"
const SECONDARY = "#f59e0b"

/** Same catalogue muscle roles drive both the silhouettes and the text legend. */
export function ExerciseMuscles({ exercise }: { exercise: Pick<Exercise, "pm" | "sm"> }) {
  const { t } = useTranslation()
  const primary = [...new Set(exercise.pm)]
  const secondary = [...new Set(exercise.sm)].filter((muscle) => !primary.includes(muscle))
  if (!primary.length && !secondary.length) return null
  return (
    <div className="space-y-4">
      <MuscleMap colorFor={(muscle) => primary.includes(muscle) ? PRIMARY : secondary.includes(muscle) ? SECONDARY : muscleColor(0)} />
      <dl className="grid grid-cols-2 gap-4 text-sm">
        {[
          { muscles: primary, color: PRIMARY, title: t("exercise.primaryMuscles") },
          { muscles: secondary, color: SECONDARY, title: t("exercise.secondaryMuscles") },
        ].filter((group) => group.muscles.length).map((group) => (
          <div key={group.title}>
            <dt className="flex items-center gap-2 font-semibold">
              <span aria-hidden="true" className="size-3 shrink-0 rounded-sm" style={{ background: group.color }} />
              {group.title}
            </dt>
            <dd className="text-muted mt-1 pl-5">{group.muscles.map((muscle) => t(`muscle.${key(muscle)}`)).join(", ")}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
