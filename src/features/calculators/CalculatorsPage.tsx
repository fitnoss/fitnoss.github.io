import { useSearchParams } from "react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/shared/components/PageHeader"
import { Field, Input } from "@/shared/ui/field"
import { Panel } from "@/shared/ui/panel"
import { Segmented } from "@/shared/ui/segmented"
import { cn } from "@/shared/lib/utils"
import { useSettings } from "@/shared/storage/settings"
import { ACTIVITY, bmi, bmiClass, calories, oneRepMax, platesPerSide, repsAtPercent, type Activity } from "./math"

function NumField({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix?: string }) {
  return (
    <Field label={label}>
      <div className="relative">
        <Input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className="h-12 pr-10 text-[17px] font-semibold tabular-nums" />
        {suffix && <span className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">{suffix}</span>}
      </div>
    </Field>
  )
}

const n = (v: string) => {
  const x = parseFloat(v.replace(",", "."))
  return Number.isFinite(x) ? x : 0
}

const round = (v: number, step = 0.5) => Math.round(v / step) * step

const big = "text-[56px] leading-none font-bold tracking-tight tabular-nums"

const TABS = { orm: OneRepMax, plates: Plates, bmi: Bmi, kcal: Calories }

export function CalculatorsPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const initial = params.get("tab")
  const [tab, setTab] = useState<keyof typeof TABS>(initial && initial in TABS ? initial as keyof typeof TABS : "orm")
  return (
    <>
      <PageHeader title={t("calc.title")} back="/more">
        <div className="px-4 pb-3">
          <Segmented
            value={tab}
            onChange={setTab}
            options={(Object.keys(TABS) as (keyof typeof TABS)[]).map((k) => ({ value: k, label: t(`calc.${k}`) }))}
          />
        </div>
      </PageHeader>
      <div className="px-4 pt-2 pb-8">
        {Object.entries(TABS).map(([key, Component]) => <div key={key} hidden={tab !== key}><Component /></div>)}
      </div>
    </>
  )
}

function OneRepMax() {
  const { t } = useTranslation()
  const [w, setW] = useState("80")
  const [r, setR] = useState("8")
  const res = oneRepMax(n(w), Math.round(n(r)))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <NumField label={t("calc.weight")} value={w} onChange={setW} suffix={t("workout.kg")} />
        <NumField label={t("calc.reps")} value={r} onChange={setR} />
      </div>
      <Panel className="flex flex-col items-center gap-2 p-6">
        <div className="text-muted text-sm">{t("calc.yourMax")}</div>
        <div className={cn(big, "text-accent")}>{round(res.avg)}</div>
        <div className="text-muted text-xs tabular-nums">
          Epley {round(res.epley)} · Brzycki {round(res.brzycki)}
        </div>
      </Panel>
      <Panel className="divide-y overflow-hidden">
        {[100, 95, 90, 85, 80, 75, 70, 65, 60, 50].map((p) => (
          <div key={p} className="flex items-center px-4 py-2.5 text-sm">
            <span className="text-muted w-12 tabular-nums">{p}%</span>
            <span className="flex-1 font-semibold tabular-nums">{t("units.kg", { n: round((res.avg * p) / 100, 2.5) })}</span>
            <span className="text-muted text-xs">{t("calc.repsApprox", { n: repsAtPercent(p) })}</span>
          </div>
        ))}
      </Panel>
    </div>
  )
}

// Standard competition plate colors.
const PLATE_COLORS: Record<number, string> = {
  25: "bg-red-600",
  20: "bg-blue-600",
  15: "bg-yellow-500",
  10: "bg-green-600",
  5: "bg-zinc-100 border border-zinc-400",
  2.5: "bg-zinc-800 dark:bg-zinc-600",
  1.25: "bg-zinc-400",
}

