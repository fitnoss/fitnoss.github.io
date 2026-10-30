import { useEffect, useState, type ReactNode } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { scroller } from "@/shared/lib/scroller"
import { cn } from "@/shared/lib/utils"

type Props = {
  title: ReactNode
  /** Show a back button; a string is the fallback route when there is no history. */
  back?: boolean | string
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

/** Whether the page has scrolled off the top, where the wash sits behind the header. */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const el = scroller()
    const onScroll = () => setScrolled(el.scrollTop > 0)
    onScroll()
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [])
  return scrolled
}

/**
 * Sticky page header, see-through at the top so the wash shows, frosted once content scrolls under it.
 * The frosted backdrop is a full-viewport-wide strip behind the centered column (the page clips it
 * horizontally), so on wide screens it doesn't read as a box. It also bleeds upward off-screen, so a
 * frame of lag while the mobile viewport settles never shows content above the header. Top-level pages (no back button) get a
 * large title, nested pages a compact one next to the back arrow.
 */
export function PageHeader({ title, back, actions, children, className }: Props) {
  const navigate = useNavigate()
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate(typeof back === "string" ? back : "/")
  }
  const scrolled = useScrolled()
  return (
    <header
      className={cn(
        "sticky top-0 z-30 transform-gpu pt-safe",
        "before:absolute before:-top-24 before:bottom-0 before:left-1/2 before:-z-10 before:-ml-[50vw] before:w-screen before:transition-colors before:duration-200",
        scrolled ? "before:bg-page/80 before:backdrop-blur-xl" : "before:bg-transparent",
        className,
      )}
    >
      <div className={cn("flex items-center gap-1 px-2", back ? "h-14" : "h-16 pl-4 md:h-20")}>
        {back && (
          <Button variant="ghost" size="icon" onClick={goBack} aria-label="Back">
            <ArrowLeft className="size-[22px]" />
          </Button>
        )}
        <h1
          className={cn(
            "min-w-0 flex-1 truncate font-semibold tracking-tight",
            back ? "text-[17px]" : "text-[26px] leading-none font-bold md:text-[28px]",
          )}
        >
          {title}
        </h1>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      {children}
    </header>
  )
}
