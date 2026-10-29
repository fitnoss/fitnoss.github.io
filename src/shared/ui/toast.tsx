import { useSyncExternalStore } from "react"
import { Check, CircleAlert } from "lucide-react"

type Kind = "info" | "success" | "error"
type Options = { action?: { label: string; onClick: () => void }; duration?: number }
type Item = Options & { id: number; kind: Kind; text: string }

let items: Item[] = []
let nextId = 0
const listeners = new Set<() => void>()

function emit(next: Item[]) {
  items = next
  listeners.forEach((l) => l())
}

function dismiss(id: number) {
  emit(items.filter((t) => t.id !== id))
}

function show(kind: Kind, text: string, opts: Options = {}) {
  const id = ++nextId
  emit([...items.slice(-2), { id, kind, text, ...opts }])
  const ms = opts.duration ?? (opts.action ? 6000 : 2600)
  if (Number.isFinite(ms)) setTimeout(() => dismiss(id), ms)
}

export const toast = Object.assign((text: string, opts?: Options) => show("info", text, opts), {
  success: (text: string, opts?: Options) => show("success", text, opts),
  error: (text: string, opts?: Options) => show("error", text, opts),
})

export function Toaster() {
  const list = useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => items,
  )
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))]">
      {list.map((t) => (
        <div
          key={t.id}
          role="status"
          className="bg-inverse text-inverse-fg pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-full py-2 pr-2 pl-4 text-sm font-medium shadow-lg shadow-black/20 [animation:toast-in_.2s_ease-out]"
          onClick={() => dismiss(t.id)}
        >
          {t.kind === "success" && (
            <Check className="bg-inverse-fg text-inverse size-5 shrink-0 rounded-full p-[3px]" strokeWidth={3.5} />
          )}
          {t.kind === "error" && <CircleAlert className="text-danger size-4 shrink-0" />}
          <span className="py-1 pr-2">{t.text}</span>
          {t.action && (
            <button
              type="button"
              className="bg-inverse-fg/15 hover:bg-inverse-fg/25 h-8 rounded-full px-3 font-semibold"
              onClick={(e) => {
                e.stopPropagation()
                t.action!.onClick()
                dismiss(t.id)
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
