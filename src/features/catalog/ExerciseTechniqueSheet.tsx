import { useTranslation } from "react-i18next"
import { useExerciseText } from "@/entities/exercise/store"
import { type Exercise, exerciseEquipment } from "@/entities/exercise/types"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { Button } from "@/shared/ui/button"
import { Tag } from "@/shared/ui/chip"
import { Sheet } from "@/shared/ui/sheet"
import { ExerciseMuscles } from "./ExerciseMuscles"
import { TechniqueFeedback } from "./TechniqueFeedback"

/** Nested preview keeps the underlying selection and scroll position mounted. */
export function ExerciseTechniqueSheet({ exercise, onClose, selected, onToggle }: {
  exercise: Exercise; onClose: () => void; selected?: boolean; onToggle?: () => void
}) {
  const { t } = useTranslation()
  const description = useExerciseText(exercise)
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
      <ExerciseImage ex={exercise} alt="" size="l" animate priority className="aspect-video w-full rounded-xl object-contain" />
      <div className="flex flex-wrap gap-1.5">
        {exerciseEquipment(exercise).map((item) => <Tag key={item}>{t(`equipment.${item}`)}</Tag>)}
      </div>
      <section className="space-y-3">
        <h3 className="font-semibold">{t("exercise.muscles")}</h3>
        <ExerciseMuscles exercise={exercise} />
      </section>
      <h3 className="font-semibold">{t("exercise.technique")}</h3>
      {description.loading && <p role="status" className="text-muted text-sm">{t("common.loading")}</p>}
      <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed">
        {description.steps.filter((step) => step.trim()).map((step, i) => <li key={i}>{step}</li>)}
      </ol>
      {!description.loading && <TechniqueFeedback key={exercise.s} name={description.name} slug={exercise.s} machine={description.machine} />}
    </Sheet>
  )
}
