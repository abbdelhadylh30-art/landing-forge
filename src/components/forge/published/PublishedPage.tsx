"use client"

import * as React from "react"
import { ArrowLeft, Check, ChevronDown, ChevronUp, Copy, ExternalLink, Link2, Loader2, MousePointerClick, Radio, SearchX, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { LandingPreview } from "@/components/forge/preview/LandingPreview"
import { track, detectDevice, detectBrowser, getVisitorId } from "@/components/forge/shared/tracking"
import type { HeroSection, LandingConfig, ProjectSummary, ProjectWithConfig, Section } from "@/lib/landing/types"

type LoadState =
  | { kind: "loading" }
  | { kind: "notfound"; slug: string }
  | { kind: "error"; message: string }
  | { kind: "ready"; project: ProjectWithConfig }

/** Weighted pick of an A/B variant name (e.g. 50/50 → "A" | "B"), memo-stable per project+visitor. */
function assignVariant(hero: HeroSection, projectId: string): string {
  const key = `lf-ab-assign-${projectId}`
  try {
    const stored = window.localStorage.getItem(key)
    if (stored && hero.ab?.variants.some((v) => v.name === stored)) return stored
  } catch {
    /* storage unavailable — just pick */
  }
  const variants = hero.ab?.variants ?? []
  const total = variants.reduce((sum, v) => sum + Math.max(1, v.weight), 0)
  let roll = Math.random() * total
  let picked = variants[0]?.name ?? "A"
  for (const v of variants) {
    roll -= Math.max(1, v.weight)
    if (roll <= 0) {
      picked = v.name
      break
    }
  }
  try {
    window.localStorage.setItem(key, picked)
  } catch {
    /* ignore */
  }
  return picked
}

/** A live self-refreshing "time on page" ticker (mm:ss). */
function SessionTimer({ since }: { since: number }) {
  const [, force] = React.useReducer((x: number) => x + 1, 0)
  React.useEffect(() => {
    const t = setInterval(force, 1000)
    return () => clearInterval(t)
  }, [])
  const s = Math.max(0, Math.floor((Date.now() - since) / 1000))
  const label = s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`
  return <span className="tabular-nums">{label}</span>
}

/**
 * Published page — the shareable in-app route `/?p=<slug>`.
 * Renders the project's last SAVED config full-screen, as a visitor would see
 * it, and records real analytics: pageview, A/B variant exposure, CTA clicks
 * and form submissions (which also land in the leads inbox).
 */
export function PublishedPage({ slug }: { slug: string }) {
  const [state, setState] = React.useState<LoadState>({ kind: "loading" })
  const [variant, setVariant] = React.useState<string | null>(null)
  const [chromeOpen, setChromeOpen] = React.useState(true)
  const [copied, setCopied] = React.useState(false)

  const sessionStartRef = React.useRef(Date.now())
  const [clicks, setClicks] = React.useState(0)
  const [events, setEvents] = React.useState(0)
  const [leadsSent, setLeadsSent] = React.useState(0)
  const trackedOnceRef = React.useRef(false)

  // ── Load project by slug (last SAVED state — this is what "published" means)
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const listRes = await fetch("/api/projects")
        const list = (await listRes.json()) as ProjectSummary[]
        const match = Array.isArray(list) ? list.find((p) => p.slug === slug) : undefined
        if (!match) {
          if (!cancelled) setState({ kind: "notfound", slug })
          return
        }
        const fullRes = await fetch(`/api/projects/${match.id}`)
        if (!fullRes.ok) throw new Error("Could not load the published config")
        const project = (await fullRes.json()) as ProjectWithConfig
        if (!cancelled) setState({ kind: "ready", project })
      } catch (e) {
        if (!cancelled) setState({ kind: "error", message: e instanceof Error ? e.message : "Unknown error" })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  // ── Visitor tracking: pageview + A/B exposure, once per visit
  React.useEffect(() => {
    if (state.kind !== "ready" || trackedOnceRef.current) return
    trackedOnceRef.current = true
    const { id, config } = state.project
    void track(id, {
      type: "pageview",
      path: `/${slug}`,
      device: detectDevice(),
      browser: detectBrowser(),
      visitorId: getVisitorId(),
      duration: 0,
      isBounce: true, // provisional bounce — any CTA click / form submit marks the visit engaged
    })
    setEvents((n) => n + 1)

    const hero = config.sections.find((s): s is HeroSection => s.type === "hero" && s.ab?.enabled === true)
    if (hero) {
      const assigned = assignVariant(hero, id)
      setVariant(assigned)
      void track(id, { type: "variant_exposure", variant: assigned, label: "hero", path: `/${slug}` })
      setEvents((n) => n + 1)
    }
  }, [state, slug])

  // ── Real page title from the project's SEO settings
  React.useEffect(() => {
    if (state.kind === "ready") document.title = state.project.config.seo.title || state.project.name
    return () => {
      document.title = "landing-forge studio — build landing pages visually"
    }
  }, [state])

  // ── Handlers wired into the landing preview
  const projectId = state.kind === "ready" ? state.project.id : null
  const config: LandingConfig | null = state.kind === "ready" ? state.project.config : null

  const handleCtaClick = React.useCallback(
    (section: Section, label: string) => {
      if (!projectId) return
      setClicks((n) => n + 1)
      setEvents((n) => n + 1)
      void track(projectId, {
        type: "cta_click",
        label: `${section.type}: ${label}`,
        variant: variant ?? undefined,
        path: `/${slug}`,
      })
      toast.success("CTA click tracked 🎯", { description: label })
    },
    [projectId, variant, slug]
  )

  const handleFormSubmit = React.useCallback(
    (section: Section, data: Record<string, string>) => {
      if (!projectId) return
      setEvents((n) => n + 1)
      setLeadsSent((n) => n + 1)
      void track(projectId, { type: "form_submit", label: `${section.type}: ${Object.keys(data).join(", ")}`, path: `/${slug}` })
      void fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, fields: data }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          const lead = j?.lead as { name?: string; email?: string } | undefined
          toast.success("Message sent ✅", {
            description: lead?.name ? `Thanks ${lead.name.split(" ")[0]} — we'll be in touch.` : "We'll be in touch.",
          })
        })
        .catch(() => undefined)
    },
    [projectId, slug]
  )

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
      toast.success("Link copied 🔗", { description: "Anyone with this URL sees the published page." })
    } catch {
      toast.error("Copy failed", { description: "Select the URL in the address bar instead." })
    }
  }

  // ── Loading / error / 404 states
  if (state.kind === "loading") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-zinc-950 text-zinc-100">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/20" aria-hidden />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-semibold text-zinc-200">Opening published page…</p>
          <p className="mt-0.5 font-mono text-[11px] text-zinc-500">/?p={slug}</p>
        </div>
      </div>
    )
  }

  if (state.kind === "notfound" || state.kind === "error") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-5 bg-zinc-950 px-6 text-zinc-100">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/60">
          {state.kind === "notfound" ? <SearchX className="h-6 w-6 text-zinc-500" /> : <Radio className="h-6 w-6 text-rose-400" />}
        </div>
        <div className="max-w-sm text-center">
          <p className="text-[15px] font-semibold text-zinc-100">
            {state.kind === "notfound" ? "No page published at this address" : "The published page could not load"}
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500">
            {state.kind === "notfound" ? (
              <>
                Nothing is published for <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-violet-300">?p={state.slug}</code>. Double-check
                the link, or open the studio to publish a project.
              </>
            ) : (
              state.message
            )}
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5 bg-violet-500 text-white hover:bg-violet-600">
          <a href="/">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to the studio
          </a>
        </Button>
      </div>
    )
  }

  // ── The published page itself
  const { name } = state.project
  return (
    <div className="relative h-dvh overflow-y-auto bg-zinc-950 lf-scroll [scroll-behavior:smooth]">
      <LandingPreview
        config={config!}
        abVariant={variant}
        onCtaClick={handleCtaClick}
        onFormSubmit={handleFormSubmit}
        className="min-h-full"
      />

      {/* Floating "published preview" chrome — live session telemetry */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3">
        <div
          className={cn(
            "pointer-events-none flex max-w-full flex-col items-center transition-all duration-300",
            chromeOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          )}
        >
          <div className="pointer-events-auto flex max-w-full items-center gap-2 overflow-hidden rounded-xl border border-zinc-700/60 bg-zinc-950/85 px-2.5 py-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
            {/* live pulse */}
            <span className="relative flex size-2 shrink-0" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            <span className="hidden shrink-0 text-[11px] font-semibold text-emerald-300 sm:inline">Live</span>

            <span className="hidden h-4 w-px shrink-0 bg-zinc-700/60 sm:block" aria-hidden />

            {/* project identity */}
            <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-zinc-200" title={`Published page — ${name}`}>
              <Link2 className="h-3 w-3 shrink-0 text-violet-300" />
              <span className="max-w-[110px] truncate sm:max-w-[180px]">{name}</span>
            </span>

            {/* session telemetry */}
            <span className="hidden items-center gap-3 font-mono text-[10px] text-zinc-400 md:flex" aria-label="Your visit is being tracked, privacy-friendly">
              <span className="flex items-center gap-1" title="Time on page">
                <Timer className="h-3 w-3" />
                <SessionTimer since={sessionStartRef.current} />
              </span>
              <span className="flex items-center gap-1" title="CTA clicks this visit">
                <MousePointerClick className="h-3 w-3" />
                {clicks}
              </span>
              <span className="flex items-center gap-1" title="Analytics events sent this visit">
                <Radio className="h-3 w-3" />
                {events}
                {leadsSent > 0 && <span className="text-fuchsia-300"> · {leadsSent} msg</span>}
              </span>
            </span>

            <span className="h-4 w-px shrink-0 bg-zinc-700/60" aria-hidden />

            {/* actions */}
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 rounded-lg px-2 text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                onClick={() => void copyLink()}
                title="Copy the published link"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span className="hidden sm:inline">Copy link</span>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 rounded-lg px-2 text-[11px] text-violet-300 hover:bg-violet-500/15 hover:text-violet-200"
                title="Open the studio editor for this workspace"
              >
                <a href="/">
                  <ExternalLink className="h-3 w-3" />
                  <span className="hidden sm:inline">Studio</span>
                </a>
              </Button>
            </div>
          </div>

          {/* privacy footnote + collapse toggle */}
          <div className="pointer-events-auto mt-1.5 flex items-center gap-2">
            <p className="rounded-full bg-zinc-950/70 px-2.5 py-0.5 text-[9px] text-zinc-500 backdrop-blur">
              Privacy-friendly analytics · no cookies · anonymous id
            </p>
            <button
              type="button"
              onClick={() => setChromeOpen(false)}
              aria-label="Hide published preview controls"
              title="Hide controls"
              className="flex size-5 items-center justify-center rounded-full bg-zinc-950/70 text-zinc-500 backdrop-blur transition-colors hover:text-zinc-200"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* collapsed FAB */}
        {!chromeOpen && (
          <button
            type="button"
            onClick={() => setChromeOpen(true)}
            aria-label="Show published preview controls"
            title="Show controls"
            className="pointer-events-auto absolute bottom-0 flex items-center gap-1.5 rounded-full border border-zinc-700/60 bg-zinc-950/85 py-1.5 pl-2.5 pr-3 text-[10px] font-semibold text-zinc-300 shadow-xl shadow-black/40 backdrop-blur transition-colors hover:border-violet-500/50 hover:text-violet-200"
          >
            <ChevronUp className="h-3 w-3" />
            <span className="flex size-1.5 rounded-full bg-emerald-400" aria-hidden />
            {events} tracked
          </button>
        )}
      </div>
    </div>
  )
}
