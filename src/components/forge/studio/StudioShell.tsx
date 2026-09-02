"use client"

import * as React from "react"
import { Layers, SlidersHorizontal, SquarePen } from "lucide-react"
import { cn } from "@/lib/utils"
import { Toolbar } from "./Toolbar"
import { SectionsPanel } from "./SectionsPanel"
import { PropertiesPanel } from "./PropertiesPanel"
import { DevicePreview } from "./DevicePreview"
import { useForge } from "@/lib/landing/store"

type MobilePane = "sections" | "preview" | "properties"

export function StudioShell({ onNavigateToProjects }: { onNavigateToProjects: () => void }) {
  const [mobilePane, setMobilePane] = React.useState<MobilePane>("preview")
  const previewMode = useForge((s) => s.previewMode)

  const panes: { id: MobilePane; label: string; icon: typeof Layers }[] = [
    { id: "sections", label: "Sections", icon: Layers },
    { id: "preview", label: "Preview", icon: SquarePen },
    { id: "properties", label: "Edit", icon: SlidersHorizontal },
  ]

  // Full-screen interactive preview: no chrome at all except the preview toolbar.
  if (previewMode) {
    return <DevicePreview className="flex min-h-0 flex-1" />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Toolbar onNavigateToProjects={onNavigateToProjects} />

      {/* Mobile pane switcher */}
      <div className="flex gap-1 border-b border-zinc-800/80 bg-zinc-950 px-3 py-1.5 lg:hidden" role="tablist" aria-label="Studio panes">
        {panes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mobilePane === id}
            onClick={() => setMobilePane(id)}
            className={cn(
              "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-[11px] font-medium transition-colors",
              mobilePane === id ? "bg-violet-500/20 text-violet-200" : "text-zinc-500 hover:text-zinc-200"
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <SectionsPanel
          className={cn(
            "w-full shrink-0 border-r border-zinc-800/80 lg:flex lg:w-60 xl:w-64",
            mobilePane === "sections" ? "flex" : "hidden"
          )}
        />
        <DevicePreview className={cn("min-w-0 flex-1", mobilePane === "preview" ? "flex" : "hidden lg:flex")} />
        <PropertiesPanel
          className={cn(
            "w-full shrink-0 border-l border-zinc-800/80 xl:flex xl:w-80",
            mobilePane === "properties" ? "flex" : "hidden xl:flex"
          )}
        />
      </div>
    </div>
  )
}