function Plates() {
  const { t } = useTranslation()
  const { barWeight, plates, set } = useSettings()
  const [params] = useSearchParams()
  const [target, setTarget] = useState(params.get("weight") ?? "100")
  const res = platesPerSide(n(target), barWeight, plates)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <NumField label={t("calc.target")} value={target} onChange={setTarget} suffix={t("workout.kg")} />
        <Field label={t("calc.bar")}>
          <Segmented
            className="h-12"
            value={String(barWeight)}
            onChange={(v) => set({ barWeight: Number(v) })}
            options={["20", "15", "10"].map((b) => ({ value: b, label: b }))}
          />
        </Field>
      </div>
      <Panel className="flex flex-col items-center gap-3 p-6">
        <div className="flex h-36 items-center">
          <div className="h-3 w-10 rounded-l bg-zinc-400" />
          {res.plates.map((p, i) => (
            <div
              key={i}
              className={cn("mx-px rounded-sm", PLATE_COLORS[p] ?? "bg-zinc-500")}
              style={{ width: p >= 10 ? 14 : 10, height: `${Math.max(30, Math.min(100, 40 + p * 2.4))}%` }}
              title={String(p)}
            />
          ))}
          <div className="h-3 w-6 rounded-r bg-zinc-400" />
        </div>
        <div className="text-center">
          <div className="text-muted text-xs">{t("calc.perSide")}</div>
          <div className="text-lg font-semibold tabular-nums">{res.plates.length ? res.plates.join(" + ") : "—"}</div>
          {res.remainder > 0.01 && <div className="text-danger text-xs">{t("calc.remainder", { n: Math.round(res.remainder * 100) / 100 })}</div>}
        </div>
      </Panel>
      <p className="text-muted px-1 text-[13px]">{t("calc.platesHint", { list: plates.join(", ") })}</p>
    </div>
  )
}

function Bmi() {
  const { t } = useTranslation()
  const [w, setW] = useState("75")
  const [h, setH] = useState("178")
  const v = bmi(n(w), n(h))
  const cls = bmiClass(v)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <NumField label={t("calc.bodyWeight")} value={w} onChange={setW} suffix={t("workout.kg")} />
        <NumField label={t("calc.height")} value={h} onChange={setH} suffix={t("calc.cm")} />
      </div>
      <Panel className="flex flex-col items-center gap-2 p-6">
        <div className={big}>{v ? v.toFixed(1) : "—"}</div>
        {v > 0 && <div className={cn("font-semibold", cls === "normal" ? "text-success" : "text-accent")}>{t(`calc.bmiClass.${cls}`)}</div>}
        <div className="text-muted mt-1 text-center text-xs">{t("calc.bmiNote")}</div>
      </Panel>
    </div>
  )
}

function Calories() {
  const { t } = useTranslation()
  const [sex, setSex] = useState<"m" | "f">("m")
  const [w, setW] = useState("75")
  const [h, setH] = useState("178")
  const [age, setAge] = useState("28")
  const [act, setAct] = useState<Activity>("moderate")
  const res = calories(sex, n(w), n(h), n(age), act)
  const valid = n(w) > 0 && n(h) > 0 && n(age) > 0
  return (
    <div className="space-y-4">
      <Segmented
        value={sex}
        onChange={setSex}
        options={[
          { value: "m", label: t("calc.male") },
          { value: "f", label: t("calc.female") },
        ]}
      />
      <div className="grid grid-cols-3 gap-2">
        <NumField label={t("calc.bodyWeight")} value={w} onChange={setW} suffix={t("workout.kg")} />
        <NumField label={t("calc.height")} value={h} onChange={setH} suffix={t("calc.cm")} />
        <NumField label={t("calc.age")} value={age} onChange={setAge} />
      </div>
      <div className="space-y-1.5">
        <span className="text-muted block text-xs font-medium">{t("calc.activity")}</span>
        <Panel role="radiogroup" className="divide-y overflow-hidden">
          {(Object.keys(ACTIVITY) as Activity[]).map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={act === a}
              onClick={() => setAct(a)}
              className={cn("flex w-full items-center gap-3 px-4 py-3 text-left text-sm", act === a ? "font-medium" : "text-muted hover:text-fg")}
            >
              <span className={cn("size-4 shrink-0 rounded-full", act === a ? "border-[5px] border-[var(--fg)]" : "border-2 border-[var(--muted)]")} />
              {t(`calc.act.${a}`)}
            </button>
          ))}
        </Panel>
      </div>
      {valid && (
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["cut", res.cut],
              ["maintain", res.tdee],
              ["bulk", res.bulk],
            ] as const
          ).map(([k, v]) => (
            <Panel key={k} className={cn("flex flex-col items-center gap-0.5 p-3", k === "maintain" && "bg-inverse text-inverse-fg")}>
              <div className="text-xl font-bold tabular-nums">{Math.round(v)}</div>
              <div className="text-[11px] opacity-60">{t(`calc.goal.${k}`)}</div>
            </Panel>
          ))}
        </div>
      )}
      {valid && <p className="text-muted text-center text-xs">{t("calc.bmr", { n: Math.round(res.bmr) })}</p>}
    </div>
  )
}
