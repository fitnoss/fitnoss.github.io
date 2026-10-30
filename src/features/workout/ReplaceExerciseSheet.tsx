import { useDeferredValue, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useExercises } from "@/entities/exercise/store"
import { EQUIPMENT, exerciseEquipment, key, type Exercise } from "@/entities/exercise/types"
import { replacementCandidates } from "@/entities/session/replacement"
import { ExerciseList } from "@/features/catalog/ExerciseList"
import { applyFilters, EMPTY_FILTERS, useSearchIndex } from "@/features/catalog/filters"
import { Chip } from "@/shared/ui/chip"
import { Input } from "@/shared/ui/field"
import { Sheet } from "@/shared/ui/sheet"

export function ReplaceExerciseSheet({ source, onClose, onPick }: {
  source: Exercise
  onClose: () => void
  onPick: (code: number) => void
}) {
  const { t } = useTranslation()
  const { list, text, en, lang } = useExercises()
  const [equipment, setEquipment] = useState(exerciseEquipment(source))
  const [query, setQuery] = useState("")
  const q = useDeferredValue(query)
  const index = useSearchIndex(list, text, en, lang)
  const items = useMemo(() => applyFilters(
    replacementCandidates(list, source, equipment), { ...EMPTY_FILTERS, q }, index, [],
  ), [list, source, equipment, q, index])
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null)
  const scrollRef = useMemo(() => ({ current: scrollEl }), [scrollEl])

  return (
    <Sheet
      open
      onOpenChange={(open) => { if (!open) onClose() }}
      title={t("workout.replaceExercise")}
      description={t("workout.replaceHint")}
      className="h-[94dvh] sm:h-[85dvh] sm:max-w-xl"
      bodyClassName="flex flex-col px-0 pb-0"
    >
      <div className="space-y-3 px-4 pb-3">
        <p className="text-muted text-sm">{text(source).name} · {source.pm.map((m) => t(`muscle.${key(m)}`)).join(", ")}</p>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{t("workout.availableEquipment")}</legend>
          <div className="flex flex-wrap gap-1.5">
            {EQUIPMENT.map((eq) => (
              <Chip key={eq} active={equipment.includes(eq)} onClick={() => setEquipment((current) =>
                current.includes(eq) ? current.filter((e) => e !== eq) : [...current, eq],
              )}>{t(`equipment.${eq}`)}</Chip>
            ))}
          </div>
        </fieldset>
        <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={t("catalog.search")} aria-label={t("catalog.search")} enterKeyHint="search" />
        <p className="text-muted text-xs" role="status">{t("catalog.count", { count: items.length })}</p>
      </div>
      <div ref={setScrollEl} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2">
        {!items.length && <p className="text-muted px-4 py-8 text-center text-sm">{t("workout.noReplacement")}</p>}
        {scrollEl && <ExerciseList items={items} text={text} scrollRef={scrollRef} onSelect={(ex) => onPick(ex.c)} />}
      </div>
    </Sheet>
  )
}
