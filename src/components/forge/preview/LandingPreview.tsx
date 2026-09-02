"use client"

import type { HeroSection, LandingConfig, Section } from "@/lib/landing/types"
import { SECTION_META } from "@/lib/landing/types"

import { themeStyle } from "@/lib/landing/themes"

import { cn } from "@/lib/utils"

import { SectionRenderer } from "./SectionRenderer"

export interface LandingPreviewProps {
  config: LandingConfig
  /** Forced A/B variant name (e.g. "A" | "B") used to preview the hero. */
  abVariant?: string | null
  onCtaClick?: (section: Section, label: string) => void
  onFormSubmit?: (section: Section, data: Record<string, string>) => void
  className?: string
  /** Studio edit mode: sections get click-to-select overlays and in-page interactions are disabled. */
  selectionMode?: boolean
  selectedSectionId?: string | null
  onSectionSelect?: (id: string) => void
}

/**
 * Root preview renderer: applies the theme CSS variables to a wrapper
 * and renders every visible section. The navbar is rendered without the
 * alternating band wrapper so its `position: sticky` works against the
 * full page height (a wrapper would clip the sticky range) — except in
 * selection mode, where the wrapper is needed for the select overlay.
 */
export function LandingPreview({
  config,
  abVariant,
  onCtaClick,
  onFormSubmit,
  className,
  selectionMode = false,
  selectedSectionId = null,
  onSectionSelect,
}: LandingPreviewProps) {
  const hero = config.sections.find((s): s is HeroSection => s.type === "hero" && s.ab?.enabled === true)
  const ab = hero?.ab
  const variant = ab && abVariant ? ab.variants.find((v) => v.name === abVariant) : undefined
  const abOverride =
    hero && variant
      ? {
          headline: variant.headline,
          sub: variant.sub ?? hero.sub,
          ctaLabel: variant.ctaLabel ?? hero.cta.label,
        }
      : null

  const visible = config.sections.filter((s) => !s.hidden)

  const SelectOverlay = ({ section }: { section: Section }) => (
    <button
      type="button"
      aria-label={`Select ${SECTION_META[section.type].label} section`}
      onClick={(e) => {
        e.stopPropagation()
        onSectionSelect?.(section.id)
      }}
      className="absolute inset-0 z-30 block cursor-pointer rounded-[2px]"
      style={{
        outline: selectedSectionId === section.id ? "2px solid var(--lf-accent)" : "1px dashed transparent",
        outlineOffset: "-2px",
        transition: "outline-color 120ms ease",
      }}
      onMouseEnter={(e) => {
        if (selectedSectionId !== section.id) e.currentTarget.style.outlineColor = "var(--lf-accent)"
        ;(e.currentTarget as HTMLElement).style.outlineStyle = "solid"
        if (selectedSectionId !== section.id) e.currentTarget.style.outlineWidth = "1px"
      }}
      onMouseLeave={(e) => {
        if (selectedSectionId !== section.id) {
          e.currentTarget.style.outlineColor = "transparent"
          e.currentTarget.style.outlineStyle = "dashed"
          e.currentTarget.style.outlineWidth = "1px"
        } else {
          e.currentTarget.style.outlineWidth = "2px"
        }
      }}
    >
      {selectedSectionId === section.id && (
        <span
          className="absolute left-3 top-3 z-40 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ background: "var(--lf-accent)", color: "var(--lf-accent-contrast)" }}
        >
          {SECTION_META[section.type].label}
        </span>
      )}
    </button>
  )

  return (
    <div
      style={themeStyle(config.themeId)}
      className={cn("w-full min-h-full font-sans", selectionMode && "select-none", className)}
    >
      {visible.map((section, i) => {
        if (section.type === "navbar") {
          if (selectionMode) {
            return (
              <div key={section.id} className="relative">
                <div className="pointer-events-none">
                  <SectionRenderer
                    section={section}
                    brandName={config.brand.name}
                    abOverride={abOverride}
                    onCtaClick={onCtaClick}
                    onFormSubmit={onFormSubmit}
                  />
                </div>
                <SelectOverlay section={section} />
              </div>
            )
          }
          return (
            <SectionRenderer
              key={section.id}
              section={section}
              brandName={config.brand.name}
              abOverride={abOverride}
              onCtaClick={onCtaClick}
              onFormSubmit={onFormSubmit}
            />
          )
        }
        // band index = number of content (non-navbar) sections before this one
        const band = visible.slice(0, i).filter((s) => s.type !== "navbar").length % 2
        const bg = band === 0 ? "var(--lf-bg)" : "var(--lf-bg-alt)"
        return (
          <div key={section.id} style={{ background: bg }} className={selectionMode ? "relative" : undefined}>
            <div className={selectionMode ? "pointer-events-none" : undefined}>
              <SectionRenderer
                section={section}
                brandName={config.brand.name}
                abOverride={abOverride}
                onCtaClick={onCtaClick}
                onFormSubmit={onFormSubmit}
              />
            </div>
            {selectionMode && <SelectOverlay section={section} />}
          </div>
        )
      })}
    </div>
  )
}

export default LandingPreview
