import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { ArrowDown, ArrowUp, Check, Clock, Flame, Link2, Minus, Plus, Trash2, TrendingDown, TrendingUp, Unlink2, X } from "lucide-react"
import { CongratsCat } from "@/shared/components/CongratsCat"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { RestInput } from "@/shared/components/RestInput"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/field"
import { Menu, MenuItem } from "@/shared/ui/menu"
import { Panel } from "@/shared/ui/panel"
import { toast } from "@/shared/ui/toast"
import { cn } from "@/shared/lib/utils"
import { useSettings } from "@/shared/storage/settings"
import { useExercises } from "@/entities/exercise/store"
import { parseReps } from "@/entities/program/types"
import { beatsRecord } from "@/entities/session/stats"
import { useSessionStore, type SessionExercise } from "@/entities/session/store"
import { warmupGear, warmupSets } from "@/entities/session/warmup"
import { formatDuration, formatRepsLabel } from "@/features/programs/format"
import { primeAudio } from "./RestTimerBar"

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
  onSetDone?: () => void
}

export function ExerciseCard({ e, i, last, restsAfter, big, supersetLabel, onSetDone }: Props) {
  const { t } = useTranslation()
  const { byCode, text } = useExercises()
  const { updateSet, toggleSet, addSet, removeSet, removeExercise, moveExercise, setRest, toggleSuperset, setWarmup } = useSessionStore()
  const { barWeight, plates } = useSettings()
  const [restOpen, setRestOpen] = useState(false)
  const ex = byCode.get(e.ex)
  const reps = parseReps(e.reps)
  const timed = reps.kind === "time"
  const allDone = e.sets.length > 0 && e.sets.every((s) => s.done)
  const hasWarmup = e.sets.some((s) => s.warmup)
  const work = e.sets.find((s) => !s.warmup)?.weight
  const gear = ex && warmupGear(ex.eq, barWeight, plates)
  const ramp = gear && work ? warmupSets(work, gear) : []
  // Working sets are numbered from 1, warm-ups get a letter instead.
  let n = 0

  return (
    <Panel className={cn("space-y-3 p-2.5", allDone && "shadow-[inset_0_0_0_1.5px_var(--accent)]")}>
      {big && ex && (
        <Link to={`/ex/${ex.s}`} className="block">
          <ExerciseImage ex={ex} alt="" size="l" className="hairline aspect-[3/2] w-full rounded-[12px]" />
        </Link>
      )}
      <div className={cn("flex items-center gap-3", big && "px-1")}>
        {ex && !big && (
          <Link to={`/ex/${ex.s}`} className="shrink-0">
            <ExerciseImage ex={ex} alt="" className="hairline size-14 rounded-[10px]" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          {big && supersetLabel && (
            <div className="text-accent mb-0.5 flex items-center gap-1 text-[13px] font-semibold">
              <Link2 className="size-3.5" /> {t("programs.superset")} · {supersetLabel}
            </div>
          )}
          <div className={cn("line-clamp-2 leading-snug font-semibold", big ? "text-[20px] font-bold tracking-tight" : "text-[15px]")}>
            {ex ? text(ex).name : t("exercise.unknown")}
          </div>
          <div className="text-muted mt-0.5 flex items-center gap-1 text-[13px]">
            {t("workout.target")}: {formatRepsLabel(t, e.reps)}
            {e.progression && (
              <span className={cn("inline-flex items-center gap-0.5 font-medium", e.progression === "up" ? "text-accent" : "text-fg")}>
                {" "}·{" "}
                {e.progression === "up" ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {t(e.progression === "up" ? "workout.progressionUp" : "workout.progressionDeload")}
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
          <MenuItem danger onClick={() => removeExercise(i)}>
            <Trash2 /> {t("common.delete")}
          </MenuItem>
        </Menu>
      </div>

      {restOpen && restsAfter && <RestInput autoFocus value={e.rest} onChange={(s) => setRest(i, s)} onDone={() => setRestOpen(false)} />}

      <div className="bg-page rounded-control grid grid-cols-[2rem_1fr_1fr_2.75rem] items-center gap-x-2 gap-y-1.5 p-2 text-center">
        <span className="text-muted text-[11px] font-medium">#</span>
        <span className="text-muted text-[11px] font-medium">{t("workout.kg")}</span>
        <span className="text-muted text-[11px] font-medium">{timed ? t("workout.seconds") : t("workout.reps")}</span>
        <span />
        {e.sets.map((s, j) => (
          <SetRow
            key={j}
            label={s.warmup ? t("workout.warmupShort") : String(++n)}
            warmup={s.warmup}
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
              onSetDone?.()
            }}
          />
        ))}
      </div>
      <div className="flex justify-center gap-1">
        <Button variant="ghost" size="sm" disabled={e.sets.length === 0} onClick={() => removeSet(i, e.sets.length - 1)} aria-label="−">
          <Minus className="size-4" />
        </Button>
        <span className="text-muted flex items-center px-1 text-[13px] font-medium">{t("workout.addSet")}</span>
        <Button variant="ghost" size="sm" onClick={() => addSet(i)} aria-label="+">
          <Plus className="size-4" />
        </Button>
        {(hasWarmup || ramp.length > 0) && (
          <Button variant="ghost" size="sm" className="text-muted ml-2" onClick={() => setWarmup(i, hasWarmup ? [] : ramp)}>
            {hasWarmup ? <X className="size-4" /> : <Flame className="size-4" />}
            {t(hasWarmup ? "workout.removeWarmup" : "workout.warmup")}
          </Button>
        )}
      </div>
    </Panel>
  )
}

function num(v: string) {
  const n = parseFloat(v.replace(",", "."))
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

function SetRow(props: {
  label: string
  warmup?: boolean
  weight?: number
  reps?: number
  done: boolean
  onWeight: (v?: number) => void
  onReps: (v?: number) => void
  onToggle: () => void
}) {
  const { label, warmup, weight, reps, done, onWeight, onReps, onToggle } = props
  const field = cn("h-11 text-center text-[17px] font-semibold tabular-nums", (done || warmup) && "text-muted")
  return (
    <>
      <span className={cn("text-sm font-semibold tabular-nums", done ? "text-accent" : "text-muted")}>{label}</span>
      <Input inputMode="decimal" className={field} value={weight ?? ""} placeholder="—" onChange={(e) => onWeight(num(e.target.value))} />
      <Input inputMode="numeric" className={field} value={reps ?? ""} placeholder="—" onChange={(e) => onReps(num(e.target.value))} />
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        className={cn(
          "rounded-control flex size-11 items-center justify-center justify-self-center transition-colors",
          done ? "bg-accent text-accent-fg" : "bg-surface hairline text-muted hover:bg-surface-hover",
        )}
      >
        <Check className="size-5" strokeWidth={done ? 3 : 2} />
      </button>
    </>
  )
}
