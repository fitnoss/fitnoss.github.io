import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Check, Pipette } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { contrastText, hexToHsv, hsvToHex, parseHex, type Hsv } from "@/shared/lib/color"
import { useSettings } from "@/shared/storage/settings"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/field"
import { Panel } from "@/shared/ui/panel"
import { Sheet } from "@/shared/ui/sheet"

const PRESETS = ["#ff5a1f", "#f43f5e", "#ec4899", "#a855f7", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#84cc16", "#eab308"]

const HUE_STOPS = "#f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00"

const clamp = (n: number) => Math.min(1, Math.max(0, n))

function Swatch({
  selected,
  label,
  style,
  className,
  onClick,
  children,
}: {
  selected: boolean
  label: string
  style?: CSSProperties
  className?: string
  onClick: () => void
  children?: ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onClick}
      style={style}
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95",
        "shadow-[inset_0_0_0_1px_var(--stroke)]",
        selected && "ring-fg ring-offset-surface ring-2 ring-offset-2",
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Accent setting: black / white, a row of presets, or any color from the custom picker. */
export function AccentPicker() {
  const { t } = useTranslation()
  const accent = useSettings((s) => s.accent)
  const setAccent = useSettings((s) => s.setAccent)
  const [open, setOpen] = useState(false)
  const custom = accent !== null && !PRESETS.includes(accent)

  return (
    <Panel className="p-3">
      <div role="radiogroup" aria-label={t("more.accent")} className="flex flex-wrap gap-2.5">
        <Swatch
          selected={accent === null}
          label={t("more.accentMono")}
          onClick={() => setAccent(null)}
          style={{ background: "linear-gradient(135deg, #fff 50%, #000 50%)" }}
        />
        {PRESETS.map((c) => (
          <Swatch key={c} selected={accent === c} label={c} onClick={() => setAccent(c)} style={{ background: c }}>
            {accent === c && <Check className="size-4" strokeWidth={3} style={{ color: contrastText(c) }} />}
          </Swatch>
        ))}
        <Swatch
          selected={custom}
          label={t("more.accentCustom")}
          onClick={() => setOpen(true)}
          style={{ background: custom ? accent : `conic-gradient(from 90deg, ${HUE_STOPS})` }}
        >
          <Pipette className="size-4 drop-shadow" style={{ color: custom ? contrastText(accent) : "#fff" }} strokeWidth={2.5} />
        </Swatch>
      </div>

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={t("more.accentCustom")}
        footer={
          <Button variant="accent" className="w-full" onClick={() => setOpen(false)}>
            {t("more.accentDone")}
          </Button>
        }
      >
        <ColorPicker value={accent ?? PRESETS[0]} onChange={setAccent} />
      </Sheet>
    </Panel>
  )
}

/** Drag on a surface; reports the pointer position as 0–1 fractions of its box. */
function useDrag(onMove: (x: number, y: number) => void) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    if (!r.width || !r.height) return
    onMove(clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height))
  }
  return {
    ref,
    onPointerDown: (e: PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      move(e)
    },
    onPointerMove: (e: PointerEvent) => e.currentTarget.hasPointerCapture(e.pointerId) && move(e),
  }
}

/** Arrow keys nudge by 1%, with Shift by 10%. */
function nudge(e: KeyboardEvent, axis: "x" | "y" | "both", apply: (dx: number, dy: number) => void) {
  const step = e.shiftKey ? 0.1 : 0.01
  const keys: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: axis === "x" ? [step, 0] : [0, -step],
    ArrowDown: axis === "x" ? [-step, 0] : [0, step],
  }
  const d = keys[e.key]
  if (!d) return
  e.preventDefault()
  apply(d[0], d[1])
}

function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const { t } = useTranslation()
  // HSV lives here, not derived from the hex: at zero saturation the hex forgets the hue.
  const [hsv, setHsvState] = useState<Hsv>(() => hexToHsv(value))
  const [draft, setDraft] = useState<string | null>(null)
  const hex = hsvToHex(hsv)
  const setHsv = (next: Hsv) => {
    setHsvState(next)
    setDraft(null)
    onChange(hsvToHex(next))
  }

  const area = useDrag((x, y) => setHsv({ ...hsv, s: x, v: 1 - y }))
  const hue = useDrag((x) => setHsv({ ...hsv, h: x * 360 }))
  const pure = hsvToHex({ h: hsv.h, s: 1, v: 1 })

  return (
    <div className="space-y-4 select-none">
      <div
        {...area}
        role="slider"
        tabIndex={0}
        aria-label={t("more.accentShade")}
        aria-valuetext={hex}
        onKeyDown={(e) => nudge(e, "both", (dx, dy) => setHsv({ ...hsv, s: clamp(hsv.s + dx), v: clamp(hsv.v - dy) }))}
        className="relative h-52 cursor-crosshair touch-none rounded-[14px]"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${pure})` }}
      >
        <div
          className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_1px_4px_rgb(0_0_0/0.4)]"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hex }}
        />
      </div>

      <div
        {...hue}
        role="slider"
        tabIndex={0}
        aria-label={t("more.accentHue")}
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
        onKeyDown={(e) => nudge(e, "x", (dx) => setHsv({ ...hsv, h: (hsv.h + dx * 360 + 360) % 360 }))}
        className="relative mx-3 h-3.5 cursor-pointer touch-none rounded-full"
        style={{ background: `linear-gradient(to right, ${HUE_STOPS})` }}
      >
        <div
          className="pointer-events-none absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_1px_4px_rgb(0_0_0/0.4)]"
          style={{ left: `${(hsv.h / 360) * 100}%`, background: pure }}
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="hairline size-10 shrink-0 rounded-full" style={{ background: hex }} />
        <Input
          value={draft ?? hex}
          spellCheck={false}
          maxLength={7}
          aria-label="HEX"
          className="font-mono uppercase"
          onChange={(e) => {
            setDraft(e.target.value)
            const parsed = parseHex(e.target.value)
            if (parsed) {
              setHsvState(hexToHsv(parsed))
              onChange(parsed)
            }
          }}
          onBlur={() => setDraft(null)}
        />
      </div>
    </div>
  )
}
