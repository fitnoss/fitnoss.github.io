import { useTranslation } from "react-i18next"
import { Field, Input } from "@/shared/ui/field"
import { NumberInput } from "@/shared/ui/number-input"
import { Segmented } from "@/shared/ui/segmented"
import { RestInput } from "@/shared/components/RestInput"
import { Stepper } from "@/shared/components/Stepper"
import { Switch } from "@/shared/ui/switch"
import { canProgress, formatReps, parseReps, type ParsedReps, type ProgramItem } from "@/entities/program/types"
import { DELOAD, DELOAD_AFTER } from "@/entities/session/progression"
import { formatDuration } from "./format"

/** Progression steps in kg: dumbbells go up by 1–2 kg, barbells by pairs of plates. */
const STEPS = [1, 1.25, 2, 2.5, 5]
const DEFAULT_STEP = 2.5

type Props = {
  item: ProgramItem
  onChange: (item: ProgramItem) => void
  /** The next exercise continues a superset, so this one has no rest of its own. */
  inSuperset?: boolean
}

const KIND_DEFAULTS: Record<ParsedReps["kind"], ParsedReps> = {
  reps: { kind: "reps", n: 10 },
  range: { kind: "range", a: 8, b: 12 },
  time: { kind: "time", s: 30 },
  amrap: { kind: "amrap" },
  max: { kind: "max" },
}

export function ItemEditor({ item, onChange, inSuperset }: Props) {
  const { t } = useTranslation()
  const reps = parseReps(item.reps)
  const setReps = (p: ParsedReps) => {
    const next = { ...item, reps: formatReps(p) }
    if (!canProgress(next.reps)) delete next.inc
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <Segmented
        size="sm"
        value={reps.kind}
        onChange={(k) => setReps(KIND_DEFAULTS[k])}
        options={(["reps", "range", "time", "amrap", "max"] as const).map((k) => ({ value: k, label: t(`scheme.kind.${k}`) }))}
      />

      {(reps.kind === "amrap" || reps.kind === "max") && <p className="text-muted text-xs">{t(`scheme.explain.${reps.kind}`)}</p>}
      <div className="flex flex-wrap gap-x-4 gap-y-3">
        <Stepper className="items-start" label={t("scheme.sets")} value={item.sets} min={1} max={30} onChange={(sets) => onChange({ ...item, sets })} />
        {reps.kind === "reps" && (
          <Stepper className="items-start" label={t("scheme.reps")} value={reps.n} min={1} max={500} onChange={(n) => setReps({ kind: "reps", n })} />
        )}
        {reps.kind === "range" && (
          <>
            <Stepper className="items-start" label={t("scheme.from")} value={reps.a} min={1} max={reps.b} onChange={(a) => setReps({ ...reps, a })} />
            <Stepper className="items-start" label={t("scheme.to")} value={reps.b} min={reps.a} max={500} onChange={(b) => setReps({ ...reps, b })} />
          </>
        )}
        {reps.kind === "time" && (
          <Stepper
            className="items-start"
            label={t("scheme.duration")}
            value={reps.s}
            min={5}
            max={3600}
            step={5}
            format={(v) => formatDuration(t, v)}
            onChange={(s) => setReps({ kind: "time", s })}
          />
        )}
        {inSuperset ? (
          <p className="text-muted w-full text-xs">{t("programs.supersetRest")}</p>
        ) : (
          <div className="flex flex-col items-start gap-1.5">
            <span className="text-muted text-xs font-medium">{t("scheme.rest")}</span>
            <RestInput value={item.rest} onChange={(rest) => onChange({ ...item, rest })} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-[6.5rem_1fr] gap-2">
        <Field label={t("scheme.weight")}>
          <NumberInput
            inputMode="decimal"
            placeholder="—"
            value={item.weight}
            onValueChange={(weight) => onChange({ ...item, weight })}
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

      <details><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">{t("scheme.advanced")}</summary>
      {(reps.kind === "reps" || reps.kind === "range") && (
        <div className="bg-page rounded-control space-y-3 p-3">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="text-[15px] font-medium">{t("scheme.progression")}</span>
            <Switch
              checked={!!item.inc}
              onChange={(on) => {
                const { inc: _, ...rest } = item
                onChange(on ? { ...item, inc: DEFAULT_STEP } : rest)
              }}
            />
          </label>
          {item.inc && (
            <>
              <Segmented
                size="sm"
                value={String(item.inc)}
                onChange={(v) => onChange({ ...item, inc: Number(v) })}
                options={STEPS.map((n) => ({ value: String(n), label: t("units.kg", { n: `+${n}` }) }))}
              />
              <p className="text-muted text-xs leading-snug">
                {reps.kind === "reps"
                  ? t("scheme.progressionReps", { n: reps.n, inc: item.inc })
                  : t("scheme.progressionRange", { a: reps.a, b: reps.b, inc: item.inc })}{" "}
                {t("scheme.progressionDeload", { n: DELOAD_AFTER, pct: DELOAD * 100 })}
              </p>
            </>
          )}
        </div>
      )}
      </details>
    </div>
  )
}
