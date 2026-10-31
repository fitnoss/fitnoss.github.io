import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { SetLog } from "@/entities/session/store"
import { SET_TYPES, setType, type Effort } from "@/entities/session/sets"
import { Button } from "@/shared/ui/button"
import { Chip } from "@/shared/ui/chip"
import { Field } from "@/shared/ui/field"
import { Segmented } from "@/shared/ui/segmented"
import { Sheet } from "@/shared/ui/sheet"
import { Select } from "@/shared/ui/select"

export function SetDetailsSheet({ set, onChange, onClose, onPlates }: {
  onPlates?: () => void
  set: SetLog
  onChange: (patch: Partial<SetLog>) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [scale, setScale] = useState<"none" | Effort["scale"]>(set.effort?.scale ?? "none")
  const values = scale === "rpe" ? Array.from({ length: 19 }, (_, i) => 1 + i / 2) : Array.from({ length: 11 }, (_, i) => i)
  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose() }} title={t("workout.setDetails")}
      bodyClassName="space-y-5"
      footer={<Button variant="primary" size="lg" className="w-full" onClick={onClose}>{t("common.done")}</Button>}>
      {onPlates && <Button className="w-full" onClick={onPlates}>{t("calc.plates")} · {t("units.kg", { n: set.weight ?? 20 })}</Button>}
      <section>
        <h3 className="mb-2 text-sm font-semibold">{t("workout.setType")}</h3>
        <div className="flex flex-wrap gap-1.5">
          {SET_TYPES.map((type) => <Chip key={type} active={setType(set) === type} onClick={() => onChange({ type })}>{t(`setType.${type}`)}</Chip>)}
        </div>
        <p className="text-muted mt-2 text-sm">{t(`setTypeHint.${setType(set)}`)}</p>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">{t("workout.effort")}</h3>
        <Segmented value={scale} onChange={(value) => {
          if (value === scale) return
          setScale(value)
          onChange({ effort: undefined })
        }} options={[
          { value: "none", label: t("workout.noEffort") }, { value: "rpe", label: "RPE" }, { value: "rir", label: "RIR" },
        ]} />
        {scale !== "none" && <>
          <p className="text-muted text-sm">{t(scale === "rpe" ? "workout.rpeHint" : "workout.rirHint")}</p>
          <Field label={scale.toUpperCase()}>
            <Select label={scale.toUpperCase()} value={String(set.effort?.value ?? "")}
              onChange={(value) => onChange({ effort: value === "" ? undefined : { scale, value: Number(value) } })}
              options={[{ value: "", label: t("workout.noEffort") }, ...values.map((value) => ({ value: String(value), label: String(value) }))]} />
          </Field>
        </>}
      </section>
    </Sheet>
  )
}
