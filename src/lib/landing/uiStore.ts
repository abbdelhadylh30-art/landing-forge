"use client"

import { create } from "zustand"

export type AppView = "studio" | "analytics" | "projects"

export type DialogId =
  | "ai-generate"
  | "ai-improve"
  | "export-yaml"
  | "import-yaml"
  | "deploy"
  | "readiness"
  | "shortcuts"
  | null

interface UiState {
  view: AppView
  dialog: DialogId
  commandOpen: boolean

  setView: (v: AppView) => void
  openDialog: (d: Exclude<DialogId, null>) => void
  closeDialog: () => void
  setCommandOpen: (v: boolean) => void
}

/** Cross-component UI state: active view + which global dialog is open + ⌘K palette. */
export const useUi = create<UiState>((set) => ({
  view: "studio",
  dialog: null,
  commandOpen: false,

  setView: (view) => set({ view, dialog: null }),
  openDialog: (dialog) => set({ dialog, commandOpen: false }),
  closeDialog: () => set({ dialog: null }),
  setCommandOpen: (commandOpen) => set({ commandOpen, dialog: null }),
}))
