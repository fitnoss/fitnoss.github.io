import type { ComponentProps } from "react"
import { cn } from "@/shared/lib/utils"

const VARIANTS = {
  /** Flat control on the page: the default for almost everything. */
  default: "bg-surface hairline hover:bg-surface-hover active:bg-surface-press",
  /** The one main action of a screen. */
  primary: "bg-inverse text-inverse-fg hover:opacity-90 active:opacity-80",
  accent: "bg-accent text-accent-fg hover:opacity-90 active:opacity-80",
  ghost: "hover:bg-surface-hover active:bg-surface-press",
  danger: "text-danger hover:bg-danger/10 active:bg-danger/15",
}

const SIZES = {
  md: "h-11 px-4 text-[15px]",
  sm: "h-11 gap-1.5 px-3 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "size-11",
  "icon-sm": "size-11",
}

export type ButtonVariant = keyof typeof VARIANTS
export type ButtonSize = keyof typeof SIZES

/** Classes of a button, for links and other elements that should look like one. */
export function buttonClass(variant: ButtonVariant = "default", size: ButtonSize = "md", className?: string) {
  return cn(
    "rounded-control inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-medium whitespace-nowrap transition-[background-color,opacity] select-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}

type Props = ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }

export function Button({ variant, size, className, type = "button", ...props }: Props) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />
}
