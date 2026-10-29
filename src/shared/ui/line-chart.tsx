import { useState } from "react"

type Point = { label: string; value: number }

const W = 320
const H = 180
const PAD = { top: 14, right: 12, bottom: 22, left: 36 }

function niceTicks(min: number, max: number) {
  if (min === max) return [min]
  const span = max - min
  const step = 10 ** Math.floor(Math.log10(span / 3))
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * step).find((s) => span / s <= 4) ?? step * 10
  const out = []
  for (let v = Math.ceil(min / nice) * nice; v <= max + 1e-9; v += nice) out.push(Math.round(v * 100) / 100)
  return out
}

/** Small dependency-free line chart; tap a point to read its value. */
export function LineChart({ data, unit = "" }: { data: Point[]; unit?: string }) {
  const [active, setActive] = useState(data.length - 1)
  const values = data.map((d) => d.value)
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const pad = (hi - lo) * 0.15 || Math.max(1, hi * 0.1)
  const min = Math.max(0, lo - pad)
  const max = hi + pad
  const x = (i: number) => PAD.left + (data.length === 1 ? 0.5 : i / (data.length - 1)) * (W - PAD.left - PAD.right)
  const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * (H - PAD.top - PAD.bottom)
  const path = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join("")
  const area = `${path}L${x(data.length - 1).toFixed(1)},${H - PAD.bottom}L${x(0).toFixed(1)},${H - PAD.bottom}Z`
  const cur = data[Math.min(active, data.length - 1)]
  const i = data.indexOf(cur)

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between px-1">
        <span className="text-muted text-xs">{cur.label}</span>
        <span className="text-lg font-semibold tabular-nums">
          {cur.value}
          {unit && <span className="text-muted ml-1 text-xs font-normal">{unit}</span>}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none overflow-visible text-[10px]" role="img">
        <defs>
          <linearGradient id="lc-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {niceTicks(min, max).map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={PAD.left - 6} y={y(v)} dy="0.32em" textAnchor="end" fill="var(--muted)" className="tabular-nums">
              {v}
            </text>
          </g>
        ))}
        <text x={x(0)} y={H - 6} textAnchor={data.length === 1 ? "middle" : "start"} fill="var(--muted)">
          {data[0].label}
        </text>
        {data.length > 1 && (
          <text x={x(data.length - 1)} y={H - 6} textAnchor="end" fill="var(--muted)">
            {data[data.length - 1].label}
          </text>
        )}
        <path d={area} fill="url(#lc-fill)" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
        <line x1={x(i)} x2={x(i)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--muted)" strokeDasharray="2 3" />
        {data.map((d, k) => (
          <circle key={k} cx={x(k)} cy={y(d.value)} r={k === i ? 4.5 : 2.5} fill={k === i ? "var(--accent)" : "var(--page)"} stroke="var(--accent)" strokeWidth="2" />
        ))}
        {/* Wide invisible hit areas, one per point. */}
        {data.map((_, k) => {
          const half = data.length === 1 ? W : (W - PAD.left - PAD.right) / (data.length - 1) / 2
          return (
            <rect
              key={k}
              x={x(k) - half}
              y={0}
              width={half * 2}
              height={H}
              fill="transparent"
              onPointerEnter={() => setActive(k)}
              onPointerDown={() => setActive(k)}
            />
          )
        })}
      </svg>
    </div>
  )
}
