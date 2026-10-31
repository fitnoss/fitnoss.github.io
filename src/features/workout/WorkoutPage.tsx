import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { Check, GalleryHorizontalEnd, LayoutList, Plus, X } from "lucide-react"
import { CongratsCat } from "@/shared/components/CongratsCat"
import { PageHeader } from "@/shared/components/PageHeader"
import { SupersetGroup } from "@/shared/components/SupersetGroup"
import { Button } from "@/shared/ui/button"
import { Menu, MenuItem } from "@/shared/ui/menu"
import { toast } from "@/shared/ui/toast"
import { cn } from "@/shared/lib/utils"
import { useSettings } from "@/shared/storage/settings"
import { groups } from "@/entities/program/types"
import { useSessionStore, type Session } from "@/entities/session/store"
import { ExercisePicker } from "@/features/programs/ExercisePicker"
import { CardsPager, CardsView, useCarousel } from "./CardsView"
import { ExerciseCard } from "./ExerciseCard"
import { Sheet } from "@/shared/ui/sheet"
import { useWakeLock } from "./useWakeLock"

export function WorkoutPage() {
  const active = useSessionStore((s) => s.active)
  const navigate = useNavigate()
  useEffect(() => {
    // Redirect a direct visit to an idle workout; finishing has its own destination.
    if (!useSessionStore.getState().active) navigate("/", { replace: true })
  }, [navigate])
  return active ? <ActiveWorkout session={active} /> : null
}

function ElapsedTime({ since, pausedMs = 0 }: { since: number; pausedMs?: number }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const s = Math.max(0, Math.floor((now - since - pausedMs) / 1000))
  const h = Math.floor(s / 3600)
  const m = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, "0")
  return <span className="text-accent">{`${h ? `${h}:` : ""}${m}:${String(s % 60).padStart(2, "0")}`}</span>
}

function ActiveWorkout({ session }: { session: Session }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const finish = useSessionStore((s) => s.finish)
  const discard = useSessionStore((s) => s.discard)
  const addExercise = useSessionStore((s) => s.addExercise)
  const [finishOpen, setFinishOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [showHint, setShowHint] = useState(() => !localStorage.getItem("fitnoss:set-details-seen"))
  const [pickerOpen, setPickerOpen] = useState(false)
  const view = useSettings((s) => s.workoutView)
  const hasRest = useSessionStore((s) => !!s.rest)
  const setSettings = useSettings((s) => s.set)
  const carousel = useCarousel(session.exercises)
  useWakeLock(true)

  const doneSets = session.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
  const totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0)

  const save = () => {
    const done = finish()
    if (done && done.exercises.length) {
      toast.success(t("workout.saved"), { icon: <CongratsCat /> })
      navigate(`/progress/session/${done.id}`)
    } else {
      toast(t("workout.nothingSaved"))
      navigate("/")
    }
  }

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-col">
            <span className="truncate text-[17px] leading-tight font-semibold">{session.title}</span>
            <span className="text-muted mt-0.5 flex items-center gap-1.5 text-[13px] font-medium tabular-nums">
              <ElapsedTime since={session.startedAt} pausedMs={session.pausedMs} />·
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
              className="h-11"
              onClick={() => doneSets < totalSets ? setFinishOpen(true) : save()}
            >
              <Check /> {t("workout.finish")}
            </Button>
            <Menu>
              <div className="text-muted px-3 pt-1.5 pb-1 text-xs font-medium">{t("workout.view")}</div>
              {(["list", "cards"] as const).map((v) => (
                <MenuItem key={v} onClick={() => setSettings({ workoutView: v })} aria-checked={view === v} role="menuitemradio">
                  {v === "list" ? <LayoutList /> : <GalleryHorizontalEnd />}
                  <span className="flex-1">{t(v === "list" ? "workout.viewList" : "workout.viewCards")}</span>
                  {view === v && <Check className="text-accent" />}
                </MenuItem>
              ))}
              <div className="bg-line mx-2 my-1 h-px" />
              <MenuItem danger onClick={() => setDiscardOpen(true)}>
                <X /> {t("workout.discard")}
              </MenuItem>
            </Menu>
          </>
        }
      >
        {view === "cards" && <CardsPager session={session} carousel={carousel} />}
      </PageHeader>
      {showHint && <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-surface p-3"><p className="flex-1 text-xs text-muted">{t("workout.setDetailsHint")}</p><Button variant="ghost" size="icon" aria-label={t("common.close")} onClick={() => { localStorage.setItem("fitnoss:set-details-seen", "1"); setShowHint(false) }}><X className="size-4" /></Button></div>}
      {view === "cards" ? (
        <CardsView session={session} carousel={carousel} onAdd={() => setPickerOpen(true)} />
      ) : (
        <div className={cn("space-y-2 px-4 pt-3", hasRest ? "pb-24" : "pb-8")}>
          {groups(session.exercises).map((g) => {
            const cards = g.map((i) => {
              const e = session.exercises[i]
              return <ExerciseCard key={`${i}-${e.ex}`} e={e} i={i} last={i === session.exercises.length - 1} restsAfter={!session.exercises[i + 1]?.superset} />
            })
            return g.length > 1 ? <SupersetGroup key={`g${g[0]}`}>{cards}</SupersetGroup> : cards
          })}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="rounded-panel text-muted hover:text-fg hover:bg-surface flex h-14 w-full items-center justify-center gap-2 font-medium shadow-[inset_0_0_0_1.5px_var(--line)] transition-colors"
          >
            <Plus className="size-5" /> {t("workout.addExercise")}
          </button>
        </div>
      )}
      <Sheet open={discardOpen} onOpenChange={setDiscardOpen} title={t("workout.discard")} footer={<div className="flex gap-2"><Button onClick={() => setDiscardOpen(false)}>{t("home.continue")}</Button><Button variant="danger" onClick={() => { discard(); navigate("/") }}>{t("workout.discard")}</Button></div>}><p>{t("workout.confirmDiscard")}</p></Sheet>
      <Sheet open={finishOpen} onOpenChange={setFinishOpen} title={t("workout.finish")} footer={
        <div className="flex flex-wrap gap-2">
          <Button className="flex-1" onClick={() => setFinishOpen(false)}>{t("home.continue")}</Button>
          <Button variant="primary" className="flex-1" onClick={save}>{t("workout.saveAndFinish")}</Button>
        </div>
      }><p>{t(doneSets ? "workout.confirmFinish" : "workout.confirmFinishEmpty", { done: doneSets, total: totalSets })}</p></Sheet>
      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(codes) => {
          const first = session.exercises.length
          codes.forEach(addExercise)
          // In cards view, show the first of the new exercises.
          if (view === "cards") requestAnimationFrame(() => carousel.go(first))
        }}
      />
    </>
  )
}
