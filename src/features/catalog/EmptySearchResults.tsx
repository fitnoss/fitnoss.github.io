import { useTranslation } from "react-i18next"
import { SearchX } from "lucide-react"
import { Empty } from "@/shared/ui/panel"
import { Button } from "@/shared/ui/button"
import { EMPTY_FILTERS, type Filters } from "./filters"

export function EmptySearchResults({ filters, onChange }: { filters: Filters; onChange: (filters: Filters) => void }) {
  const { t } = useTranslation()
  const filtered = filters.places.length > 0 || filters.muscles.length > 0 || filters.equipment.length > 0 || filters.levels.length > 0 || filters.categories.length > 0 || filters.favorites
  return <Empty icon={<SearchX />} title={t("catalog.empty")} className="py-6">
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      {filtered && <Button variant="primary" className="h-auto min-h-11 max-w-full py-2 whitespace-normal break-words" onClick={() => onChange({ ...EMPTY_FILTERS, q: filters.q })}>
        {filters.q.trim() ? t("catalog.searchWithoutFilters", { query: filters.q }) : t("catalog.clearFilters")}
      </Button>}
      {filters.q && <Button onClick={() => onChange({ ...filters, q: "" })}>{t("catalog.clearSearch")}</Button>}
      <Button variant="ghost" onClick={() => onChange(EMPTY_FILTERS)}>{t("catalog.resetAll")}</Button>
    </div>
  </Empty>
}
