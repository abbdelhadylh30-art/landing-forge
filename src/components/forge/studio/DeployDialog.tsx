"use client"

import * as React from "react"
import { Check, Copy, ExternalLink, Loader2, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useForge } from "@/lib/landing/store"
import type { DeployRecord } from "@/lib/landing/types"

const EXPECTED_STEPS = 9

export function DeployDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const projectId = useForge((s) => s.project.id)
  const projectName = useForge((s) => s.project.name)
  const slug = useForge((s) => s.project.slug)
  const [deploy, setDeploy] = React.useState<DeployRecord | null>(null)
  const [starting, setStarting] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const logRef = React.useRef<HTMLDivElement>(null)

  // Start a deploy when dialog opens
  React.useEffect(() => {
    if (!open || !projectId) return
    let cancelled = false
    setStarting(true)
    setDeploy(null)
    ;(async () => {
      try {
        const res = await fetch("/api/deploy", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ projectId }),
        })
        const data = (await res.json()) as { deploy?: DeployRecord; error?: string }
        if (!res.ok || !data.deploy) throw new Error(data.error ?? "Deploy failed to start")
        if (!cancelled) {
          setDeploy(data.deploy)
          setStarting(false)
        }
      } catch (e) {
        if (!cancelled) {
          setStarting(false)
          toast.error("Deploy failed to start", { description: e instanceof Error ? e.message : undefined })
          onOpenChange(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, projectId, onOpenChange])

  // Poll while queued/building
  React.useEffect(() => {
    if (!deploy?.id || (deploy.status !== "queued" && deploy.status !== "building")) return
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/deploy?id=${deploy.id}`)
        const data = (await res.json()) as { deploy: DeployRecord | null }
        if (data.deploy) setDeploy(data.deploy)
        if (data.deploy && (data.deploy.status === "live" || data.deploy.status === "failed")) {
          if (data.deploy.status === "live") toast.success("Deployed 🚀", { description: data.deploy.url })
          else toast.error("Deploy failed")
        }
      } catch {
        /* transient network error — keep polling */
      }
    }, 700)
    return () => clearInterval(t)
  }, [deploy?.id, deploy?.status])

  // Auto-scroll log terminal
  React.useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [deploy?.logs?.length])

  const copyUrl = async () => {
    if (!deploy?.url) return
    try {
      await navigator.clipboard.writeText(deploy.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      toast.success("URL copied")
    } catch {
      toast.error("Clipboard unavailable")
    }
  }

  const status = deploy?.status ?? "queued"
  const progress = Math.min(100, Math.round(((deploy?.logs?.length ?? 0) / EXPECTED_STEPS) * 100))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-zinc-800 bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Rocket className={cn("h-4 w-4 text-violet-300", (starting || status === "building" || status === "queued") && "animate-pulse")} />
            Deploy {projectName}
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px] text-zinc-500">/{slug} → edge network</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Status row */}
          <div className="flex items-center gap-2">
            {status === "live" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                <Check className="h-3 w-3" /> Live
              </span>
            ) : status === "failed" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300">
                Failed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-200">
                <Loader2 className="h-3 w-3 animate-spin" /> {starting ? "Starting…" : "Building…"}
              </span>
            )}
            {deploy?.durationMs ? <span className="text-[11px] text-zinc-500">{(deploy.durationMs / 1000).toFixed(1)}s</span> : null}
          </div>

          <Progress value={status === "live" ? 100 : progress} className="h-1.5 [&_[data-slot=progress-indicator]]:bg-violet-500" />

          {/* Log terminal */}
          <div ref={logRef} className="h-52 overflow-y-auto rounded-lg border border-zinc-800 bg-black/70 p-3 font-mono text-[11px] leading-relaxed [scrollbar-width:thin]">
            {(deploy?.logs ?? []).map((line, i) => (
              <p key={i} className={cn("whitespace-pre-wrap", line.level === "success" ? "text-emerald-300" : line.level === "warn" ? "text-amber-300" : "text-zinc-400")}>
                <span className="text-zinc-600">{new Date(line.t).toLocaleTimeString([], { hour12: false })} </span>
                {line.msg}
              </p>
            ))}
            {(starting || status === "queued") && <p className="animate-pulse text-violet-400">▍</p>}
          </div>

          {/* URL row */}
          {deploy?.url && status === "live" && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5">
              <ExternalLink className="h-4 w-4 shrink-0 text-emerald-300" />
              <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-emerald-200">{deploy.url}</code>
              <Button variant="outline" size="sm" className="h-7 gap-1 border-zinc-700 bg-transparent text-[11px] hover:border-emerald-500/50 hover:text-emerald-200" onClick={copyUrl}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
