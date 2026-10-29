import { Suspense, useEffect, useRef, useSyncExternalStore } from "react"
import { useTranslation } from "react-i18next"
import { NavLink, Outlet, useLocation } from "react-router"
import { ChartNoAxesColumn, Dumbbell, Ellipsis, ListChecks, Moon, Sun, Timer } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { useSessionStore } from "@/entities/session/store"
import { isDark, useSettings } from "@/shared/storage/settings"

const TABS = [
  { to: "/", icon: ListChecks, label: "nav.programs", end: true, also: ["/programs/", "/s/"] },
  { to: "/exercises", icon: Dumbbell, label: "nav.exercises", end: false, also: ["/ex/"] },
  { to: "/workout", icon: Timer, label: "nav.workout", end: false, also: [] },
  { to: "/progress", icon: ChartNoAxesColumn, label: "nav.progress", end: false, also: [] },
  { to: "/more", icon: Ellipsis, label: "nav.more", end: false, also: ["/dev/"] },
]

// Fake rounded corners of the content sheet: overlays painted in the chrome color, since rounding the
// scroller itself would clip its sticky header and frosted backdrop.
const corner = (at: string) => ({
  background: `radial-gradient(circle at ${at}, transparent 17.5px, var(--chrome) 18px)`,
})

const darkQuery = matchMedia("(prefers-color-scheme: dark)")
const subscribeScheme = (cb: () => void) => {
  darkQuery.addEventListener("change", cb)
  return () => darkQuery.removeEventListener("change", cb)
}

/** Desktop sidebar button that flips to the other theme (an explicit choice, so it leaves "system"). */
function ThemeToggle() {
  const { t } = useTranslation()
  const theme = useSettings((s) => s.theme)
  const setTheme = useSettings((s) => s.setTheme)
  useSyncExternalStore(subscribeScheme, () => darkQuery.matches)
  const dark = isDark(theme)
  const label = t(dark ? "nav.lightTheme" : "nav.darkTheme")
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className="rounded-control text-muted hover:text-fg hover:bg-surface-hover mt-auto hidden h-11 items-center justify-center transition-colors md:flex"
    >
      {dark ? <Sun className="size-[22px]" strokeWidth={1.9} /> : <Moon className="size-[22px]" strokeWidth={1.9} />}
    </button>
  )
}

export function Layout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const active = useSessionStore((s) => !!s.active)
  const main = useRef<HTMLElement>(null)

  useEffect(() => {
    main.current?.scrollTo(0, 0)
  }, [pathname])

  // App shell: a fixed full-screen frame where only <main> scrolls and the tab bar is a plain flex item.
  // A scrolling document in iOS home-screen apps leaves fixed bars floating off the screen edge and
  // makes the sticky header shake.
  return (
    <div className="fixed inset-0 flex flex-col md:flex-row">
      <div className="relative min-h-0 flex-1 md:order-last">
        <main
          ref={main}
          id="scroller"
          className="bg-page absolute inset-0 isolate overflow-x-hidden overflow-y-auto overscroll-y-none [scrollbar-gutter:stable]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(34rem,70svh)] wash" />
          <div className="mx-auto max-w-2xl">
            <Suspense fallback={null}>
              <Outlet />
            </Suspense>
          </div>
        </main>

        {/* Mobile: rounded bottom of the sheet above the tab bar. Desktop: rounded left side next to the sidebar. */}
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 z-30 size-[18px] md:hidden" style={corner("100% 0")} />
        <div aria-hidden className="pointer-events-none absolute right-0 bottom-0 z-30 size-[18px] md:hidden" style={corner("0 0")} />
        <div aria-hidden className="pointer-events-none absolute top-0 left-0 z-30 hidden size-[18px] md:block" style={corner("100% 100%")} />
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 z-30 hidden size-[18px] md:block" style={corner("100% 0")} />
      </div>

      <nav
        className={cn(
          "bg-chrome z-40 shrink-0",
          "grid h-[calc(3.75rem+env(safe-area-inset-bottom))] grid-cols-5 px-1.5 pt-1.5 pb-safe",
          "md:flex md:h-auto md:w-[6rem] md:flex-col md:gap-1 md:px-2 md:pt-3 md:pb-3",
        )}
      >
        {TABS.map(({ to, icon: Icon, label, end, also }) => [
          to === "/more" && <ThemeToggle key="theme" />,
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "rounded-control text-muted flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                "h-[3.25rem] md:h-auto md:py-2.5",
                isActive || also.some((p) => pathname.startsWith(p))
                  ? "bg-inverse text-inverse-fg"
                  : "hover:text-fg hover:bg-surface-hover",
              )
            }
          >
            <span className="relative">
              <Icon className="size-[22px]" strokeWidth={1.9} />
              {to === "/workout" && active && (
                <span className="bg-danger ring-chrome absolute -top-px -right-0.5 size-[7px] rounded-full ring-[1.5px] [animation:pulse-dot_1.6s_infinite]" />
              )}
            </span>
            <span className="max-w-full truncate px-0.5">{t(label)}</span>
          </NavLink>,
        ])}
      </nav>
    </div>
  )
}
