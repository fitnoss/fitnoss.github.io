import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"
import { ArrowDown, ArrowUp, Check, Clock, Minus, Play, Plus, Trash2, X } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { Button } from "@/shared/ui/button"
import { Chip } from "@/shared/ui/chip"
import { Input } from "@/shared/ui/field"
import { Menu, MenuItem } from "@/shared/ui/menu"
import { Panel, Section } from "@/shared/ui/panel"
import { toast } from "@/shared/ui/toast"
import { cn } from "@/shared/lib/utils"
import { useExercises } from "@/entities/exercise/store"
import { useProgramStore } from "@/entities/program/store"
import { parseReps } from "@/entities/program/types"
import { useSessionStore, type Session, type SessionExercise } from "@/entities/session/store"
import { ExercisePicker } from "@/features/programs/ExercisePicker"
import { dayName, formatRepsLabel, formatDuration } from "@/features/programs/format"
import { RestTimerBar, primeAudio } from "./RestTimerBar"
import { useWakeLock } from "./useWakeLock"

export function WorkoutPage() {
  const active = useSessionStore((s) => s.active)
  return active ? <ActiveWorkout session={active} /> : <StartWorkout />
}

function StartWorkout() {
  const { t } = useTranslation()
  const programs = useProgramStore((s) => s.programs)
  const start = useSessionStore((s) => s.start)

  return (
    <>
      <PageHeader title={t("workout.title")} />
      <div className="space-y-8 px-4 pb-8">
        <Button variant="primary" size="lg" className="h-14 w-full text-base" onClick={() => (primeAudio(), start({ title: t("workout.free") }))}>
          <Play className="size-5 fill-current" /> {t("workout.startFree")}
        </Button>
        {programs.length > 0 ? (
          <Section title={t("workout.fromProgram")}>
            <div className="space-y-2">
              {programs.map((p) => (
                <Panel key={p.id} className="space-y-3 p-4">
                  <div className="font-semibold">{p.name || t("programs.untitled")}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.days.map((d, i) => (
                      <Chip
                        key={i}
                        className="bg-page disabled:opacity-40"
                        disabled={!d.items.length}
                        onClick={() => {
                          primeAudio()
                          start({ title: `${p.name || t("programs.untitled")} · ${dayName(t, d.name, i)}`, programId: p.id, day: i, plan: d })
                        }}
                      >
                        <Play className="size-3 fill-current" /> {dayName(t, d.name, i)}
                      </Chip>
                    ))}
                  </div>
                </Panel>
              ))}
            </div>
          </Section>
        ) : (
          <p className="text-muted text-center text-sm">
            {t("workout.noPrograms")}{" "}
            <Link to="/programs" className="text-fg font-medium underline underline-offset-4">
              {t("workout.createProgram")}
            </Link>
          </p>
        )}
      </div>
    </>
  )
}

function useElapsed(since: number) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const s = Math.max(0, Math.floor((now - since) / 1000))
  const h = Math.floor(s / 3600)
  const m = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, "0")
  return `${h ? `${h}:` : ""}${m}:${String(s % 60).padStart(2, "0")}`
}

function ActiveWorkout({ session }: { session: Session }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { finish, discard, addExercise } = useSessionStore()
  const [pickerOpen, setPickerOpen] = useState(false)
  const elapsed = useElapsed(session.startedAt)
  useWakeLock(true)

  const doneSets = session.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
  const totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0)

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-col">
            <span className="truncate text-[17px] leading-tight font-semibold">{session.title}</span>
            <span className="text-muted mt-0.5 flex items-center gap-1.5 text-[13px] font-medium tabular-nums">
              <span className="text-accent">{elapsed}</span>·
              <span>
                {doneSets}/{totalSets}
              </span>
            </span>
          </span>
        }
        actions={
          <>
            <Button
              variant="primary"
              size="sm"
              className="h-9"
              onClick={() => {
                const done = finish()
                if (done && done.exercises.length) {
                  toast.success(t("workout.saved"))
                  navigate(`/progress/session/${done.id}`)
                } else toast(t("workout.nothingSaved"))
              }}
            >
              <Check /> {t("workout.finish")}
            </Button>
            <Menu>
              <MenuItem danger onClick={() => confirm(t("workout.confirmDiscard")) && discard()}>
                <X /> {t("workout.discard")}
              </MenuItem>
            </Menu>
          </>
        }
      >
        <div className="bg-surface h-0.5">
          <div className="bg-accent h-full transition-[width] duration-300" style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} />
        </div>
      </PageHeader>
      <div className="space-y-2 px-4 pt-3 pb-36">
        {session.exercises.map((e, i) => (
          <ExerciseCard key={`${i}-${e.ex}`} e={e} i={i} last={i === session.exercises.length - 1} />
        ))}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="rounded-panel text-muted hover:text-fg hover:bg-surface flex h-14 w-full items-center justify-center gap-2 font-medium shadow-[inset_0_0_0_1.5px_var(--line)] transition-colors"
        >
          <Plus className="size-5" /> {t("workout.addExercise")}
        </button>
      </div>
      <RestTimerBar />
      <ExercisePicker open={pickerOpen} onOpenChange={setPickerOpen} onPick={(codes) => codes.forEach(addExercise)} />
    </>
  )
}

