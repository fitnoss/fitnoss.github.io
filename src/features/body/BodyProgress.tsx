import { useCallback, useEffect, useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { Camera, ChevronRight, Pencil, Plus, Ruler, Trash2 } from "lucide-react"
import { BODY_METRICS, localDate, metricHistory, sortMeasurements, validBodyValues, validMeasurement, type BodyMeasurement, type BodyMetric } from "@/entities/body/types"
import { deleteMeasurement, listMeasurements, saveMeasurement } from "@/entities/body/storage"
import { uid } from "@/shared/lib/id"
import { Button } from "@/shared/ui/button"
import { confirmAction } from "@/shared/ui/confirm"
import { Field, Input } from "@/shared/ui/field"
import { NumberInput } from "@/shared/ui/number-input"
import { Empty, Panel } from "@/shared/ui/panel"
import { PaginatedList } from "@/shared/ui/paginated-list"
import { Select } from "@/shared/ui/select"
import { Sheet } from "@/shared/ui/sheet"
import { LineChart } from "@/shared/ui/line-chart"
import { toast } from "@/shared/ui/toast"
import { prepareBodyPhoto } from "./photo"

function Photo({ blob, alt, className }: { blob: Blob; alt: string; className?: string }) {
  const [url, setUrl] = useState("")
  useEffect(() => {
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])
  return url ? <img src={url} alt={alt} className={className} /> : null
}

export function BodyProgress() {
  const { t, i18n } = useTranslation()
  const [entries, setEntries] = useState<BodyMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [metric, setMetric] = useState<BodyMetric>("weight")
  const [editing, setEditing] = useState<BodyMeasurement | "new" | null>(null)
  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try { setEntries(await listMeasurements()) }
    catch { setFailed(true) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  const date = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString(i18n.language, { day: "numeric", month: "short", year: "numeric" })
  const number = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 })
  const unit = (key: BodyMetric) => t(key === "weight" ? "workout.kg" : "body.cm")
  const points = metricHistory(entries, metric)
  const last = points.at(-1)
  const previous = points.at(-2)
  const change = last && previous ? Math.round((last.value - previous.value) * 100) / 100 : undefined

  if (loading) return <p role="status" className="text-muted py-8 text-center text-sm">{t("body.loading")}</p>
  if (failed) return <Panel className="space-y-3 p-4"><p role="alert">{t("body.storageFailed")}</p><Button onClick={() => void load()}>{t("body.retry")}</Button></Panel>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-semibold">{t("body.title")}</h2>
        <Button size="sm" variant="primary" onClick={() => setEditing("new")}><Plus />{t("body.add")}</Button>
      </div>
      {entries.length > 0 ? <>
        <Panel className="space-y-4 p-4">
          <Select label={t("body.metric")} value={metric} onChange={setMetric}
            options={BODY_METRICS.map((value) => ({ value, label: t(`body.metrics.${value}`) }))} />
          {last ? <>
            <div>
              <div className="text-3xl font-bold tabular-nums">{number.format(last.value)} <span className="text-muted text-sm font-medium">{unit(metric)}</span></div>
              <div className="text-muted mt-1 text-xs">{date(last.date)}{change !== undefined && ` · ${t("body.change", { value: `${change > 0 ? "+" : ""}${number.format(change)}`, unit: unit(metric) })}`}</div>
            </div>
            <LineChart key={`${metric}-${points.map((p) => `${p.id}:${p.value}:${p.date}`).join(",")}`} label={t(`body.metrics.${metric}`)}
              unit={unit(metric)} data={points.map((point) => ({ label: date(point.date), value: point.value }))} />
          </> : <p className="text-muted text-sm">{t("body.noMetric")}</p>}
        </Panel>
        <h3 className="font-semibold">{t("body.history")}</h3>
        <PaginatedList items={entries}>{(entry) => (
          <button key={entry.id} type="button" aria-label={`${t("body.edit")} · ${date(entry.date)}`}
            className="hover:bg-surface-hover flex w-full items-center gap-3 p-4 text-left" onClick={() => setEditing(entry)}>
            {entry.photo && <Photo blob={entry.photo} alt="" className="size-14 shrink-0 rounded-lg object-cover" />}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{date(entry.date)}</span>
              <span className="text-muted mt-1 block text-xs leading-relaxed">{BODY_METRICS.filter((key) => entry.values[key] !== undefined).map((key) => `${t(`body.metrics.${key}`)}: ${number.format(entry.values[key]!)} ${unit(key)}`).join(" · ") || t("body.photoOnly")}</span>
            </span>
            <ChevronRight className="text-muted size-4 shrink-0" />
          </button>
        )}</PaginatedList>
      </> : <Empty icon={<Ruler />} title={t("body.empty")}><p>{t("body.emptyHint")}</p></Empty>}
      <p className="text-muted text-xs leading-relaxed">{t("body.localHint")}</p>
      {editing && <MeasurementEditor entry={editing === "new" ? undefined : editing} onClose={() => setEditing(null)}
        onSaved={(entry) => { setEntries((all) => sortMeasurements([...all.filter((e) => e.id !== entry.id), entry])); setEditing(null) }}
        onDeleted={(id) => { setEntries((all) => all.filter((e) => e.id !== id)); setEditing(null) }} />}
    </div>
  )
}

