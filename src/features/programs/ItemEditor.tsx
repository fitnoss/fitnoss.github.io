import { useTranslation } from "react-i18next"
import { Field, Input } from "@/shared/ui/field"
import { Segmented } from "@/shared/ui/segmented"
import { Stepper } from "@/shared/components/Stepper"
import { formatReps, parseReps, type ParsedReps, type ProgramItem } from "@/entities/program/types"
import { formatDuration } from "./format"

type Props = { item: ProgramItem; onChange: (item: ProgramItem) => void }

const KIND_DEFAULTS: Record<ParsedReps["kind"], ParsedReps> = {
  reps: { kind: "reps", n: 10 },
  range: { kind: "range", a: 8, b: 12 },
  time: { kind: "time", s: 30 },
  amrap: { kind: "amrap" },
  max: { kind: "max" },
}

export function ItemEditor({ item, onChange }: Props) {
  const { t } = useTranslation()
  const reps = parseReps(item.reps)
  const setReps = (p: ParsedReps) => onChange({ ...item, reps: formatReps(p) })

  return (
    <div className="space-y-4">
      <Segmented
        size="sm"
        value={reps.kind}
        onChange={(k) => setReps(KIND_DEFAULTS[k])}
        options={(["reps", "range", "time", "amrap", "max"] as const).map((k) => ({ value: k, label: t(`scheme.kind.${k}`) }))}
      />

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-3">
        <Stepper label={t("scheme.sets")} value={item.sets} min={1} max={30} onChange={(sets) => onChange({ ...item, sets })} />
        {reps.kind === "reps" && (
          <Stepper label={t("scheme.reps")} value={reps.n} min={1} max={500} onChange={(n) => setReps({ kind: "reps", n })} />
        )}
        {reps.kind === "range" && (
          <>
            <Stepper label={t("scheme.from")} value={reps.a} min={1} max={reps.b} onChange={(a) => setReps({ ...reps, a })} />
            <Stepper label={t("scheme.to")} value={reps.b} min={reps.a} max={500} onChange={(b) => setReps({ ...reps, b })} />
          </>
        )}
        {reps.kind === "time" && (
          <Stepper
            label={t("scheme.duration")}
            value={reps.s}
            min={5}
            max={3600}
            step={5}
            format={(v) => formatDuration(t, v)}
            onChange={(s) => setReps({ kind: "time", s })}
          />
        )}
        <Stepper
          label={t("scheme.rest")}
          value={item.rest}
          min={0}
          max={600}
          step={15}
          format={(v) => formatDuration(t, v)}
          onChange={(rest) => onChange({ ...item, rest })}
        />
      </div>

      <div className="grid grid-cols-[6.5rem_1fr] gap-2">
        <Field label={t("scheme.weight")}>
          <Input
            inputMode="decimal"
            placeholder="—"
            value={item.weight ?? ""}
            onChange={(e) => {
              const w = parseFloat(e.target.value.replace(",", "."))
              onChange({ ...item, weight: Number.isFinite(w) && w > 0 ? w : undefined })
            }}
          />
        </Field>
        <Field label={t("scheme.note")}>
          <Input
            placeholder={t("scheme.notePlaceholder")}
            value={item.note ?? ""}
            maxLength={80}
            onChange={(e) => onChange({ ...item, note: e.target.value || undefined })}
          />
        </Field>
      </div>
    </div>
  )
}
