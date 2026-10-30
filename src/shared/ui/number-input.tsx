import { useEffect, useRef, useState, type ComponentProps } from "react"
import { Input } from "./field"

type Props = Omit<ComponentProps<typeof Input>, "value" | "onChange"> & {
  value?: number
  onValueChange: (value: number | undefined) => void
}

/** Retain a trailing decimal separator while typing; number-only state would erase it. */
export function NumberInput({ value, onValueChange, inputMode = "decimal", onFocus, onBlur, ...props }: Props) {
  const [text, setText] = useState(value === undefined ? "" : String(value))
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setText(value === undefined ? "" : String(value))
  }, [value])
  return <Input {...props} inputMode={inputMode} value={text}
    onFocus={(event) => { focused.current = true; onFocus?.(event) }}
    onBlur={(event) => {
      focused.current = false
      setText(value === undefined ? "" : String(value))
      onBlur?.(event)
    }}
    onChange={(event) => {
      const next = event.target.value
      const pattern = inputMode === "numeric" ? /^\d*$/ : /^\d*(?:[.,]\d*)?$/
      if (!pattern.test(next)) return
      const numeric = next.trim() ? Number(next.replace(",", ".")) : undefined
      if (numeric !== undefined && !Number.isFinite(numeric)) return
      setText(next)
      onValueChange(numeric)
    }} />
}
