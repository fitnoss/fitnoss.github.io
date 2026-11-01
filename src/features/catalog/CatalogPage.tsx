import { useCallback, useDeferredValue, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { SearchX } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { Button } from "@/shared/ui/button"
import { Empty } from "@/shared/ui/panel"
import { useExercises, useFavorites } from "@/entities/exercise/store"
import type { Exercise } from "@/entities/exercise/types"
import { ExerciseList } from "./ExerciseList"
import { FilterBar } from "./FilterBar"
import { EMPTY_FILTERS, applyFilters, getSearchIndex, useUrlFilters } from "./filters"

export function CatalogPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const select = useCallback((ex: Exercise) => navigate(`/ex/${ex.s}`), [navigate])
  const { list, ready, text, en, local } = useExercises()
  const favorites = useFavorites((s) => s.codes)
  const [filters, setFilters] = useUrlFilters()
  const index = getSearchIndex(list, en, local)
  const deferred = useDeferredValue(filters)
  const items = useMemo(() => applyFilters(list, deferred, index, favorites), [list, deferred, index, favorites])

  return (
    <>
      <PageHeader
        title={t("nav.exercises")}
        actions={<span className="text-muted pr-2 text-sm tabular-nums">{t("catalog.count", { count: items.length })}</span>}
      >
        <FilterBar filters={filters} onChange={setFilters} total={items.length} />
      </PageHeader>
      {!ready ? (
        <div className="space-y-1 px-2 pt-1">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex h-[76px] items-center gap-3 px-2">
              <div className="bg-surface size-16 animate-pulse rounded-[10px]" />
              <div className="flex-1 space-y-2">
                <div className="bg-surface h-3.5 w-2/3 animate-pulse rounded" />
                <div className="bg-surface h-3 w-1/3 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Empty icon={<SearchX />} title={t("catalog.empty")}><Button onClick={() => setFilters(EMPTY_FILTERS)}>{t("common.reset")}</Button></Empty>
      ) : (
        <ExerciseList items={items} text={text} onSelect={select} />
      )}
    </>
  )
}
