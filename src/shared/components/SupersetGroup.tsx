import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link2 } from "lucide-react"

/** Exercises done back-to-back: a label and an accent rail along the cards. */
export function SupersetGroup({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="relative space-y-1.5 pl-3">
      <div aria-hidden className="bg-accent absolute top-[30px] bottom-0 left-0 w-[3px] rounded-full" />
      <div className="text-accent-ink flex h-6 items-center gap-1.5 text-[13px] font-semibold">
        <Link2 className="size-3.5" /> {t("programs.superset")}
      </div>
      {children}
    </div>
  )
}
