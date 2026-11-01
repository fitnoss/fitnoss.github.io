import { useTranslation } from "react-i18next"
import type { SetLog } from "@/entities/session/store"
import { setType } from "@/entities/session/sets"
import { cn } from "@/shared/lib/utils"

export function LoggedSet({ set, timed, bodyweight }: { set: SetLog; timed?: boolean; bodyweight?: boolean }) {
  const { t } = useTranslation()
  const type = setType(set)
  return (
    <span className={cn("bg-page hairline rounded-lg px-2.5 py-1 text-[13px] font-medium tabular-nums", type === "warmup" && "text-muted")}>
      {type !== "work" && <>{t(`setType.${type}`)} · </>}
      {set.weight !== undefined && <>{bodyweight ? "+" : ""}{t("units.kg", { n: set.weight })} × </>}{set.reps ?? "—"} {t(timed ? "workout.seconds" : "workout.reps")}
      {set.effort && <> · {set.effort.scale.toUpperCase()} {set.effort.value}</>}
    </span>
  )
}
