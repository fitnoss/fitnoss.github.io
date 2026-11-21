import { useCallback, useDeferredValue, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { PageHeader } from "@/shared/components/PageHeader"
import { useExercises, useFavorites } from "@/entities/exercise/store"
import type { Exercise } from "@/entities/exercise/types"
import { ExerciseList } from "./ExerciseList"
import { FilterBar } from "./FilterBar"
import { applyFilters, getSearchIndex, useUrlFilters } from "./filters"
import { EmptySearchResults } from "./EmptySearchResults"
import { Button } from "@/shared/ui/button"
import { customCatalogExercise } from "@/entities/exercise/custom"
import { CustomExerciseSheet } from "./CustomExerciseSheet"

export function CatalogPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
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
        actions={<Button size="icon" aria-label={t("custom.create")} title={t("custom.create")} onClick={() => setCreateOpen(true)}><Plus /></Button>}
      >
        <FilterBar filters={filters} onChange={setFilters} total={items.length} />
      </PageHeader>
      {!ready && items.length === 0 ? (
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
        <EmptySearchResults filters={filters} onChange={setFilters} />
      ) : (
        <ExerciseList items={items} text={text} onSelect={select} />
      )}
      {createOpen && <CustomExerciseSheet onClose={() => setCreateOpen(false)} onCreate={(exercise) => {
        setCreateOpen(false)
        select(customCatalogExercise(exercise))
      }} />}
    </>
  )
}
