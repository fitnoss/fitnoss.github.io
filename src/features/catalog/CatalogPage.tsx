import { useDeferredValue, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { SearchX } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { Logo } from "@/shared/components/Logo"
import { Empty } from "@/shared/ui/panel"
import { useExercises, useFavorites } from "@/entities/exercise/store"
import { ExerciseList } from "./ExerciseList"
import { FilterBar } from "./FilterBar"
import { applyFilters, useSearchIndex, useUrlFilters } from "./filters"

export function CatalogPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { list, ready, text, en, lang } = useExercises()
  const favorites = useFavorites((s) => s.codes)
  const [filters, setFilters] = useUrlFilters()
  const index = useSearchIndex(list, text, en, lang)
  const deferred = useDeferredValue(filters)
  const items = useMemo(() => applyFilters(list, deferred, index, favorites), [list, deferred, index, favorites])

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Logo className="h-12 w-14 md:h-16 md:w-[4.5rem]" />
            fitcraft
          </span>
        }
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
        <Empty icon={<SearchX />} title={t("catalog.empty")} />
      ) : (
        <ExerciseList items={items} text={text} onSelect={(ex) => navigate(`/ex/${ex.s}`)} />
      )}
    </>
  )
}
