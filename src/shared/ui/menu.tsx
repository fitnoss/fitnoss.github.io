import { useEffect, useRef, useState, type ReactNode } from "react"
import { EllipsisVertical } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Button, type ButtonSize } from "./button"

type Props = { children: ReactNode; size?: ButtonSize; label?: string }

/** "⋮" button with a small popup list of actions. */
export function Menu({ children, size = "icon", label = "Menu" }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false)
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
      <Button variant="ghost" size={size} onClick={() => setOpen((o) => !o)} aria-label={label} aria-expanded={open}>
        <EllipsisVertical />
      </Button>
      {open && (
        <div
          role="menu"
          className="bg-page hairline rounded-control absolute top-full right-0 z-50 mt-1 min-w-48 p-1 shadow-xl shadow-black/10 [animation:toast-in_.12s]"
          onClick={() => setOpen(false)}
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
        "hover:bg-surface-hover flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium whitespace-nowrap [&_svg]:size-4",
        danger && "text-danger",
        className,
      )}
      {...props}
    />
  )
}
