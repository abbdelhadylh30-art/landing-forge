"use client"

import * as React from "react"
import { Download, Palette, Redo2, Rocket, Save, Sparkles, Undo2, Upload, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useForge } from "@/lib/landing/store"
import { THEMES } from "@/lib/landing/themes"
import { AiGenerateDialog, AiImproveDialog, ExportYamlDialog, ImportYamlDialog } from "./Dialogs"
import { DeployDialog } from "./DeployDialog"
import { useSaveProject } from "./useSaveProject"

export function Toolbar({ onNavigateToProjects }: { onNavigateToProjects: () => void }) {
  const projectName = useForge((s) => s.project.name)
  const setProjectMeta = useForge((s) => s.setProjectMeta)
  const themeId = useForge((s) => s.config.themeId)
  const setTheme = useForge((s) => s.setTheme)
  const canUndo = useForge((s) => s.past.length > 0)
  const canRedo = useForge((s) => s.future.length > 0)
  const undo = useForge((s) => s.undo)
  const redo = useForge((s) => s.redo)
  const dirty = useForge((s) => s.dirty)
  const { save, saving, hasProject } = useSaveProject()

  const [aiOpen, setAiOpen] = React.useState(false)
  const [improveOpen, setImproveOpen] = React.useState(false)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [deployOpen, setDeployOpen] = React.useState(false)

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/80 bg-zinc-950 px-3 py-2">
      {/* Undo / redo */}
      <div className="flex items-center gap-0.5 rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-100 disabled:opacity-30" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (⌘Z)">
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-100 disabled:opacity-30" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (⇧⌘Z)">
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Project name */}
      <div className="flex min-w-0 items-center gap-1.5">
        <input
          value={projectName}
          onChange={(e) => setProjectMeta(e.target.value.slice(0, 60), useForge.getState().project.slug)}
          aria-label="Project name"
          className="w-28 min-w-0 truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-[13px] font-semibold text-zinc-100 outline-none transition-colors hover:border-zinc-700 focus:border-violet-500/60 focus:bg-zinc-900/60 sm:w-40"
        />
        {dirty && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-400" title="Unsaved changes" aria-label="Unsaved changes" />}
      </div>

      {/* Theme quick switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 border-zinc-800 bg-zinc-950 text-[11px] text-zinc-300 hover:border-violet-500/50">
            <Palette className="h-3 w-3 text-violet-300" />
            <span className="hidden sm:inline">{THEMES.find((t) => t.id === themeId)?.name ?? "Theme"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44 border-zinc-800 bg-zinc-900">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-zinc-500">One-click themes</DropdownMenuLabel>
          {THEMES.map((t) => (
            <DropdownMenuItem key={t.id} className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => setTheme(t.id)}>
              <span className="flex gap-0.5">
                {t.swatch.map((c) => (
                  <span key={c} className="h-3 w-3 rounded-[3px] border border-black/30" style={{ background: c }} />
                ))}
              </span>
              <span className="flex-1">{t.name}</span>
              {t.id === themeId && <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        {/* AI */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-7 gap-1.5 bg-violet-500 text-[11px] text-white hover:bg-violet-600">
              <Sparkles className="h-3 w-3" /> AI
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 border-zinc-800 bg-zinc-900">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-zinc-500">landing-forge AI</DropdownMenuLabel>
            <DropdownMenuItem className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => setAiOpen(true)}>
              <Sparkles className="h-3.5 w-3.5 text-violet-300" /> Generate from prompt…
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => setImproveOpen(true)}>
              <Wand2 className="h-3.5 w-3.5 text-violet-300" /> Improve copy…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Import / export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 border-zinc-800 bg-zinc-950 text-[11px] text-zinc-300 hover:border-violet-500/50">
              <Download className="h-3 w-3" />
              <span className="hidden sm:inline">YAML</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 border-zinc-800 bg-zinc-900">
            <DropdownMenuItem className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => setExportOpen(true)}>
              <Download className="h-3.5 w-3.5 text-zinc-300" /> Export YAML…
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => setImportOpen(true)}>
              <Upload className="h-3.5 w-3.5 text-zinc-300" /> Import YAML…
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={onNavigateToProjects}>
              <Save className="h-3.5 w-3.5 text-zinc-300" /> All projects…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Save */}
        <Button
          variant="outline"
          size="sm"
          className={cn("h-7 gap-1.5 border-zinc-800 bg-zinc-950 text-[11px] hover:border-violet-500/50", dirty ? "border-amber-500/40 text-amber-200" : "text-zinc-300")}
          onClick={save}
          disabled={saving || !hasProject}
          title="Save (⌘S)"
        >
          <Save className={cn("h-3 w-3", dirty && "text-amber-300")} />
          {saving ? "Saving…" : dirty ? "Save*" : "Saved"}
        </Button>

        {/* Deploy */}
        <Button size="sm" className="h-7 gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-[11px] text-white hover:from-violet-600 hover:to-fuchsia-600" onClick={() => setDeployOpen(true)} disabled={!hasProject}>
          <Rocket className="h-3 w-3" /> <span className="hidden sm:inline">Deploy</span>
        </Button>
      </div>

      {/* Dialogs */}
      <AiGenerateDialog open={aiOpen} onOpenChange={setAiOpen} />
      <AiImproveDialog open={improveOpen} onOpenChange={setImproveOpen} />
      <ExportYamlDialog open={exportOpen} onOpenChange={setExportOpen} />
      <ImportYamlDialog open={importOpen} onOpenChange={setImportOpen} />
      <DeployDialog open={deployOpen} onOpenChange={setDeployOpen} />
    </div>
  )
}

export function notifyUnsaved() {
  toast.warning("Unsaved changes", { description: "Save first (⌘S) to keep your edits." })
}
