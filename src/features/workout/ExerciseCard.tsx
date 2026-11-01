import { memo, useMemo, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"
import { ArrowDown, ArrowLeftRight, ArrowUp, Check, Clock, Flame, Link2, Minus, Plus, Trash2, TrendingDown, TrendingUp, Unlink2, X } from "lucide-react"
import { CongratsCat } from "@/shared/components/CongratsCat"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { ExerciseNote } from "@/shared/components/ExerciseNote"
import { RestInput } from "@/shared/components/RestInput"
import { Button } from "@/shared/ui/button"
import { NumberInput } from "@/shared/ui/number-input"
import { Menu, MenuItem } from "@/shared/ui/menu"
import { Panel } from "@/shared/ui/panel"
import { toast } from "@/shared/ui/toast"
import { cn } from "@/shared/lib/utils"
import { useSettings } from "@/shared/storage/settings"
import { useExercises } from "@/entities/exercise/store"
import { usesBodyweight } from "@/entities/exercise/types"
import { parseReps } from "@/entities/program/types"
import { beatsRecord } from "@/entities/session/stats"
import { lastSets, useSessionStore, type SessionExercise, type SetLog } from "@/entities/session/store"
import { isWarmup, setType } from "@/entities/session/sets"
import { warmupGear, warmupSets } from "@/entities/session/warmup"
import { formatDuration, formatRepsLabel } from "@/features/programs/format"
import { primeAudio } from "./RestTimerBar"
import { ReplaceExerciseSheet } from "./ReplaceExerciseSheet"
import { Sheet } from "@/shared/ui/sheet"
import { SetDetailsSheet } from "./SetDetailsSheet"

type Props = {
  e: SessionExercise
  i: number
  last: boolean
  /** False inside a superset: the rest timer waits for its last exercise. */
  restsAfter: boolean
  /** Full-screen slide (cards view): a big photo on top. */
  big?: boolean
  /** "2a" when the exercise is part of a superset, shown on slides. */
  supersetLabel?: string
  /** Called after a set gets checked off. */
  onSetDone?: (index: number) => void
}

export const ExerciseCard = memo(function ExerciseCard({ e, i, last, restsAfter, big, supersetLabel, onSetDone }: Props) {
  const { t } = useTranslation()
  const { byCode, text } = useExercises()
  const { updateSet, toggleSet, addSet, removeSet, removeExercise, replaceExercise, moveExercise, setRest, toggleSuperset, setWarmup } = useSessionStore(useShallow((s) => ({
    updateSet: s.updateSet, toggleSet: s.toggleSet, addSet: s.addSet, removeSet: s.removeSet,
    removeExercise: s.removeExercise, replaceExercise: s.replaceExercise, moveExercise: s.moveExercise,
    setRest: s.setRest, toggleSuperset: s.toggleSuperset, setWarmup: s.setWarmup,
  })))
  const navigate = useNavigate()
  const history = useSessionStore((s) => s.history)
  const previous = useMemo(() => lastSets(history, e.ex, e.reps), [history, e.ex, e.reps])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [removeSetOpen, setRemoveSetOpen] = useState(false)
  const barWeight = useSettings((s) => s.barWeight)
  const plates = useSettings((s) => s.plates)
  const [restOpen, setRestOpen] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const ex = byCode.get(e.ex)
  const bodyweight = usesBodyweight(ex)
  const [addLoad, setAddLoad] = useState(false)
  const showWeight = !bodyweight || addLoad || e.sets.some((set) => set.weight !== undefined)
  const reps = parseReps(e.reps)
  const timed = reps.kind === "time"
  const allDone = e.sets.length > 0 && e.sets.every((s) => s.done)
  const hasWarmup = e.sets.some(isWarmup)
  const work = e.sets.find((s) => !isWarmup(s))?.weight
  const gear = ex && warmupGear(ex.eq, barWeight, plates)
  const ramp = gear && work ? warmupSets(work, gear) : []
  const remove = () => {
    const snapshot = useSessionStore.getState().active
    removeExercise(i)
    const after = useSessionStore.getState().active
    toast(t("workout.exerciseRemoved"), { action: { label: t("common.undo"), onClick: () => {
      // Never overwrite any work logged after deletion.
      const current = useSessionStore.getState().active
      if (!current || !snapshot || current.id !== snapshot.id) return
      if (current === after) useSessionStore.setState({ active: snapshot })
      else {
        const exercises = [...current.exercises]
        exercises.splice(Math.min(i, exercises.length), 0, snapshot.exercises[i])
        useSessionStore.setState({ active: { ...current, exercises } })
      }
    } } })
  }
  // Working sets are numbered from 1, warm-ups get a letter instead.
  let n = 0

  return (
    <Panel className={cn("space-y-3 p-2.5", allDone && "shadow-[inset_0_0_0_1.5px_var(--accent)]")}>
      {big && ex && (
        <Link to={`/ex/${ex.s}`} className="block" aria-label={`${t("exercise.technique")}: ${text(ex).name}`}>
          <ExerciseImage ex={ex} alt="" size="l" animate className="hairline aspect-[3/2] w-full rounded-[12px]" />
        </Link>
      )}
      <div className={cn("flex items-center gap-3", big && "px-1")}>
        {ex && !big && (
          <Link to={`/ex/${ex.s}`} className="shrink-0" aria-label={`${t("exercise.technique")}: ${text(ex).name}`}>
            <ExerciseImage ex={ex} alt="" className="hairline size-14 rounded-[10px]" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          {big && supersetLabel && (
            <div className="text-accent-ink mb-0.5 flex items-center gap-1 text-[13px] font-semibold">
              <Link2 className="size-3.5" /> {t("programs.superset")} · {supersetLabel}
            </div>
          )}
          <div className={cn("line-clamp-2 leading-snug font-semibold", big ? "text-[20px] font-bold tracking-tight" : "text-[15px]")}>
            {ex ? text(ex).name : t("exercise.unknown")}
          </div>
          <div className="text-muted mt-0.5 flex items-center gap-1 text-[13px]">
            {t("workout.target")}: {formatRepsLabel(t, e.reps)}
            {e.progression && (
              <span className={cn("inline-flex items-center gap-0.5 font-medium", e.progression === "up" ? "text-accent-ink" : "text-fg")}>
                {" "}·{" "}
                {e.progression === "up" ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {t(e.progression === "up" ? "workout.progressionUp" : "workout.progressionDeload")}
                {previous?.[0]?.weight !== undefined && work !== undefined && <>: {previous[0].weight} → {t("units.kg", { n: work })}</>}
              </span>
            )}
            {restsAfter && (
              <>
                {" "}·
                <button
                  type="button"
                  onClick={() => setRestOpen((o) => !o)}
                  aria-expanded={restOpen}
                  aria-label={t("workout.changeRest")}
                  className="hover:text-fg inline-flex items-center gap-1 underline decoration-dotted underline-offset-4"
                >
                  <Clock className="size-3.5" /> {e.rest ? formatDuration(t, e.rest) : t("workout.noRest")}
                </button>
              </>
            )}
          </div>
        </div>
        <Menu size="icon-sm">
          {ex && e.sets.some((s) => !s.done && !isWarmup(s)) && (
            <MenuItem onClick={() => setReplaceOpen(true)}>
              <ArrowLeftRight /> {t("workout.replaceExercise")}
            </MenuItem>
          )}
          {i > 0 && (
            <MenuItem onClick={() => moveExercise(i, -1)}>
              <ArrowUp /> {t("workout.moveUp")}
            </MenuItem>
          )}
          {!last && (
            <MenuItem onClick={() => moveExercise(i, 1)}>
              <ArrowDown /> {t("workout.moveDown")}
            </MenuItem>
          )}
          {i > 0 && (
            <MenuItem onClick={() => toggleSuperset(i)}>
              {e.superset ? <Unlink2 /> : <Link2 />} {t(e.superset ? "programs.unlinkUp" : "programs.linkUp")}
            </MenuItem>
          )}
          {!last && (
            <MenuItem onClick={() => toggleSuperset(i + 1)}>
              {restsAfter ? <Link2 /> : <Unlink2 />} {t(restsAfter ? "programs.linkDown" : "programs.unlinkDown")}
            </MenuItem>
          )}
          <MenuItem danger onClick={() => e.sets.some((s) => s.done) ? setDeleteOpen(true) : remove()}>
            <Trash2 /> {t("common.delete")}
          </MenuItem>
        </Menu>
      </div>

      <ExerciseNote note={e.note} />
      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen} title={t("common.delete")} footer={
        <div className="flex gap-2"><Button onClick={() => setDeleteOpen(false)}>{t("common.cancel")}</Button><Button variant="danger" onClick={() => { setDeleteOpen(false); remove() }}>{t("common.delete")}</Button></div>
      }><p>{t("workout.confirmRemoveExercise")}</p></Sheet>
      <Sheet open={removeSetOpen} onOpenChange={setRemoveSetOpen} title={t("workout.removeSet")} footer={<div className="flex gap-2"><Button onClick={() => setRemoveSetOpen(false)}>{t("common.cancel")}</Button><Button variant="danger" onClick={() => { removeSet(i, e.sets.length - 1); setRemoveSetOpen(false) }}>{t("common.delete")}</Button></div>}><p>{t("workout.confirmRemoveSet")}</p></Sheet>
      {restOpen && restsAfter && <RestInput autoFocus value={e.rest} onChange={(s) => setRest(i, s)} onDone={() => setRestOpen(false)} />}

      {bodyweight && <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted text-sm">{t(showWeight ? "workout.addedWeightHint" : "workout.bodyweightHint")}</p>
        {!showWeight && <Button size="sm" onClick={() => setAddLoad(true)}><Plus className="size-4" />{t("workout.addWeight")}</Button>}
      </div>}
      <div className={cn("bg-page rounded-control grid items-center gap-x-2 gap-y-1.5 p-2 text-center", showWeight ? "grid-cols-[3rem_1fr_1fr_2.75rem]" : "grid-cols-[3rem_1fr_2.75rem]")}>
        <span className="text-muted text-[11px] font-medium">#</span>
        {showWeight && <span className="text-muted text-xs font-medium">{t(bodyweight ? "workout.addedKg" : "workout.kg")}</span>}
        <span className="text-muted text-[11px] font-medium">{timed ? t("workout.seconds") : t("workout.reps")}</span>
        <span />
        {e.sets.map((s, j) => (
          <SetRow
            key={j}
            label={isWarmup(s) ? t("workout.warmupShort") : `${++n}${setType(s) === "drop" ? `·${t("workout.dropShort")}` : setType(s) === "failure" ? `·${t("workout.failureShort")}` : ""}`}
            exerciseName={ex ? text(ex).name : t("exercise.unknown")}
            number={j + 1}
            timed={timed}
            showWeight={showWeight}
            bodyweight={bodyweight}
            previous={isWarmup(s) ? undefined : previous?.[n - 1]}
            onPlates={ex?.eq === "barbell" ? () => navigate("/more/calc?tab=plates&weight=" + (s.weight ?? 20)) : undefined}
            set={s}
            onChange={(patch) => updateSet(i, j, patch)}
            weight={s.weight}
            reps={s.reps ?? (timed ? reps.s : undefined)}
            done={s.done}
            onWeight={(weight) => updateSet(i, j, { weight })}
            onReps={(r) => updateSet(i, j, { reps: r })}
            onToggle={() => {
              primeAudio()
              toggleSet(i, j)
              if (s.done) return
              const { history, active } = useSessionStore.getState()
              const set = active?.exercises[i]?.sets[j]
              if (active && set && beatsRecord(history, active, i, j)) {
                toast.success(t("workout.record", { weight: set.weight, reps: set.reps }), { icon: <CongratsCat /> })
              }
              onSetDone?.(i)
            }}
          />
        ))}
      </div>

      <div className="flex justify-center gap-1">
        <Button variant="ghost" size="sm" disabled={e.sets.length === 0} onClick={() => e.sets.at(-1)?.done ? setRemoveSetOpen(true) : removeSet(i, e.sets.length - 1)} aria-label={t("workout.removeSet")}>
          <Minus className="size-4" />
        </Button>
        <span className="text-muted flex items-center px-1 text-[13px] font-medium">{t("workout.addSet")}</span>
        <Button variant="ghost" size="sm" onClick={() => addSet(i)} aria-label={t("workout.addSet")}>
          <Plus className="size-4" />
        </Button>
        {(hasWarmup || ramp.length > 0) && (
          <Button variant="ghost" size="sm" className="text-muted ml-2" onClick={() => setWarmup(i, hasWarmup ? [] : ramp)}>
            {hasWarmup ? <X className="size-4" /> : <Flame className="size-4" />}
            {t(hasWarmup ? "workout.removeWarmup" : "workout.warmup")}
          </Button>
        )}
      </div>
      {replaceOpen && ex && (
        <ReplaceExerciseSheet source={ex} onClose={() => setReplaceOpen(false)} onPick={(code) => {
          setReplaceOpen(false)
          replaceExercise(i, code)
        }} />
      )}
    </Panel>
  )
})

function SetRow(props: {
  label: string
  exerciseName: string
  number: number
  timed: boolean
  showWeight: boolean
  bodyweight: boolean
  previous?: SetLog
  onPlates?: () => void
  set: SetLog
  onChange: (patch: Partial<SetLog>) => void
  weight?: number
  reps?: number
  done: boolean
  onWeight: (v?: number) => void
  onReps: (v?: number) => void
  onToggle: () => void
}) {
  const { label, exerciseName, number, timed, showWeight, bodyweight, previous, onPlates, set, onChange, weight, reps, done, onWeight, onReps, onToggle } = props
  const { t } = useTranslation()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const context = t("workout.setContext", { name: exerciseName, n: number })
  const warmup = isWarmup(set)
  const field = cn("h-11 text-center text-[17px] font-semibold tabular-nums", (done || warmup) && "text-muted")
  return (
    <>
      <button type="button" onClick={() => setDetailsOpen(true)}
        aria-label={`${context}, ${t("workout.setDetails")}, ${t(`setType.${setType(set)}`)}`}
        className={cn("hover:bg-surface flex min-h-11 flex-col items-center justify-center rounded-lg text-sm font-semibold tabular-nums", done ? "text-accent-ink" : "text-muted")}>
        <span className="underline decoration-dotted underline-offset-4">{label} ⋯</span>
        {set.effort && <span className="mt-1 text-[10px] leading-none">{set.effort.scale.toUpperCase()} {set.effort.value}</span>}
      </button>
      {showWeight && <NumberInput aria-label={`${context}, ${t(bodyweight ? "workout.addedWeight" : "scheme.weight")}`} className={field} value={weight} placeholder="—" onValueChange={onWeight} />}
      <NumberInput aria-label={`${context}, ${t(timed ? "workout.seconds" : "scheme.reps")}`} inputMode="numeric" className={field} value={reps} placeholder="—" onValueChange={onReps} />
      <button
        type="button"
        onClick={onToggle}
        aria-label={`${context}, ${t(done ? "workout.unmarkSet" : "workout.markSet")}`}
        aria-pressed={done}
        className={cn(
          "rounded-control flex size-11 items-center justify-center justify-self-center transition-colors",
          done ? "bg-accent text-accent-fg" : "bg-surface hairline text-muted hover:bg-surface-hover",
        )}
      >
        <Check className="size-5" strokeWidth={done ? 3 : 2} />
      </button>
      {previous && <p className={cn("px-1 text-left text-xs text-muted", showWeight ? "col-span-4" : "col-span-3")}>{bodyweight && previous.weight !== undefined ? t("workout.addedWeight") + ": " : ""}{t("workout.previousSet", { weight: previous.weight ?? "—", reps: previous.reps ?? "—", unit: t(timed ? "workout.seconds" : "workout.reps") })}</p>}
      {detailsOpen && <SetDetailsSheet set={set} onChange={onChange} onClose={() => setDetailsOpen(false)} onPlates={onPlates ? () => { setDetailsOpen(false); onPlates() } : undefined} />}
    </>
  )
}
