import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useExercises } from "@/entities/exercise/store"
import { parseReps } from "@/entities/program/types"
import { updateSetLog } from "@/entities/session/sets"
import { useSessionStore, type Session, type SetLog } from "@/entities/session/store"
import { Button } from "@/shared/ui/button"
import { Field, Input } from "@/shared/ui/field"
import { NumberInput } from "@/shared/ui/number-input"
import { Panel } from "@/shared/ui/panel"
import { Sheet } from "@/shared/ui/sheet"
import { confirmAction } from "@/shared/ui/confirm"
import { toast } from "@/shared/ui/toast"
import { SetDetailsSheet } from "@/features/workout/SetDetailsSheet"

/** Explicit save keeps exploring the editor reversible, including type and effort changes. */
export function SessionEditor({ session, onClose }: { session: Session; onClose: () => void }) {
  const { t } = useTranslation()
  const { byCode, text } = useExercises()
  const [draft, setDraft] = useState(() => structuredClone(session))
  const [details, setDetails] = useState<{ exercise: number; set: number } | null>(null)
  const dirty = JSON.stringify(draft) !== JSON.stringify(session)
  const close = async () => {
    if (!dirty || await confirmAction(t("journal.discardEdits"))) onClose()
  }
  const changeSet = (i: number, j: number, patch: Partial<SetLog>) => setDraft((current) => ({
    ...current,
    exercises: current.exercises.map((exercise, k) => k === i ? {
      ...exercise, sets: exercise.sets.map((set, n) => n === j ? updateSetLog(set, patch) : set),
    } : exercise),
  }))

  return (
    <Sheet open onOpenChange={(open) => { if (!open) void close() }} title={t("journal.editSession")}
      description={t("journal.editSessionHint")} bodyClassName="space-y-4" footer={
        <div className="flex gap-2">
          <Button onClick={() => void close()}>{t("common.cancel")}</Button>
          <Button variant="primary" className="flex-1" disabled={!dirty || !draft.title.trim()} onClick={() => {
            if (!useSessionStore.getState().editHistory(session, draft)) {
              toast.error(t("journal.editConflict"))
              return
            }
            toast.success(t("journal.editsSaved"))
            onClose()
          }}>{t("common.save")}</Button>
        </div>
      }>
      <Field label={t("journal.sessionTitle")}>
        <Input value={draft.title} maxLength={120} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
      </Field>
      {draft.exercises.map((exercise, i) => {
        const name = text(byCode.get(exercise.ex)).name
        const timed = parseReps(exercise.reps).kind === "time"
        return (
          <Panel key={i} className="space-y-3 p-3">
            <h3 className="font-semibold">{name}</h3>
            <div className="grid grid-cols-[3rem_1fr_1fr] items-center gap-2">
              <span className="text-muted text-xs">#</span>
              <span className="text-muted text-xs">{t("scheme.weight")}</span>
              <span className="text-muted text-xs">{t(timed ? "workout.seconds" : "scheme.reps")}</span>
              {exercise.sets.map((set, j) => {
                const context = t("workout.setContext", { name, n: j + 1 })
                return <SetFields key={j} set={set} context={context} index={j}
                  timed={timed} onDetails={() => setDetails({ exercise: i, set: j })}
                  onChange={(patch) => changeSet(i, j, patch)} />
              })}
            </div>
            <Field label={t("scheme.note")}>
              <Input value={exercise.note ?? ""} maxLength={80} onChange={(event) => setDraft({
                ...draft, exercises: draft.exercises.map((item, k) => k === i ? { ...item, note: event.target.value || undefined } : item),
              })} />
            </Field>
          </Panel>
        )
      })}
      {details && <SetDetailsSheet set={draft.exercises[details.exercise].sets[details.set]}
        onChange={(patch) => changeSet(details.exercise, details.set, patch)} onClose={() => setDetails(null)} />}
    </Sheet>
  )
}

function SetFields({ set, context, index, timed, onChange, onDetails }: {
  set: SetLog; context: string; index: number; timed: boolean
  onChange: (patch: Partial<SetLog>) => void; onDetails: () => void
}) {
  const { t } = useTranslation()
  return <>
    <Button size="icon" variant="ghost" onClick={onDetails} aria-label={`${context}, ${t("workout.setDetails")}`}>{index + 1} ⋯</Button>
    <NumberInput aria-label={`${context}, ${t("scheme.weight")}`} value={set.weight}
      onValueChange={(weight) => onChange({ weight })} />
    <NumberInput aria-label={`${context}, ${t(timed ? "workout.seconds" : "scheme.reps")}`} inputMode="numeric" value={set.reps}
      onValueChange={(reps) => onChange({ reps })} />
  </>
}
