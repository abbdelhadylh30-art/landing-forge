"use client"

import { create } from "zustand"
import type { DeviceType, LandingConfig, Section, SectionType, ThemeId } from "./types"
import { createSection } from "./defaults"

export interface ProjectMeta {
  id: string | null
  name: string
  slug: string
}

interface ForgeState {
  // project
  project: ProjectMeta
  config: LandingConfig
  dirty: boolean
  saving: boolean

  // studio ui state
  selectedSectionId: string | null
  device: DeviceType
  abPreviewVariant: string | null // which A/B variant is force-shown in preview
  previewMode: boolean // full-screen preview (no editing chrome)
  lastTrackedView: number

  // history
  past: LandingConfig[]
  future: LandingConfig[]

  // actions
  loadProject: (id: string, name: string, slug: string, config: LandingConfig) => void
  setProjectMeta: (name: string, slug: string) => void
  markSaved: () => void
  setSaving: (v: boolean) => void

  setConfig: (next: LandingConfig, opts?: { silent?: boolean }) => void
  updateSection: (id: string, patch: Partial<Section>) => void
  addSection: (type: SectionType, atIndex?: number) => string
  removeSection: (id: string) => void
  duplicateSection: (id: string) => void
  moveSection: (from: number, to: number) => void
  toggleHidden: (id: string) => void

  selectSection: (id: string | null) => void
  setDevice: (d: DeviceType) => void
  setAbPreviewVariant: (v: string | null) => void
  setPreviewMode: (v: boolean) => void
  markViewTracked: () => void

  setTheme: (t: ThemeId) => void
  updateBrand: (patch: Partial<LandingConfig["brand"]>) => void
  updateSeo: (patch: Partial<LandingConfig["seo"]>) => void

  undo: () => void
  redo: () => void
}

const MAX_HISTORY = 60

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T
}

function pushHistory(state: ForgeState): { past: LandingConfig[]; future: LandingConfig[] } {
  return {
    past: [...state.past, clone(state.config)].slice(-MAX_HISTORY),
    future: [],
  }
}

