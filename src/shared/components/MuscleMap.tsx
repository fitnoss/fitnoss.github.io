import { memo } from "react"
import { useTranslation } from "react-i18next"
import { key } from "@/entities/exercise/types"
import { front, back } from "./muscle-map-data"

export function muscleColor(sets: number) {
  return sets === 0
    ? "color-mix(in oklab, var(--fg) 20%, var(--surface))"
    : `color-mix(in oklab, var(--accent) ${sets < 5 ? 40 : sets < 10 ? 70 : 100}%, var(--surface))`
}

export const MuscleMap = memo(function MuscleMap({ colorFor, selected, onSelect }: {
  colorFor: (muscle: string) => string
  selected?: string
  onSelect?: (muscle: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-2 gap-4">
      {[front, back].map((regions, side) => (
        <figure key={side} className="min-w-0">
          <svg viewBox={side ? "-115 -15 1230 2340" : "-115 -15 1230 2140"} className="mx-auto h-64 w-full max-w-44" aria-hidden="true">
            {regions.map(({ muscle, points }, index) => (
              <g key={index}
                className={muscle && onSelect ? "cursor-pointer" : undefined}
                onClick={muscle && onSelect ? () => onSelect(muscle) : undefined}>
                {points.map((polygon) => (
                  <polygon key={polygon} points={polygon}
                    className="transition-[fill] duration-200"
                    fill={muscle ? colorFor(muscle) : muscleColor(0)}
                    stroke="var(--page)"
                    strokeWidth={3} strokeLinejoin="round" />
                ))}
                {muscle && <title>{t(`muscle.${key(muscle)}`)}</title>}
              </g>
            ))}
            {/* Draw selection last so its outline stays visible without replacing the volume color. */}
            {selected && (
              <g data-selection={selected} fill="none" stroke="#3b82f6" strokeWidth={1.5}
                strokeLinejoin="round" pointerEvents="none"
                style={{ filter: "drop-shadow(0 0 2px rgb(59 130 246 / 0.6))" }}>
                {regions.filter(({ muscle }) => muscle === selected).flatMap(({ points }) => points).map((polygon) => (
                  <polygon key={polygon} points={polygon} vectorEffect="non-scaling-stroke" />
                ))}
              </g>
            )}
          </svg>
          <figcaption className="text-muted text-center text-xs">{t(side ? "muscleMap.back" : "muscleMap.front")}</figcaption>
        </figure>
      ))}
    </div>
  )
})
