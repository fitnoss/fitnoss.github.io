import { useTranslation } from "react-i18next"
import { key } from "@/entities/exercise/types"
import type { MuscleVolume } from "@/entities/session/muscles"

import { front, back } from "./muscle-map-data"

export function muscleColor(sets: number) {
  return sets === 0 ? "var(--surface-press)" : `color-mix(in oklab, var(--accent) ${sets < 5 ? 30 : sets < 10 ? 60 : 100}%, var(--surface))`
}

export function MuscleMap({ volume, selected, onSelect }: {
  volume: MuscleVolume
  selected: string
  onSelect: (muscle: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-2 gap-4">
      {[front, back].map((regions, side) => (
        <figure key={side} className="min-w-0">
          <svg viewBox={side ? "-15 -15 1030 2230" : "-15 -15 1030 2010"} className="mx-auto h-64 w-full max-w-44" aria-hidden="true">
            {regions.map(({ muscle, points }, index) => (
              <g key={index} className={muscle ? "cursor-pointer" : undefined} onClick={muscle ? () => onSelect(muscle) : undefined}>
                {points.map((polygon) => (
                  <polygon key={polygon} points={polygon}
                    fill={muscleColor(muscle ? volume[muscle]?.primary ?? 0 : 0)}
                    stroke={selected === muscle ? "var(--fg)" : "var(--page)"}
                    strokeWidth={selected === muscle ? 9 : 3} strokeLinejoin="round" />
                ))}
                {muscle && <title>{t(`muscle.${key(muscle)}`)}</title>}
              </g>
            ))}
          </svg>
          <figcaption className="text-muted text-center text-xs">{t(side ? "muscleMap.back" : "muscleMap.front")}</figcaption>
        </figure>
      ))}
    </div>
  )
}
