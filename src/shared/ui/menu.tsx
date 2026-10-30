import { useEffect, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { EllipsisVertical } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Button, type ButtonSize } from "./button"

type Props = { children: ReactNode; size?: ButtonSize; label?: string }

/** "⋮" button with a small popup list of actions. */
export function Menu({ children, size = "icon", label }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    ref.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus()
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) {
        setOpen(false)
        if (e instanceof KeyboardEvent) ref.current?.querySelector<HTMLButtonElement>("button")?.focus()
      }
    }
    document.addEventListener("pointerdown", close)
    document.addEventListener("keydown", close)
    return () => {
      document.removeEventListener("pointerdown", close)
      document.removeEventListener("keydown", close)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size={size} onClick={() => setOpen((o) => !o)} aria-label={label ?? t("common.menu")} aria-haspopup="menu" aria-expanded={open}>
        <EllipsisVertical />
      </Button>
      {open && (
        <div
          role="menu"
          onKeyDown={(e) => {
            const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]:not(:disabled)')]
            const i = items.indexOf(document.activeElement as HTMLButtonElement)
            const next = e.key === "ArrowDown" ? (i + 1) % items.length : e.key === "ArrowUp" ? (i - 1 + items.length) % items.length : e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : undefined
            if (next !== undefined) { e.preventDefault(); items[next]?.focus() }
          }}
          className="bg-page hairline rounded-control absolute top-full right-0 z-50 mt-1 min-w-48 p-1 shadow-xl shadow-black/10 [animation:toast-in_.12s]"
          onClick={() => { setOpen(false); ref.current?.querySelector<HTMLButtonElement>("button")?.focus() }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ danger, className, ...props }: React.ComponentProps<"button"> & { danger?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "hover:bg-surface-hover flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium whitespace-nowrap [&_svg]:size-4",
        danger && "text-danger",
        className,
      )}
      {...props}
    />
  )
}
