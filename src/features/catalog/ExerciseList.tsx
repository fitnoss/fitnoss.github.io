import { memo, useCallback, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { useTranslation } from "react-i18next"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Check, Info } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { scroller } from "@/shared/lib/scroller"
import { cn } from "@/shared/lib/utils"
import { key, type Exercise, type ExerciseName } from "@/entities/exercise/types"

const ROW = 80

type RowProps = {
  ex: Exercise
  name: string
  selected?: boolean
  onSelect: (ex: Exercise) => void
  trailing?: ReactNode
  onPreview?: (ex: Exercise) => void
}

export const ExerciseRow = memo(function ExerciseRow({ ex, name, selected, onSelect, trailing, onPreview }: RowProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center" style={{ height: ROW - 4 }}>
    <button
      type="button"
      onClick={() => onSelect(ex)}
      aria-pressed={selected}
      className={cn(
        "rounded-control hover:bg-surface active:bg-surface-hover flex h-full min-w-0 flex-1 items-center gap-3 px-2 text-left transition-colors",
        selected && "bg-surface",
      )}
    >
      <div className="relative shrink-0">
        <ExerciseImage ex={ex} alt="" className="hairline size-16 rounded-[10px]" />
        {selected && (
          <div className="bg-accent/85 text-accent-fg absolute inset-0 flex items-center justify-center rounded-[10px]">
            <Check className="size-7" strokeWidth={3} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-[15px] leading-snug font-medium">{name}</div>
        <div className="text-muted mt-0.5 truncate text-[13px]">
          {ex.pm.map((m) => t(`muscle.${key(m)}`)).join(", ")} · {t(`equipment.${ex.eq}`)}
        </div>
      </div>
      {trailing}
    </button>
    {onPreview && <Button variant="ghost" size="icon" onClick={() => onPreview(ex)}
      aria-label={`${t("exercise.technique")}: ${name}`}><Info className="size-5" /></Button>}
    </div>
  )
})

type ListProps = {
  items: Exercise[]
  text: (ex: Exercise) => ExerciseName
  onSelect: (ex: Exercise) => void
  isSelected?: (ex: Exercise) => boolean
  onPreview?: (ex: Exercise) => void
  /** Scroll container; omitted means the page scroller. */
  scrollRef?: RefObject<HTMLElement | null>
  /** Content that scrolls together with the element list. */
  header?: ReactNode
}

export function ExerciseList(props: ListProps) {
  return props.scrollRef ? <ElementList {...props} scrollRef={props.scrollRef} /> : <PageList {...props} />
}

/** The list further down the page: rows are offset by everything above it in the page scroller. */
function PageList({ items, text, onSelect, isSelected, onPreview }: ListProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(1)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => setColumns(element.clientWidth >= 800 ? 2 : 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const getItemKey = useCallback((index: number) => items[index * columns].c, [items, columns])
  const v = useVirtualizer({
    count: Math.ceil(items.length / columns),
    getItemKey,
    estimateSize: () => ROW,
    overscan: 6,
    getScrollElement: scroller,
    scrollMargin: ref.current?.offsetTop ?? 0,
  })
  return (
    <div ref={ref} className="relative" style={{ height: v.getTotalSize() }}>
      {v.getVirtualItems().map((row) => {
        const exercises = items.slice(row.index * columns, (row.index + 1) * columns)
        return (
          <div
            key={exercises[0].c}
            className="absolute inset-x-2 grid gap-x-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, transform: `translateY(${row.start - v.options.scrollMargin}px)` }}
          >
            {exercises.map((ex) => <ExerciseRow key={ex.c} ex={ex} name={text(ex).name} selected={isSelected?.(ex)} onSelect={onSelect} onPreview={onPreview} />)}
          </div>
        )
      })}
    </div>
  )
}

function ElementList({ items, text, onSelect, isSelected, scrollRef, onPreview, header }: ListProps & { scrollRef: RefObject<HTMLElement | null> }) {
  const getItemKey = useCallback((index: number) => items[index].c, [items])
  const headerRef = useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  useLayoutEffect(() => {
    const element = headerRef.current
    if (!element) return
    const measure = () => setScrollMargin(element.getBoundingClientRect().height)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const v = useVirtualizer({
    count: items.length,
    getItemKey,
    estimateSize: () => ROW,
    overscan: 6,
    getScrollElement: () => scrollRef.current,
    scrollMargin,
  })
  return (
    <>
      <div ref={headerRef}>{header}</div>
      <div className="relative" style={{ height: v.getTotalSize() }}>
        {v.getVirtualItems().map((row) => {
          const ex = items[row.index]
          return (
            <div key={ex.c} className="absolute inset-x-0" style={{ transform: `translateY(${row.start - scrollMargin}px)` }}>
              <ExerciseRow ex={ex} name={text(ex).name} selected={isSelected?.(ex)} onSelect={onSelect} onPreview={onPreview} />
            </div>
          )
        })}
      </div>
    </>
  )
}
