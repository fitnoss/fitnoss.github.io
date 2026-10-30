import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/shared/lib/utils"

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "bg-surface hairline rounded-control h-11 w-full min-w-0 px-3 text-base outline-none transition-colors md:text-[15px]",
        "hover:bg-surface-hover focus:bg-page focus:shadow-[inset_0_0_0_1.5px_var(--fg)]",
        className,
      )}
      {...props}
    />
  )
}

/** Small caption above a control. */
export function Field({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-muted block text-xs font-medium">{label}</span>
      {children}
    </label>
  )
}
