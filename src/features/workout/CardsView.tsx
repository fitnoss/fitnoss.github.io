import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronRight, Plus } from "lucide-react"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { scroller } from "@/shared/lib/scroller"
import { cn } from "@/shared/lib/utils"
import { useExercises } from "@/entities/exercise/store"
import { groups, itemLabels } from "@/entities/program/types"
import { useSessionStore, type Session, type SessionExercise } from "@/entities/session/store"
import { ExerciseCard } from "./ExerciseCard"

export type Carousel = ReturnType<typeof useCarousel>

const pending = (e: SessionExercise) => e.sets.some((s) => !s.done)

/** The slide in view of a horizontal scroll-snap strip, and a way to move to another one. */
export function useCarousel(exercises: SessionExercise[]) {
  const ref = useRef<HTMLDivElement>(null)
  // Open on the first exercise that still has sets to do.
  const [index, setIndex] = useState(() => Math.max(0, exercises.findIndex(pending)))

  const go = useCallback((i: number, smooth = true) => {
    const el = ref.current
    if (!el) return
    const left = i * el.clientWidth
    const from = el.scrollLeft
    el.scrollTo({ left, behavior: smooth ? "smooth" : "instant" })
    if (!smooth) return
    const page = scroller()
    if (page.scrollTop > 0) page.scrollTo({ top: 0, behavior: "smooth" })
    // A smooth scroll in a snap container can get dropped; if it never started, jump instead.
    setTimeout(() => {
      if (Math.abs(el.scrollLeft - from) < 2 && Math.abs(el.scrollLeft - left) >= 2) el.scrollTo({ left, behavior: "instant" })
    }, 700)
  }, [])

  const onScroll = () => {
    const el = ref.current
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  return { ref, index: Math.min(index, Math.max(0, exercises.length - 1)), go, onScroll }
}

/** One segment per exercise under the header: where you are, what's done; tap to jump. */
export function CardsPager({ session, carousel }: { session: Session; carousel: Carousel }) {
  const { byCode, text } = useExercises()
  return (
    <div className="flex gap-1 px-4 pb-1">
      {session.exercises.map((e, i) => {
        const ex = byCode.get(e.ex)
        return (
          <button
            key={`${i}-${e.ex}`}
            type="button"
            onClick={() => carousel.go(i)}
            aria-label={ex ? text(ex).name : String(i + 1)}
            aria-current={i === carousel.index}
            className="flex min-h-11 flex-1 items-center"
          >
            <span
              className={cn(
                "w-full rounded-full transition-all duration-300",
                i === carousel.index ? "bg-fg h-1.5" : !pending(e) ? "bg-accent/45 h-1" : "bg-surface-hover h-1",
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

/**
 * Cards view of a workout: one exercise per screen, swipe for the others. Checking off a set
 * moves on by itself: round a superset, then to the next exercise once this one is done.
 */
export function CardsView({ session, carousel, onAdd }: { session: Session; carousel: Carousel; onAdd: () => void }) {
  const { t } = useTranslation()
  const { byCode, text } = useExercises()
  const exercises = session.exercises
  const labels = itemLabels(exercises)
  const grouped = groups(exercises)

  useLayoutEffect(() => {
    carousel.go(carousel.index, false)
    // Only when the view opens; afterwards the strip's own scroll position is the truth.
  }, [])

  const afterSet = useCallback((i: number) =>
    setTimeout(() => {
      const list = useSessionStore.getState().active?.exercises
      if (!list) return
      const g = groups(list).find((x) => x.includes(i))!
      if (g.length > 1) {
        const k = g.indexOf(i)
        for (let step = 1; step <= g.length; step++) {
          const n = g[(k + step) % g.length]
          if (!pending(list[n])) continue
          if (n !== i) carousel.go(n)
          return
        }
      } else if (pending(list[i])) return
      const next = list.findIndex((e, n) => n > g.at(-1)! && pending(e))
      if (next >= 0) carousel.go(next)
    }, 450), [carousel.go])

  const addButton = (
    <button
      type="button"
      onClick={onAdd}
      className="rounded-panel text-muted hover:text-fg hover:bg-surface flex h-14 w-full items-center justify-center gap-2 font-medium shadow-[inset_0_0_0_1.5px_var(--line)] transition-colors"
    >
      <Plus className="size-5" /> {t("workout.addExercise")}
    </button>
  )

  if (!exercises.length) return <div className="px-4 pt-3 pb-8">{addButton}</div>

  return (
    <div
      ref={carousel.ref}
      onScroll={carousel.onScroll}
      className="no-scrollbar flex snap-x snap-mandatory items-start overflow-x-auto overscroll-x-contain pt-2 pb-8"
    >
      {exercises.map((e, i) => {
        const next = exercises[i + 1]
        const nextEx = next && byCode.get(next.ex)
        const inSuperset = grouped.some((g) => g.length > 1 && g.includes(i))
        return (
          <div key={`${i}-${e.ex}`} className="w-full shrink-0 snap-start snap-always space-y-2 px-4">
            <ExerciseCard
              big
              e={e}
              i={i}
              last={i === exercises.length - 1}
              restsAfter={!next?.superset}
              supersetLabel={inSuperset ? labels[i] : undefined}
              onSetDone={afterSet}
            />
            {next ? (
              <button
                type="button"
                onClick={() => carousel.go(i + 1)}
                className="rounded-panel hover:bg-surface flex w-full items-center gap-3 p-2.5 text-left shadow-[inset_0_0_0_1.5px_var(--line)] transition-colors"
              >
                {nextEx ? (
                  <ExerciseImage ex={nextEx} alt="" animate={false} className="hairline size-11 shrink-0 rounded-[9px]" />
                ) : (
                  <div className="bg-surface size-11 shrink-0 rounded-[9px]" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-muted text-xs font-medium">{t(next.superset ? "workout.nextInSuperset" : "workout.next")}</div>
                  <div className="truncate text-[15px] font-medium">{nextEx ? text(nextEx).name : t("exercise.unknown")}</div>
                </div>
                <ChevronRight className="text-muted size-5 shrink-0" />
              </button>
            ) : (
              addButton
            )}
          </div>
        )
      })}
    </div>
  )
}
