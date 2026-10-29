import { useEffect, useState } from "react"

type Matrix = { size: number; dark: (row: number, col: number) => boolean }

/** Quiet zone around the code, in modules. */
const MARGIN = 2
/** The 7×7 finder patterns sit in three corners; they're drawn as rounded shapes, not modules. */
const FINDER = 7

/**
 * QR code drawn as SVG: square data modules, rounded finder patterns and the cat on a white tile in
 * the middle. Level Q (25% recovery) leaves plenty of room for the cat, which covers about 5% of the code.
 * Dark modules on white scan reliably in both themes.
 */
export function QrCode({ value, className }: { value: string; className?: string }) {
  const [matrix, setMatrix] = useState<Matrix>()

  useEffect(() => {
    let alive = true
    import("qrcode").then(({ default: QRCode }) => {
      const { modules } = QRCode.create(value, { errorCorrectionLevel: "Q" })
      if (alive) setMatrix({ size: modules.size, dark: (r, c) => !!modules.get(r, c) })
    })
    return () => {
      alive = false
    }
  }, [value])

  if (!matrix) return null
  const { size, dark } = matrix
  const finders = [
    [0, 0],
    [0, size - FINDER],
    [size - FINDER, 0],
  ]
  const inFinder = (r: number, c: number) => finders.some(([fr, fc]) => r >= fr && r < fr + FINDER && c >= fc && c < fc + FINDER)

  let path = ""
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) if (dark(r, c) && !inFinder(r, c)) path += `M${c} ${r}h1v1h-1z`
  }

  const box = size + MARGIN * 2
  return (
    <div className={className} style={{ position: "relative" }}>
      <svg viewBox={`${-MARGIN} ${-MARGIN} ${box} ${box}`} role="img" aria-label="QR" className="block size-full" shapeRendering="crispEdges">
        <rect x={-MARGIN} y={-MARGIN} width={box} height={box} fill="#fff" />
        <path d={path} fill="#000" />
        {finders.map(([r, c]) => (
          <g key={`${r}-${c}`} fill="none" shapeRendering="geometricPrecision">
            <rect x={c + 0.5} y={r + 0.5} width={6} height={6} rx={1.9} stroke="#000" strokeWidth={1} />
            <rect x={c + 2} y={r + 2} width={3} height={3} rx={1} fill="#000" />
          </g>
        ))}
      </svg>
      <img
        src={`${import.meta.env.BASE_URL}favicon.svg`}
        alt=""
        className="absolute top-1/2 left-1/2 size-[22%] -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  )
}
