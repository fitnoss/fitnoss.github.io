import { cn } from "@/shared/lib/utils"

type Props = { checked: boolean; onChange: (checked: boolean) => void; className?: string }

export function Switch({ checked, onChange, className }: Props) {
  return (
    <input
      type="checkbox"
      role="switch"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className={cn(
        "bg-elevated checked:bg-inverse relative h-[26px] w-[44px] shrink-0 cursor-pointer appearance-none rounded-full transition-colors",
        "after:bg-page after:absolute after:top-[3px] after:left-[3px] after:size-5 after:rounded-full after:shadow-sm after:transition-transform checked:after:translate-x-[18px]",
        className,
      )}
    />
  )
}
