"use client"

import * as React from "react"
import { AlertTriangle, Loader2, RotateCw } from "lucide-react"

/**
 * App-level error boundary: a rendering crash anywhere in the studio shows a
 * friendly recovery screen instead of a blank, dead page. "Try again" re-runs
 * the failed render; "Reload" does a full page load.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [retrying, setRetrying] = React.useState(false)
  React.useEffect(() => {
    // surface in devtools / Next dev overlay logs for diagnosis
    console.error("[landing-forge] render error:", error)
    // never let the boot splash cover a crash screen
    ;(window as unknown as { __lfBootDone?: () => void }).__lfBootDone?.()
  }, [error])

  const onRetry = async () => {
    setRetrying(true)
    reset()
    setTimeout(() => setRetrying(false), 1500)
  }

  return (
    <div
      className="flex h-dvh flex-col items-center justify-center gap-5 bg-zinc-950 px-6 text-center text-zinc-100"
      style={{
        backgroundImage:
          "linear-gradient(rgba(167,139,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.04) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
        <AlertTriangle className="h-7 w-7 text-amber-400" aria-hidden />
      </div>
      <div>
        <h1 className="text-lg font-extrabold tracking-tight">The studio hit a snag</h1>
        <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-zinc-400">
          Something failed while rendering this view. Your project is saved in the database —
          reloading the page is always safe.
        </p>
        {error?.digest && (
          <p className="mt-2 font-mono text-[10px] text-zinc-600">error digest: {error.digest}</p>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => void onRetry()}
          disabled={retrying}
          className="flex h-9 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-[12px] font-semibold text-zinc-200 transition-colors hover:border-zinc-500 disabled:opacity-60"
        >
          {retrying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RotateCw className="h-4 w-4" aria-hidden />}
          Try again
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex h-9 items-center gap-2 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 px-4 text-[12px] font-semibold text-white shadow-lg shadow-violet-500/25 transition-transform hover:scale-[1.02]"
        >
          Reload studio
        </button>
      </div>
    </div>
  )
}
