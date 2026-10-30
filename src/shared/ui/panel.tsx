import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/shared/lib/utils"

/** Filled block that groups related content. */
export function Panel({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("bg-surface hairline rounded-panel", className)} {...props} />
}

/** Titled group of content, like a settings section. */
export function Section({
  title,
  hint,
  action,
  children,
  className,
  id,
}: {
  title: ReactNode
  hint?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={cn("space-y-2.5", className)}>
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
      {hint && <p className="text-muted px-1 text-[13px] leading-relaxed">{hint}</p>}
    </section>
  )
}

export function Empty({ icon, title, children }: { icon?: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      {icon && <div className="bg-surface hairline text-muted mb-1 flex size-12 items-center justify-center rounded-2xl [&_svg]:size-6">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {children && <div className="text-muted max-w-xs text-sm">{children}</div>}
    </div>
  )
}
