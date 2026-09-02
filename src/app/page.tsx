"use client"

import * as React from "react"
import Link from "next/link"
import { BarChart3, ExternalLink, FolderOpen, Gauge, Hammer, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useForge } from "@/lib/landing/store"
import { useUi } from "@/lib/landing/uiStore"
import { auditConfig } from "@/lib/landing/readiness"
import { TEMPLATES } from "@/lib/landing/defaults"
import { StudioShell } from "@/components/forge/studio/StudioShell"
import { DashboardView } from "@/components/forge/dashboard/DashboardView"
import { ProjectsView } from "@/components/forge/projects/ProjectsView"
import { useSaveProject } from "@/components/forge/studio/useSaveProject"
import { CommandPalette, ShortcutsDialog } from "@/components/forge/studio/CommandPalette"
import { ReadinessDialog } from "@/components/forge/studio/ReadinessPanel"
import { AiGenerateDialog, AiImproveDialog, ExportYamlDialog, ImportYamlDialog, ExportHtmlDialog } from "@/components/forge/studio/Dialogs"
import { DeployDialog } from "@/components/forge/studio/DeployDialog"
import { toast } from "sonner"
import type { ProjectSummary, ProjectWithConfig } from "@/lib/landing/types"

type View = "studio" | "analytics" | "projects"

const VIEWS: { id: View; label: string; icon: typeof Hammer }[] = [
  { id: "studio", label: "Studio", icon: Hammer },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "projects", label: "Projects", icon: FolderOpen },
]

export default function Home() {
  const view = useUi((s) => s.view)
  const setView = useUi((s) => s.setView)
  const [booting, setBooting] = React.useState(true)
  const loadProject = useForge((s) => s.loadProject)
  const dirty = useForge((s) => s.dirty)
  const config = useForge((s) => s.config)
  const projectId = useForge((s) => s.project.id)
  const { save } = useSaveProject()
  const saving = useForge((s) => s.saving)
  const report = React.useMemo(() => auditConfig(config), [config])

  // ── Bootstrap: load last project or create the demo project ──────────────
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const listRes = await fetch("/api/projects")
        const list = (await listRes.json()) as ProjectSummary[]
        let target: ProjectSummary | undefined = Array.isArray(list) ? list[0] : undefined

        if (!target) {
          // First run: create the demo project with A/B testing enabled
          const config = TEMPLATES[0].build()
          const hero = config.sections.find((s) => s.type === "hero")
          if (hero && hero.type === "hero" && hero.ab) hero.ab = { ...hero.ab, enabled: true, sampleSize: 500 }
          const createRes = await fetch("/api/projects", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: "Vertex", config }),
          })
          const created = (await createRes.json()) as ProjectWithConfig & { error?: string }
          if (!createRes.ok || !created.id) throw new Error(created.error ?? "Could not create demo project")
          target = created
          void fetch("/api/analytics/seed", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ projectId: created.id, days: 30 }),
          })
        }

        const full = await fetch(`/api/projects/${target.id}`)
        const project = (await full.json()) as ProjectWithConfig
        if (!cancelled) {
          loadProject(project.id, project.name, project.slug, project.config)
          toast.success(`Welcome to landing-forge studio ⚒️`, { description: `Loaded “${project.name}” — drag, edit, deploy.` })
        }
      } catch (e) {
        if (!cancelled) toast.error("Startup failed", { description: e instanceof Error ? e.message : undefined })
      } finally {
        if (!cancelled) setBooting(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadProject])

  // ── ⌘S / Ctrl+S saves ────────────────────────────────────────────────────
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        void save()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [save])

  // ── Autosave: 3s after the last edit (debounced), save silently ──────────
  // `save` is re-created on each store change, which re-arms the timer —
  // i.e. this is a true debounce over editing activity. Manual ⌘S keeps its
  // confirmation toast; autosave is quiet and only updates the indicator.
  React.useEffect(() => {
    if (!dirty || !projectId || saving) return
    const timer = setTimeout(() => {
      void save({ silent: true })
    }, 3000)
    return () => clearTimeout(timer)
  }, [dirty, saving, save, projectId])

  // ── Warn on unsaved exit ─────────────────────────────────────────────────
  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      {/* App bar */}
      <header className="relative z-40 flex shrink-0 items-center gap-3 border-b border-zinc-800/80 bg-zinc-950 px-3 py-2 sm:px-4">
        <Link href="https://github.com/kasimmj/landing-forge" target="_blank" rel="noreferrer" className="flex items-center gap-2.5" aria-label="landing-forge on GitHub">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25 transition-transform hover:scale-105">
            <Hammer className="h-4 w-4 text-white" />
          </span>
          <span className="hidden text-[13px] font-extrabold tracking-tight sm:inline">
            landing-forge <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">studio</span>
          </span>
        </Link>

        {/* View switcher */}
        <nav className="mx-auto flex items-center gap-0.5 rounded-lg border border-zinc-800 bg-zinc-900/60 p-0.5" aria-label="Views">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              aria-current={view === id ? "page" : undefined}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition-all sm:px-3",
                view === id
                  ? "bg-violet-500/25 text-violet-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-zinc-500 hover:text-zinc-200"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {dirty && <span className="hidden text-[10px] text-amber-300/80 md:inline">unsaved</span>}
          {/* Global readiness hint (non-studio views) */}
          {view !== "studio" && !booting && (
            <button
              type="button"
              onClick={() => setView("studio")}
              title="Open readiness audit in Studio"
              className="hidden items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[10px] font-semibold text-zinc-400 transition-colors hover:border-violet-500/40 hover:text-zinc-200 md:flex"
            >
              <Gauge className="h-3 w-3" style={{ color: report.score >= 90 ? "#34d399" : report.score >= 75 ? "#a3e635" : report.score >= 60 ? "#fbbf24" : "#fb7185" }} />
              <span className="tabular-nums">{report.score}</span>
              <span className="text-zinc-600">/ 100</span>
            </button>
          )}
          <span className="hidden rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[9px] text-zinc-500 md:inline">v0.1.0</span>
          <Link
            href="https://github.com/kasimmj/landing-forge"
            target="_blank"
            rel="noreferrer"
            className="flex h-7 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 text-[11px] text-zinc-300 transition-colors hover:border-violet-500/50 hover:text-violet-200"
          >
            <ExternalLink className="h-3 w-3" /> <span className="hidden sm:inline">GitHub</span>
          </Link>
        </div>
      </header>

      {/* Views */}
      {booting ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-950">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
            <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/20" aria-hidden />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-semibold text-zinc-200">Forging the studio…</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">Creating demo project & analytics</p>
          </div>
        </div>
      ) : (
        <>
          {view === "studio" && <StudioShell />}
          {view === "analytics" && <DashboardView />}
          {view === "projects" && <ProjectsView onOpenProject={() => setView("studio")} />}
        </>
      )}

      {/* Global dialogs (open state shared via uiStore — reachable from toolbar, ⌘K palette, hotkeys) */}
      <AiGenerateDialog />
      <AiImproveDialog />
      <ExportYamlDialog />
      <ImportYamlDialog />
      <ExportHtmlDialog />
      <DeployDialog />
      <ReadinessDialog />
      <ShortcutsDialog />
      <CommandPalette />

      {/* subtle grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(167,139,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  )
}
