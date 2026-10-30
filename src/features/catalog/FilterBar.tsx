import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Search, SlidersHorizontal, Star, X } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Chip } from "@/shared/ui/chip"
import { Sheet } from "@/shared/ui/sheet"
import { cn } from "@/shared/lib/utils"
import { CATEGORIES, EQUIPMENT, LEVELS, MUSCLES, PLACES, key } from "@/entities/exercise/types"
import { EMPTY_FILTERS, countAdvanced, type Filters } from "./filters"

function toggle<T>(list: T[], v: T) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

type Props = { filters: Filters; onChange: (f: Filters) => void; total: number; className?: string }

export function FilterBar({ filters, onChange, total, className }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const advanced = countAdvanced(filters)

  return (
    <div className={cn("space-y-2.5 pb-3", className)}>
      <div className="flex gap-2 px-4">
        <label className="bg-surface hairline rounded-control focus-within:bg-page relative flex h-11 flex-1 items-center focus-within:shadow-[inset_0_0_0_1.5px_var(--fg)]">
          <Search className="text-muted pointer-events-none absolute left-3.5 size-[18px]" />
          <input
            aria-label={t("catalog.search")}
            value={filters.q}
            onChange={(e) => onChange({ ...filters, q: e.target.value })}
            placeholder={t("catalog.search")}
            className="size-full min-w-0 bg-transparent pr-10 pl-10 text-base outline-none md:text-[15px]"
            type="search"
            enterKeyHint="search"
          />
          {filters.q && (
            <button
              type="button"
              className="text-muted hover:text-fg absolute right-0 flex size-11 items-center justify-center rounded-lg"
              onClick={() => onChange({ ...filters, q: "" })}
              aria-label={t("common.clear")}
            >
              <X className="size-4" />
            </button>
          )}
        </label>
        <Button
          variant={advanced ? "primary" : "default"}
          className="relative h-11 gap-1.5 px-3.5"
          onClick={() => setOpen(true)}
          aria-label={t("catalog.filters")}
        >
          <SlidersHorizontal />
          {advanced > 0 && <span className="text-sm tabular-nums">{advanced}</span>}
        </Button>
      </div>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4">
        <Chip active={filters.favorites} onClick={() => onChange({ ...filters, favorites: !filters.favorites })}><Star className="size-4" />{t("catalog.favorites")}</Chip>
        {PLACES.map((p) => (
          <Chip key={p} active={filters.places.includes(p)} onClick={() => onChange({ ...filters, places: toggle(filters.places, p) })}>
            {t(`place.${p}`)}
          </Chip>
        ))}
      </div>

      {advanced > 0 && <div className="flex flex-wrap gap-1.5 px-4">
        {(["muscles", "equipment", "levels", "categories"] as const).flatMap((group) => filters[group].map((value) => (
          <Chip key={group + value} active onClick={() => onChange({ ...filters, [group]: filters[group].filter((x) => x !== value) })} aria-label={t("catalog.removeFilter", { name: t((group === "muscles" ? "muscle." : group === "levels" ? "level." : group === "categories" ? "category." : "equipment.") + key(value)) })}>
            {t((group === "muscles" ? "muscle." : group === "levels" ? "level." : group === "categories" ? "category." : "equipment.") + key(value))}<X className="size-3" />
          </Chip>
        )))}
        <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>{t("common.reset")}</Button>
      </div>}
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={t("catalog.filters")}
        actions={
          advanced > 0 && (
            <Button variant="ghost" size="sm" className="mt-1" onClick={() => onChange({ ...EMPTY_FILTERS, q: filters.q, places: filters.places })}>
              {t("common.reset")}
            </Button>
          )
        }
        footer={
          <Button variant="primary" size="lg" className="w-full" onClick={() => setOpen(false)}>
            {t("catalog.show", { count: total })}
          </Button>
        }
        bodyClassName="space-y-5"
      >
        <Group title={t("catalog.muscle")}>
          {MUSCLES.map((m) => (
            <Chip key={m} active={filters.muscles.includes(m)} onClick={() => onChange({ ...filters, muscles: toggle(filters.muscles, m) })}>
              {t(`muscle.${key(m)}`)}
            </Chip>
          ))}
        </Group>
        <Group title={t("catalog.equipment")}>
          {EQUIPMENT.map((e) => (
            <Chip key={e} active={filters.equipment.includes(e)} onClick={() => onChange({ ...filters, equipment: toggle(filters.equipment, e) })}>
              {t(`equipment.${e}`)}
            </Chip>
          ))}
        </Group>
        <Group title={t("catalog.level")}>
          {LEVELS.map((l) => (
            <Chip key={l} active={filters.levels.includes(l)} onClick={() => onChange({ ...filters, levels: toggle(filters.levels, l) })}>
              {t(`level.${l}`)}
            </Chip>
          ))}
        </Group>
        <Group title={t("catalog.category")}>
          {CATEGORIES.map((c) => (
            <Chip key={c} active={filters.categories.includes(c)} onClick={() => onChange({ ...filters, categories: toggle(filters.categories, c) })}>
              {t(`category.${key(c)}`)}
            </Chip>
          ))}
        </Group>
        <Group title={t("catalog.other")}>
          <Chip active={filters.favorites} onClick={() => onChange({ ...filters, favorites: !filters.favorites })}>
            <Star className={cn("size-4", filters.favorites && "fill-current")} /> {t("catalog.favorites")}
          </Chip>
        </Group>
      </Sheet>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </section>
  )
}
