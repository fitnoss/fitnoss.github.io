import { useEffect, useId, useRef, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Button } from "./button"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: ReactNode
  description?: ReactNode
  /** Extra controls in the header, before the close button. */
  actions?: ReactNode
  /** Pinned below the scrolling body. */
  footer?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}

/** Modal built on <dialog>: bottom sheet on phones, centered panel on wider screens. */
export function Sheet({ open, onOpenChange, title, description, actions, footer, className, bodyClassName, children }: Props) {
  const { t } = useTranslation()
  const titleId = useId()
  const descriptionId = useId()
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      className={cn("sheet", className)}
      // React bubbles `close` from nested dialogs (the filters sheet inside the picker); ignore those.
      onClose={(e) => e.target === e.currentTarget && onOpenChange(false)}
      // A click on the dialog itself (not its content) is a click on the backdrop.
      onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}
    >
      {open && (
        <>
          <div className="flex shrink-0 items-start gap-2 px-4 pt-4 pb-3">
            <div className="min-w-0 flex-1 pt-1.5">
              {title && <h2 id={titleId} className="text-lg leading-tight font-semibold tracking-tight">{title}</h2>}
              {description && <p id={descriptionId} className="text-muted mt-1 text-sm">{description}</p>}
            </div>
            {actions}
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label={t("common.close")}>
              <X />
            </Button>
          </div>
          <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4", bodyClassName)}>{children}</div>
          {footer && <div className="shrink-0 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">{footer}</div>}
        </>
      )}
    </dialog>
  )
}
