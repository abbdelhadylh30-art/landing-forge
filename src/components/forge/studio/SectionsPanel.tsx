"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Copy, Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useForge } from "@/lib/landing/store"
import { SECTION_META, SECTION_TYPES } from "@/lib/landing/types"
import type { Section } from "@/lib/landing/types"

function SortableRow({ section, index }: { section: Section; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const selectedId = useForge((s) => s.selectedSectionId)
  const selectSection = useForge((s) => s.selectSection)
  const removeSection = useForge((s) => s.removeSection)
  const duplicateSection = useForge((s) => s.duplicateSection)
  const toggleHidden = useForge((s) => s.toggleHidden)
  const selected = selectedId === section.id
  const meta = SECTION_META[section.type]

  const layoutInfo =
    section.type === "hero"
      ? section.layout
      : section.type === "features"
        ? section.style
        : section.type === "testimonials"
          ? section.style
          : section.type === "faq"
            ? section.style
            : section.type === "gallery"
              ? section.style
              : section.type === "footer"
                ? section.style
                : null

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative lf-fade-up-stagger rounded-lg border px-1.5 py-1.5 transition-colors",
        selected ? "border-violet-500/60 bg-violet-500/10" : "border-zinc-800/80 bg-zinc-900/40 hover:border-violet-500/30 hover:bg-zinc-900/60",
        section.hidden && "opacity-45",
        isDragging && "z-50 shadow-lg shadow-black/50 ring-2 ring-violet-500/60"
      )}
    >
      {/* Entrance animation targets the row CONTENT, not this node: a fill-mode-both animation
          here would override dnd-kit's inline transform while dragging, and this node's
          parentElement is the drag boundary for restrictToParentElement. */}
      <div className="flex items-center gap-1.5" style={{ animationDelay: `${Math.min(index * 30, 400)}ms` }}>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => selectSection(section.id)}
          aria-label={`Select ${meta.label} section`}
        >
          <span
            {...attributes}
            {...listeners}
            role="button"
            aria-label={`Drag to reorder ${meta.label}`}
            className="cursor-grab touch-none rounded p-0.5 text-zinc-600 hover:text-zinc-300 active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm leading-none">{meta.icon}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-medium leading-tight text-zinc-100">
              {index + 1}. {meta.label}
            </span>
            {layoutInfo && <span className="block truncate font-mono text-[9px] leading-tight text-zinc-500">{layoutInfo}</span>}
          </span>
        </button>
        <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-500 transition-colors hover:text-zinc-200"
            onClick={() => toggleHidden(section.id)}
            aria-label={section.hidden ? "Show section" : "Hide section"}
            title={section.hidden ? "Show" : "Hide"}
          >
            {section.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 transition-colors hover:text-zinc-200" onClick={() => duplicateSection(section.id)} aria-label="Duplicate section" title="Duplicate">
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 border border-transparent text-zinc-500 transition-colors hover:border-rose-500/40 hover:text-rose-300" onClick={() => removeSection(section.id)} aria-label="Delete section" title="Delete">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SectionsPanel({ className }: { className?: string }) {
  const sections = useForge((s) => s.config.sections)
  const moveSection = useForge((s) => s.moveSection)
  const addSection = useForge((s) => s.addSection)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = sections.findIndex((s) => s.id === active.id)
    const to = sections.findIndex((s) => s.id === over.id)
    if (from !== -1 && to !== -1) moveSection(from, to)
  }

  return (
    <div className={cn("flex min-h-0 flex-col bg-zinc-950", className)}>
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Sections</p>
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300">
            {sections.length} {sections.length === 1 ? "section" : "sections"}
          </span>
        </div>
        <span className="text-[10px] text-zinc-600">drag to reorder</span>
      </div>
      <div className="lf-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={onDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {sections.map((section, i) => (
                <SortableRow key={section.id} section={section} index={i} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {sections.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-800 p-4 text-center">
            <p className="text-[12px] text-zinc-500">No sections yet. Add your first one below.</p>
          </div>
        )}
      </div>
      <div className="border-t border-zinc-900 p-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-full border-dashed border-zinc-700 bg-transparent text-[12px] text-zinc-300 hover:border-violet-500/60 hover:text-violet-200">
              <Plus className="mr-1 h-3.5 w-3.5" /> Add section
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 border-zinc-800 bg-zinc-900 text-zinc-100">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-zinc-500">30+ layout templates inside</DropdownMenuLabel>
            {SECTION_TYPES.map((t) => (
              <DropdownMenuItem
                key={t}
                className="gap-2.5 py-2 text-[12px] focus:bg-violet-500/20"
                onClick={() => addSection(t)}
              >
                <span className="text-base leading-none">{SECTION_META[t].icon}</span>
                <span className="flex-1">
                  <span className="block font-medium">{SECTION_META[t].label}</span>
                  <span className="block text-[10px] text-zinc-500">{SECTION_META[t].description}</span>
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-zinc-800" />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
