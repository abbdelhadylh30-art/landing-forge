"use client"

import * as React from "react"
import { CloudOff, Loader2, RotateCw, RefreshCw } from "lucide-react"
import { useForge } from "@/lib/landing/store"
import { useSaveProject } from "@/components/forge/studio/useSaveProject"

/**
 * ConnectionGuard — self-healing for dev-server restarts / network blips.
 *
 * Why this exists: when the Next.js dev server restarts (or the network
 * drops), the already-loaded page silently stops working — fetches fail,
 * clicks appear dead ("the whole project is not clickable"). Instead of a
 * dead page, the guard:
 *
 *  1. heartbeats /api/health every 20s while visible (2s while unhealthy)
 *  2. shows a banner the moment the server is unreachable
 *  3. when the server comes back: reloads automatically when there is no
 *     unsaved work, or offers "Save & reload" when there is (autosave
 *     usually clears the dirty flag on its own, which also triggers reload)
 *
 * Zero DB cost on the server; ~1 request/20s on the client.
 */
export function ConnectionGuard() {
  const [down, setDown] = React.useState(false)
  const [recovered, setRecovered] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const { save } = useSaveProject()
  const saveRef = React.useRef(save)
  React.useEffect(() => {
    saveRef.current = save
  }, [save])

  const stateRef = React.useRef<{ down: boolean; timer: number | undefined }>({ down: false, timer: undefined })

  // ── health check loop ────────────────────────────────────────────────────
  const check = React.useCallback(async () => {
    try {
      const ctrl = new AbortController()
      const t = window.setTimeout(() => ctrl.abort(), 4000)
      const res = await fetch("/api/health", { cache: "no-store", signal: ctrl.signal })
      clearTimeout(t)
      const ok = res.ok
      if (ok && stateRef.current.down) {
        // server came back after being down → heal the page
        stateRef.current.down = false
        const { dirty } = useForge.getState()
        if (!dirty) {
          window.location.reload()
        } else {
          setRecovered(true) // offer save & reload; autosave may clear dirty on its own
        }
      }
      return ok
    } catch {
      if (!stateRef.current.down) {
        stateRef.current.down = true
        setDown(true)
        setRecovered(false)
      }
      return false
    }
  }, [])

  // heartbeat: fast retry while down, relaxed while healthy; paused in hidden tabs
  React.useEffect(() => {
    let stopped = false
    const loop = async () => {
      if (stopped) return
      const healthy = await check()
      const delay = healthy ? 20_000 : 2_000
      stateRef.current.timer = window.setTimeout(loop, delay)
    }
    void loop()

    const onVisible = () => {
      if (document.visibilityState === "visible") void check()
    }
    const onOnline = () => void check()
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("online", onOnline)
    return () => {
      stopped = true
      if (stateRef.current.timer) window.clearTimeout(stateRef.current.timer)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("online", onOnline)
    }
  }, [check])

  // when the autosave clears the dirty flag while in "recovered" state → reload
  const dirty = useForge((s) => s.dirty)
  React.useEffect(() => {
    if (recovered && !dirty) {
      window.location.reload()
    }
  }, [recovered, dirty])

  const doSaveAndReload = async () => {
    setSaving(true)
    try {
      await saveRef.current({ silent: true })
      // save() swallows errors — only reload when the dirty flag actually
      // cleared (markSaved ran ⇒ the PATCH succeeded)
      if (!useForge.getState().dirty) {
        window.location.reload()
      } else {
        setSaving(false)
      }
    } catch {
      setSaving(false)
    }
  }

  // ── nothing to show while healthy ────────────────────────────────────────
  if (!down && !recovered) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-amber-500/40 bg-zinc-950/95 px-4 py-2.5 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-[12px]">
          {down ? (
            <>
              <CloudOff className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
              <span className="font-semibold text-amber-200">Studio connection lost</span>
              <span className="hidden text-zinc-400 sm:inline">— waiting for the server to come back…</span>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400/70" aria-hidden />
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              <span className="font-semibold text-emerald-200">Reconnected</span>
              <span className="text-zinc-400">
                {dirty ? "— your edits are safe, reload to continue" : "— reloading…"}
              </span>
            </>
          )}
        </div>
        {down ? (
          <button
            type="button"
            onClick={() => void check()}
            className="flex h-7 items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-amber-500/50 hover:text-amber-100"
          >
            <RotateCw className="h-3 w-3" aria-hidden /> Retry now
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {dirty && (
              <button
                type="button"
                onClick={() => void doSaveAndReload()}
                disabled={saving}
                className="flex h-7 items-center gap-1.5 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-2.5 text-[11px] font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
                Save &amp; reload
              </button>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex h-7 items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
            >
              <RotateCw className="h-3 w-3" aria-hidden /> Reload
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
