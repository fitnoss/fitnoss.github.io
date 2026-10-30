import { useTranslation } from "react-i18next"
import type { SetLog } from "@/entities/session/store"
import { setType } from "@/entities/session/sets"
import { cn } from "@/shared/lib/utils"

export function LoggedSet({ set, timed }: { set: SetLog; timed?: boolean }) {
  const { t } = useTranslation()
  const type = setType(set)
  return (
    <span className={cn("bg-page hairline rounded-lg px-2.5 py-1 text-[13px] font-medium tabular-nums", type === "warmup" && "text-muted")}>
      {type !== "work" && <>{t(`setType.${type}`)} · </>}
      {set.weight ? `${set.weight} × ` : ""}{set.reps ?? "—"}{timed && ` ${t("workout.seconds")}`}
      {set.effort && <> · {set.effort.scale.toUpperCase()} {set.effort.value}</>}
    </span>
  )
}
