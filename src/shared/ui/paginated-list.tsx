import { useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./button"
import { Panel } from "./panel"

const PAGE_SIZE = 20

/** Bound rendered rows even when the user's archive contains years of training. */
export function PaginatedList<T>({ items, children }: { items: T[]; children: (item: T) => ReactNode }) {
  const { t } = useTranslation()
  const [requestedPage, setPage] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const page = Math.min(requestedPage, pages - 1)
  const changePage = (next: number) => {
    setPage(next)
    ref.current?.scrollIntoView?.({ block: "start", behavior: "instant" })
  }
  return (
    <div ref={ref} className="scroll-mt-20 space-y-3">
      <Panel className="divide-y overflow-hidden">
        {items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(children)}
      </Panel>
      {pages > 1 && <nav className="flex items-center justify-between gap-2" aria-label={t("common.page", { page: page + 1, total: pages })}>
        <Button size="icon" aria-label={t("common.previousPage")} disabled={page === 0} onClick={() => changePage(page - 1)}><ChevronLeft /></Button>
        <span className="text-muted text-sm tabular-nums" aria-live="polite">{t("common.page", { page: page + 1, total: pages })}</span>
        <Button size="icon" aria-label={t("common.nextPage")} disabled={page === pages - 1} onClick={() => changePage(page + 1)}><ChevronRight /></Button>
      </nav>}
    </div>
  )
}
