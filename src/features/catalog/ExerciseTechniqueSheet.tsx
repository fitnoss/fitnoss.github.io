import { useTranslation } from "react-i18next"
import { useExercises } from "@/entities/exercise/store"
import { type Exercise, exerciseEquipment, key } from "@/entities/exercise/types"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { Button } from "@/shared/ui/button"
import { Tag } from "@/shared/ui/chip"
import { Sheet } from "@/shared/ui/sheet"

/** Nested preview keeps the underlying selection and scroll position mounted. */
export function ExerciseTechniqueSheet({ exercise, onClose, selected, onToggle }: {
  exercise: Exercise; onClose: () => void; selected?: boolean; onToggle?: () => void
}) {
  const { t } = useTranslation()
  const { text } = useExercises()
  const description = text(exercise)
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()} title={description.name}
      bodyClassName="space-y-4" footer={
        <div className="flex flex-wrap gap-2">
          <Button onClick={onClose}>{t("common.back")}</Button>
          {onToggle && <Button variant={selected ? "default" : "primary"} className="flex-1" onClick={onToggle}>
            {t(selected ? "picker.unselect" : "picker.select")}
          </Button>}
        </div>
      }>
      <ExerciseImage ex={exercise} alt="" size="l" className="aspect-video w-full rounded-xl object-contain" />
      <div className="flex flex-wrap gap-1.5">
        {exerciseEquipment(exercise).map((item) => <Tag key={item}>{t(`equipment.${item}`)}</Tag>)}
        {exercise.pm.map((muscle) => <Tag key={muscle}>{t(`muscle.${key(muscle)}`)}</Tag>)}
      </div>
      <h3 className="font-semibold">{t("exercise.technique")}</h3>
      <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed">
        {description.steps.filter((step) => step.trim()).map((step, i) => <li key={i}>{step}</li>)}
      </ol>
      {description.machine && <p className="text-muted text-xs">{t("exercise.machineTranslation")}</p>}
    </Sheet>
  )
}