export const useForge = create<ForgeState>((set, get) => ({
  project: { id: null, name: "Untitled Project", slug: "untitled-project" },
  config: {
    version: 1,
    brand: { name: "MyProduct", tagline: "Ship beautiful pages in minutes" },
    themeId: "nebula",
    seo: { title: "MyProduct — Ship faster", description: "" },
    sections: [],
  },
  dirty: false,
  saving: false,

  selectedSectionId: null,
  device: "desktop",
  abPreviewVariant: null,
  previewMode: false,
  lastTrackedView: 0,

  past: [],
  future: [],

  loadProject: (id, name, slug, config) =>
    set({
      project: { id, name, slug },
      config: clone(config),
      dirty: false,
      past: [],
      future: [],
      selectedSectionId: config.sections[0]?.id ?? null,
      abPreviewVariant: null,
    }),

  setProjectMeta: (name, slug) =>
    set((s) => ({ project: { ...s.project, name, slug }, dirty: true })),
  markSaved: () => set({ dirty: false }),
  setSaving: (v) => set({ saving: v }),

  setConfig: (next, opts) =>
    set((s) => ({
      ...(opts?.silent ? {} : pushHistory(s)),
      config: clone(next),
      dirty: true,
    })),

  updateSection: (id, patch) =>
    set((s) => {
      const next = clone(s.config)
      const idx = next.sections.findIndex((x) => x.id === id)
      if (idx === -1) return {}
      next.sections[idx] = { ...next.sections[idx], ...patch } as Section
      return { ...pushHistory(s), config: next, dirty: true }
    }),

  addSection: (type, atIndex) => {
    const sec = createSection(type)
    set((s) => {
      const next = clone(s.config)
      const insertAt = atIndex ?? next.sections.length
      // keep footer-ish sections near the end is nice, but respect explicit index
      next.sections.splice(insertAt, 0, sec)
      return { ...pushHistory(s), config: next, dirty: true, selectedSectionId: sec.id }
    })
    return sec.id
  },

  removeSection: (id) =>
    set((s) => {
      const next = clone(s.config)
      const idx = next.sections.findIndex((x) => x.id === id)
      if (idx === -1) return {}
      next.sections.splice(idx, 1)
      const nextSel =
        s.selectedSectionId === id ? (next.sections[Math.min(idx, next.sections.length - 1)]?.id ?? null) : s.selectedSectionId
      return { ...pushHistory(s), config: next, dirty: true, selectedSectionId: nextSel }
    }),

  duplicateSection: (id) =>
    set((s) => {
      const next = clone(s.config)
      const idx = next.sections.findIndex((x) => x.id === id)
      if (idx === -1) return {}
      const copy = clone(next.sections[idx])
      copy.id = `${copy.id}-copy-${Math.random().toString(36).slice(2, 6)}`
      if (copy.type === "hero" && copy.ab?.variants) {
        copy.ab = { ...copy.ab, enabled: false }
      }
      next.sections.splice(idx + 1, 0, copy)
      return { ...pushHistory(s), config: next, dirty: true, selectedSectionId: copy.id }
    }),

  moveSection: (from, to) =>
    set((s) => {
      const next = clone(s.config)
      if (from < 0 || from >= next.sections.length || to < 0 || to >= next.sections.length) return {}
      const [moved] = next.sections.splice(from, 1)
      next.sections.splice(to, 0, moved)
      return { ...pushHistory(s), config: next, dirty: true }
    }),

  toggleHidden: (id) =>
    set((s) => {
      const next = clone(s.config)
      const idx = next.sections.findIndex((x) => x.id === id)
      if (idx === -1) return {}
      next.sections[idx].hidden = !next.sections[idx].hidden
      return { ...pushHistory(s), config: next, dirty: true }
    }),

  selectSection: (id) => set({ selectedSectionId: id }),
  setDevice: (d) => set({ device: d }),
  setAbPreviewVariant: (v) => set({ abPreviewVariant: v }),
  setPreviewMode: (v) => set({ previewMode: v }),
  markViewTracked: () => set({ lastTrackedView: Date.now() }),

  setTheme: (t) =>
    set((s) => {
      const next = clone(s.config)
      next.themeId = t
      return { ...pushHistory(s), config: next, dirty: true }
    }),

  updateBrand: (patch) =>
    set((s) => {
      const next = clone(s.config)
      next.brand = { ...next.brand, ...patch }
      return { ...pushHistory(s), config: next, dirty: true }
    }),

  updateSeo: (patch) =>
    set((s) => {
      const next = clone(s.config)
      next.seo = { ...next.seo, ...patch }
      return { ...pushHistory(s), config: next, dirty: true }
    }),

  undo: () =>
    set((s) => {
      if (!s.past.length) return {}
      const past = [...s.past]
      const prev = past.pop() as LandingConfig
      return { config: prev, past, future: [clone(s.config), ...s.future].slice(0, MAX_HISTORY), dirty: true }
    }),

  redo: () =>
    set((s) => {
      if (!s.future.length) return {}
      const [next, ...rest] = s.future
      return {
        config: next,
        past: [...s.past, clone(s.config)].slice(-MAX_HISTORY),
        future: rest,
        dirty: true,
      }
    }),
}))

/** Get the effective hero content when an A/B variant is force-selected in preview */
export function abResolvedHero(hero: {
  headline: string
  sub: string
  cta: { label: string; href: string }
  ab?: { enabled: boolean; variants: { name: string; headline: string; sub?: string; ctaLabel?: string; weight: number }[] }
}, variantName: string | null) {
  if (!hero.ab?.enabled || !variantName) return { headline: hero.headline, sub: hero.sub, ctaLabel: hero.cta.label }
  const v = hero.ab.variants.find((x) => x.name === variantName)
  if (!v) return { headline: hero.headline, sub: hero.sub, ctaLabel: hero.cta.label }
  return {
    headline: v.headline || hero.headline,
    sub: v.sub || hero.sub,
    ctaLabel: v.ctaLabel || hero.cta.label,
  }
}