const REST_PRESETS = [0, 30, 45, 60, 90, 120, 180, 240]

function ExerciseCard({ e, i, last }: { e: SessionExercise; i: number; last: boolean }) {
  const { t } = useTranslation()
  const { byCode, text } = useExercises()
  const { updateSet, toggleSet, addSet, removeSet, removeExercise, moveExercise, setRest } = useSessionStore()
  const [restOpen, setRestOpen] = useState(false)
  const ex = byCode.get(e.ex)
  const reps = parseReps(e.reps)
  const timed = reps.kind === "time"
  const allDone = e.sets.length > 0 && e.sets.every((s) => s.done)

  return (
    <Panel className={cn("space-y-3 p-2.5", allDone && "shadow-[inset_0_0_0_1.5px_var(--accent)]")}>
      <div className="flex items-center gap-3">
        {ex && (
          <Link to={`/ex/${ex.s}`} className="shrink-0">
            <ExerciseImage ex={ex} alt="" className="hairline size-14 rounded-[10px]" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-[15px] leading-snug font-semibold">{ex ? text(ex).name : t("exercise.unknown")}</div>
          <div className="text-muted mt-0.5 flex items-center gap-1 text-[13px]">
            {t("workout.target")}: {formatRepsLabel(t, e.reps)} ·
            <button
              type="button"
              onClick={() => setRestOpen((o) => !o)}
              aria-expanded={restOpen}
              aria-label={t("workout.changeRest")}
              className="hover:text-fg inline-flex items-center gap-1 underline decoration-dotted underline-offset-4"
            >
              <Clock className="size-3.5" /> {e.rest ? formatDuration(t, e.rest) : t("workout.noRest")}
            </button>
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
          <MenuItem danger onClick={() => removeExercise(i)}>
            <Trash2 /> {t("common.delete")}
          </MenuItem>
        </Menu>
      </div>

      {restOpen && (
        <div role="radiogroup" aria-label={t("workout.rest")} className="no-scrollbar -mx-2.5 flex gap-1.5 overflow-x-auto px-2.5">
          {REST_PRESETS.map((s) => (
            <Chip
              key={s}
              role="radio"
              aria-checked={e.rest === s}
              active={e.rest === s}
              className="h-8 px-3 text-[13px]"
              onClick={() => {
                setRest(i, s)
                setRestOpen(false)
              }}
            >
              {s ? formatDuration(t, s) : t("workout.noRest")}
            </Chip>
          ))}
        </div>
      )}

      <div className="bg-page rounded-control grid grid-cols-[2rem_1fr_1fr_2.75rem] items-center gap-x-2 gap-y-1.5 p-2 text-center">
        <span className="text-muted text-[11px] font-medium">#</span>
        <span className="text-muted text-[11px] font-medium">{t("workout.kg")}</span>
        <span className="text-muted text-[11px] font-medium">{timed ? t("workout.seconds") : t("workout.reps")}</span>
        <span />
        {e.sets.map((s, j) => (
          <SetRow
            key={j}
            n={j + 1}
            weight={s.weight}
            reps={s.reps ?? (timed ? reps.s : undefined)}
            done={s.done}
            onWeight={(weight) => updateSet(i, j, { weight })}
            onReps={(r) => updateSet(i, j, { reps: r })}
            onToggle={() => (primeAudio(), toggleSet(i, j))}
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
      </div>
    </Panel>
  )
}

function num(v: string) {
  const n = parseFloat(v.replace(",", "."))
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

function SetRow(props: {
  n: number
  weight?: number
  reps?: number
  done: boolean
  onWeight: (v?: number) => void
  onReps: (v?: number) => void
  onToggle: () => void
}) {
  const { n, weight, reps, done, onWeight, onReps, onToggle } = props
  const field = cn("h-11 text-center text-[17px] font-semibold tabular-nums", done && "text-muted")
  return (
    <>
      <span className={cn("text-sm font-semibold tabular-nums", done ? "text-accent" : "text-muted")}>{n}</span>
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
