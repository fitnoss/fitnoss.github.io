import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/shared/lib/utils"

type Props<T extends string> = {
  value: T
  onChange: (value: T) => void
  options: readonly { value: T; label: string }[]
  label: string
  disabled?: boolean
  className?: string
}

/** Select-only combobox. The native popover puts the list above scrolling panels and dialogs. */
export function Select<T extends string>({ value, onChange, options, label, disabled, className }: Props<T>) {
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const search = useRef({ text: "", at: 0 })
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const selected = options.findIndex((option) => option.value === value)
  const expanded = open && !disabled && options.length > 0

  useLayoutEffect(() => {
    const list = popup.current
    const button = trigger.current
    if (!list || !button) return
    if (!expanded) {
      if (list.matches(":popover-open")) list.hidePopover()
      return
    }
    const position = () => {
      const rect = button.getBoundingClientRect()
      const viewport = window.visualViewport
      const top = viewport?.offsetTop ?? 0
      const left = viewport?.offsetLeft ?? 0
      const width = viewport?.width ?? window.innerWidth
      const height = viewport?.height ?? window.innerHeight
      const below = top + height - rect.bottom - 12
      const above = rect.top - top - 12
      const upwards = below < Math.min(280, list.scrollHeight) && above > below
      const maxHeight = Math.max(0, Math.min(320, upwards ? above : below))
      Object.assign(list.style, {
        width: `${Math.min(rect.width, width - 16)}px`,
        maxHeight: `${maxHeight}px`,
        left: `${Math.max(left + 8, Math.min(rect.left, left + width - rect.width - 8))}px`,
        top: `${upwards ? rect.top - Math.min(list.scrollHeight, maxHeight) - 6 : rect.bottom + 6}px`,
      })
    }
    list.showPopover()
    position()
    const onScroll = (event: Event) => {
      if (!list.contains(event.target as Node)) position()
    }
    window.addEventListener("resize", position)
    document.addEventListener("scroll", onScroll, true)
    window.visualViewport?.addEventListener("resize", position)
    window.visualViewport?.addEventListener("scroll", position)
    return () => {
      window.removeEventListener("resize", position)
      document.removeEventListener("scroll", onScroll, true)
      window.visualViewport?.removeEventListener("resize", position)
      window.visualViewport?.removeEventListener("scroll", position)
    }
  }, [expanded])

  useLayoutEffect(() => {
    if (expanded) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: "nearest" })
  }, [expanded, active, id])

  function show(index = selected) {
    search.current = { text: "", at: 0 }
    setActive(Math.max(0, index))
    setOpen(true)
  }

  function choose(index: number) {
    const option = options[index]
    if (option) onChange(option.value)
    setOpen(false)
    trigger.current?.focus({ preventScroll: true })
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Tab") { setOpen(false); return }
    if (event.key === "Escape" && expanded) {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      return
    }
    if (["Enter", " "].includes(event.key)) {
      event.preventDefault()
      if (expanded) choose(active)
      else show()
      return
    }
    const next = event.key === "ArrowDown" ? (active + 1) % options.length
      : event.key === "ArrowUp" ? (active - 1 + options.length) % options.length
      : event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : undefined
    if (next !== undefined) {
      event.preventDefault()
      if (expanded) setActive(next)
      else show(event.key === "Home" || event.key === "End" ? next : selected)
      return
    }
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return
    event.preventDefault()
    const now = Date.now()
    const character = event.key.toLocaleLowerCase()
    const previous = now - search.current.at < 700 ? search.current.text : ""
    const text = previous === character ? character : previous + character
    search.current = { text, at: now }
    const from = expanded ? active : selected
    const offset = text.length === 1 ? 1 : 0
    for (let i = 0; i < options.length; i++) {
      const index = (Math.max(0, from) + offset + i) % options.length
      if (options[index].label.toLocaleLowerCase().startsWith(text)) {
        setActive(index)
        setOpen(true)
        break
      }
    }
  }

  return (
    <div className={cn("w-full", className)} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
    }}>
      <button ref={trigger} type="button" role="combobox" aria-label={label}
        aria-expanded={expanded} aria-haspopup="listbox" aria-controls={id}
        aria-activedescendant={expanded ? `${id}-${active}` : undefined}
        disabled={disabled || !options.length}
        onKeyDown={onKeyDown} onClick={() => expanded ? setOpen(false) : show()}
        className="bg-surface hairline hover:bg-surface-hover rounded-control flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-[15px] transition-colors disabled:pointer-events-none disabled:opacity-40">
        <span className="min-w-0 truncate">{options[selected]?.label ?? "—"}</span>
        <ChevronDown aria-hidden="true" className={cn("text-muted size-4 shrink-0 transition-transform", expanded && "rotate-180")} />
      </button>
      <div ref={popup} id={id} popover="auto" role="listbox" aria-label={label}
        onToggle={(event) => { if (event.newState === "closed") setOpen(false) }}
        onMouseDown={(event) => event.preventDefault()}
        className="bg-page dark:bg-elevated hairline rounded-control fixed inset-auto m-0 overflow-y-auto overscroll-contain border-0 p-1 text-fg shadow-xl shadow-black/15 dark:shadow-black/30 [animation:toast-in_.12s]">
        {options.map((option, index) => (
          <div key={option.value} id={`${id}-${index}`} role="option" aria-selected={option.value === value}
            onPointerMove={() => setActive(index)} onClick={(event) => { event.preventDefault(); choose(index) }}
            className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm", index === active && "bg-surface-hover dark:bg-white/8", option.value === value && "font-semibold")}>
            <span className="min-w-0 flex-1">{option.label}</span>
            {option.value === value && <Check aria-hidden="true" className="size-4 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  )
}