function MeasurementEditor({ entry, onClose, onSaved, onDeleted }: {
  entry?: BodyMeasurement
  onClose: () => void
  onSaved: (entry: BodyMeasurement) => void
  onDeleted: (id: string) => void
}) {
  const { t } = useTranslation()
  const formId = useId()
  const [id] = useState(() => entry?.id ?? uid())
  const [date, setDate] = useState(entry?.date ?? localDate())
  const [values, setValues] = useState(entry?.values ?? {})
  const [photo, setPhoto] = useState(entry?.photo)
  const [saving, setSaving] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const draft: BodyMeasurement = { id, date, values, photo, updatedAt: Date.now() }
  const valid = validMeasurement(draft)
  const busy = saving || processing

  return (
    <Sheet open onOpenChange={(open) => { if (!open && !busy) onClose() }} title={t(entry ? "body.edit" : "body.add")}
      footer={<div className="flex gap-2">
        {entry && <Button variant="danger" disabled={busy} aria-label={t("common.delete")} onClick={async () => {
          if (!await confirmAction(t("body.confirmDelete"))) return
          setSaving(true)
          try { await deleteMeasurement(entry.id); onDeleted(entry.id) }
          catch { setError(t("body.saveFailed")); setSaving(false) }
        }}><Trash2 /></Button>}
        <Button className="flex-1" disabled={busy} onClick={onClose}>{t("common.cancel")}</Button>
        <Button className="flex-1" variant="primary" form={formId} type="submit" disabled={busy || !valid}>{t(saving ? "body.saving" : "common.save")}</Button>
      </div>}>
      <form id={formId} className="space-y-4" onSubmit={async (event) => {
        event.preventDefault()
        if (!valid || busy) return
        setSaving(true)
        setError("")
        try { await saveMeasurement(draft); onSaved(draft); toast.success(t("body.saved")) }
        catch { setError(t("body.saveFailed")); setSaving(false) }
      }}>
        <fieldset disabled={busy} className="space-y-4">
          <Field label={t("body.date")}><Input type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            {BODY_METRICS.map((key) => <Field key={key} label={`${t(`body.metrics.${key}`)}, ${t(key === "weight" ? "workout.kg" : "body.cm")}`}>
              <NumberInput aria-label={t(`body.metrics.${key}`)} placeholder="—" value={values[key]} onValueChange={(value) => {
                setValues((previous) => { const next = { ...previous }; if (value === undefined) delete next[key]; else next[key] = value; return next })
              }} />
            </Field>)}
          </div>
          {!validBodyValues(values) && <p role="alert" className="text-danger text-xs">{t("body.invalidValues")}</p>}
          <p className="text-muted text-xs">{t("body.valuesHint")}</p>
          <div className="space-y-2">
            <span className="block text-sm font-medium">{t("body.photo")}</span>
            {photo && <Photo blob={photo} alt={t("body.photo")} className="mx-auto max-h-80 max-w-full rounded-xl object-contain" />}
            <div className="flex flex-wrap items-center gap-2">
              <label className="bg-surface hairline rounded-control hover:bg-surface-hover relative flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm font-medium focus-within:outline-2 focus-within:outline-fg">
                {photo ? <Pencil className="size-4" /> : <Camera className="size-4" />}{t(photo ? "body.replacePhoto" : "body.addPhoto")}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="absolute inset-0 w-full cursor-pointer opacity-0" aria-label={t(photo ? "body.replacePhoto" : "body.addPhoto")}
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ""
                    if (!file) return
                    setProcessing(true)
                    setError("")
                    try { setPhoto(await prepareBodyPhoto(file)) }
                    catch { setError(t("body.photoFailed")) }
                    finally { setProcessing(false) }
                  }} />
              </label>
              {photo && <Button size="sm" variant="ghost" onClick={() => setPhoto(undefined)}>{t("body.removePhoto")}</Button>}
            </div>
            {processing && <p role="status" className="text-muted text-xs">{t("body.processing")}</p>}
          </div>
        </fieldset>
        {error && <p role="alert" className="text-danger text-sm">{error}</p>}
      </form>
    </Sheet>
  )
}
