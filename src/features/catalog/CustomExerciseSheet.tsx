import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { CATEGORIES, EQUIPMENT, MUSCLES, key } from "@/entities/exercise/types"
import { CUSTOM_INSTRUCTIONS_LIMIT, CUSTOM_NAME_LIMIT, useCustomExerciseStore, type CustomExercise } from "@/entities/exercise/custom"
import { Button } from "@/shared/ui/button"
import { Chip } from "@/shared/ui/chip"
import { Field, Input } from "@/shared/ui/field"
import { Select } from "@/shared/ui/select"
import { Sheet } from "@/shared/ui/sheet"

export function CustomExerciseSheet({ onClose, onCreate }: { onClose: () => void; onCreate: (exercise: CustomExercise) => void }) {
  const { t } = useTranslation()
  const formId = useId()
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [equipment, setEquipment] = useState("")
  const [muscles, setMuscles] = useState<string[]>([])
  const [instructions, setInstructions] = useState("")
  const save = () => {
    if (!name.trim()) return
    onCreate(useCustomExerciseStore.getState().create({ name, category, equipment, muscles, instructions }))
  }
  const options = (values: string[], prefix: string) => [
    { value: "", label: "—" },
    ...values.map((value) => ({ value, label: t(`${prefix}.${key(value)}`) })),
  ]
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()} title={t("custom.create")}
      footer={<Button variant="primary" className="w-full" disabled={!name.trim()} type="submit" form={formId}>{t("common.save")}</Button>}>
      <form id={formId} className="space-y-4" onSubmit={(event) => { event.preventDefault(); save() }}>
        <Field label={t("custom.name")}><Input required maxLength={CUSTOM_NAME_LIMIT} value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <div className="space-y-1.5">
          <p className="text-muted text-xs font-medium">{t("custom.category")}</p>
          <Select value={category} onChange={setCategory} options={options(CATEGORIES, "category")} label={t("custom.category")} />
        </div>
        <div className="space-y-1.5">
          <p className="text-muted text-xs font-medium">{t("exercise.equipment")}</p>
          <Select value={equipment} onChange={setEquipment} options={options(EQUIPMENT, "equipment")} label={t("exercise.equipment")} />
        </div>
        <fieldset className="space-y-2">
          <legend className="text-muted text-xs font-medium">{t("exercise.muscles")}</legend>
          <div className="flex flex-wrap gap-1.5">
            {MUSCLES.map((muscle) => <Chip key={muscle} active={muscles.includes(muscle)} onClick={() =>
              setMuscles((selected) => selected.includes(muscle) ? selected.filter((value) => value !== muscle) : [...selected, muscle])}>
              {t(`muscle.${key(muscle)}`)}
            </Chip>)}
          </div>
        </fieldset>
        <Field label={t("custom.instructions")}>
          <textarea className="bg-surface hairline rounded-control min-h-24 w-full p-3 text-base" value={instructions}
            maxLength={CUSTOM_INSTRUCTIONS_LIMIT} onChange={(event) => setInstructions(event.target.value)} />
        </Field>
      </form>
    </Sheet>
  )
}
