"use client"

import type { Section } from "@/lib/landing/types"

import { Contact } from "./sections/Contact"
import { CtaFinal } from "./sections/CtaFinal"
import { Faq } from "./sections/Faq"
import { Features } from "./sections/Features"
import { Footer } from "./sections/Footer"
import { Gallery } from "./sections/Gallery"
import { Hero } from "./sections/Hero"
import { Logos } from "./sections/Logos"
import { Navbar } from "./sections/Navbar"
import { Pricing } from "./sections/Pricing"
import { Stats } from "./sections/Stats"
import { Testimonials } from "./sections/Testimonials"

export interface SectionRendererProps {
  section: Section
  brandName: string
  /** brand logo URL (brand kit) — rendered by navbar & footer when present */
  brandLogo?: string
  /** Resolved A/B variant copy for THIS section (empty fields already fell back to base copy). */
  abOverride?: { headline: string; sub: string; ctaLabel: string } | null
  onCtaClick?: (section: Section, label: string) => void
  onFormSubmit?: (section: Section, data: Record<string, string>) => void
}

/**
 * Renders a single landing section by its discriminated `type`.
 * Hidden sections render nothing. When an A/B variant is active for this
 * section, its copy overrides are merged INTO the section object before
 * dispatch — section components stay variant-agnostic.
 */
export function SectionRenderer({ section, brandName, brandLogo, abOverride, onCtaClick, onFormSubmit }: SectionRendererProps) {
  if (section.hidden) return null

  switch (section.type) {
    case "navbar":
      return <Navbar section={section} brandName={brandName} logoUrl={brandLogo} onCtaClick={(label) => onCtaClick?.(section, label)} />
    case "hero":
      return (
        <Hero
          section={section}
          brandName={brandName}
          abOverride={abOverride}
          onCtaClick={(label) => onCtaClick?.(section, label)}
        />
      )
    case "logos":
      return <Logos section={section} />
    case "features": {
      const s = abOverride
        ? { ...section, ...(abOverride.headline ? { title: abOverride.headline } : {}), ...(abOverride.sub ? { subtitle: abOverride.sub } : {}) }
        : section
      return <Features section={s} />
    }
    case "stats":
      return <Stats section={section} />
    case "testimonials": {
      const s = abOverride
        ? { ...section, ...(abOverride.headline ? { title: abOverride.headline } : {}), ...(abOverride.sub ? { subtitle: abOverride.sub } : {}) }
        : section
      return <Testimonials section={s} />
    }
    case "pricing": {
      const s = abOverride
        ? { ...section, ...(abOverride.headline ? { title: abOverride.headline } : {}), ...(abOverride.sub ? { subtitle: abOverride.sub } : {}) }
        : section
      return (
        <Pricing
          section={s}
          onCtaClick={(label, planName) => onCtaClick?.(section, `${planName}: ${label}`)}
        />
      )
    }
    case "faq": {
      const s = abOverride
        ? { ...section, ...(abOverride.headline ? { title: abOverride.headline } : {}), ...(abOverride.sub ? { subtitle: abOverride.sub } : {}) }
        : section
      return <Faq section={s} />
    }
    case "gallery":
      return <Gallery section={section} />
    case "contact": {
      const s = abOverride
        ? {
            ...section,
            ...(abOverride.headline ? { title: abOverride.headline } : {}),
            ...(abOverride.sub ? { subtitle: abOverride.sub } : {}),
            ...(abOverride.ctaLabel ? { submitLabel: abOverride.ctaLabel } : {}),
          }
        : section
      return <Contact section={s} onFormSubmit={(data) => onFormSubmit?.(section, data)} />
    }
    case "cta-final": {
      const s = abOverride
        ? {
            ...section,
            headline: abOverride.headline,
            ...(abOverride.sub ? { sub: abOverride.sub } : {}),
            ...(abOverride.ctaLabel ? { cta: { ...section.cta, label: abOverride.ctaLabel } } : {}),
          }
        : section
      return <CtaFinal section={s} onCtaClick={(label) => onCtaClick?.(section, label)} />
    }
    case "footer":
      return <Footer section={section} brandName={brandName} logoUrl={brandLogo} onCtaClick={(label) => onCtaClick?.(section, label)} />
    default:
      return null
  }
}
