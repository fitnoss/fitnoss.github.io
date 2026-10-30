import { useDeferredValue, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Chip } from "@/shared/ui/chip"
import { Empty } from "@/shared/ui/panel"
import { Button } from "@/shared/ui/button"
import { Sheet } from "@/shared/ui/sheet"
import { useExercises, useFavorites } from "@/entities/exercise/store"
import { ExerciseList } from "@/features/catalog/ExerciseList"
import { FilterBar } from "@/features/catalog/FilterBar"
import { EMPTY_FILTERS, applyFilters, useSearchIndex, type Filters } from "@/features/catalog/filters"
import type { Exercise } from "@/entities/exercise/types"
import { ExerciseTechniqueSheet } from "@/features/catalog/ExerciseTechniqueSheet"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (codes: number[]) => void
}

/** Full-height catalog in a sheet with multi-select. */
export function ExercisePicker({ open, onOpenChange, onPick }: Props) {
  const { t } = useTranslation()
  const { list, text, en, lang } = useExercises()
  const favorites = useFavorites((s) => s.codes)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [selected, setSelected] = useState<number[]>([])
  const [showSelected, setShowSelected] = useState(false)
  const [preview, setPreview] = useState<Exercise | null>(null)
  const toggle = (code: number) => setSelected((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code])
  const index = useSearchIndex(list, text, en, lang)
  const deferred = useDeferredValue(filters)
  const items = useMemo(() => applyFilters(list, deferred, index, favorites), [list, deferred, index, favorites])
  // State, not a plain ref: the list must re-render once the scroll container exists.
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null)
  const scrollRef = useMemo(() => ({ current: scrollEl }), [scrollEl])

  const close = (pick: boolean) => {
    if (pick && selected.length) onPick(selected)
    setSelected([])
    setShowSelected(false)
    setPreview(null)
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => (o ? onOpenChange(true) : close(false))}
      title={t("picker.title")}
      className="h-[94dvh] sm:h-[85dvh] sm:max-w-xl"
      bodyClassName="flex flex-col px-0 pb-0"
      footer={
        <Button variant="primary" size="lg" className="w-full" disabled={!selected.length} onClick={() => close(true)}>
          {selected.length ? t("picker.add", { count: selected.length }) : t("picker.choose")}
        </Button>
      }
    >
      <FilterBar filters={filters} onChange={setFilters} total={items.length} />
      {selected.length > 0 && <div className="space-y-2 px-4 pb-2">
        <Button size="sm" onClick={() => setShowSelected(!showSelected)} aria-expanded={showSelected}>{t("picker.selected", { count: selected.length })}</Button>
        {showSelected && <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">{selected.map((code) => <Chip key={code} onClick={() => setSelected((s) => s.filter((c) => c !== code))}>{text(list.find((ex) => ex.c === code)).name} ×</Chip>)}</div>}
      </div>}
      {items.length === 0 && <Empty title={t("catalog.empty")}><Button onClick={() => setFilters(EMPTY_FILTERS)}>{t("common.reset")}</Button></Empty>}
      <div ref={setScrollEl} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2">
        {scrollEl && (
          <ExerciseList
            items={items}
            text={text}
            scrollRef={scrollRef}
            isSelected={(ex) => selected.includes(ex.c)}
            onSelect={(ex) => toggle(ex.c)}
            onPreview={setPreview}
          />
        )}
      </div>
      {preview && <ExerciseTechniqueSheet exercise={preview} onClose={() => setPreview(null)}
        selected={selected.includes(preview.c)} onToggle={() => toggle(preview.c)} />}
    </Sheet>
  )
}
