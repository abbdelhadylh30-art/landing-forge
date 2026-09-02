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
  abOverride?: { headline: string; sub: string; ctaLabel: string } | null
  onCtaClick?: (section: Section, label: string) => void
  onFormSubmit?: (section: Section, data: Record<string, string>) => void
}

/**
 * Renders a single landing section by its discriminated `type`.
 * Hidden sections render nothing.
 */
export function SectionRenderer({ section, brandName, abOverride, onCtaClick, onFormSubmit }: SectionRendererProps) {
  if (section.hidden) return null

  switch (section.type) {
    case "navbar":
      return <Navbar section={section} brandName={brandName} onCtaClick={(label) => onCtaClick?.(section, label)} />
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
    case "features":
      return <Features section={section} />
    case "stats":
      return <Stats section={section} />
    case "testimonials":
      return <Testimonials section={section} />
    case "pricing":
      return (
        <Pricing
          section={section}
          onCtaClick={(label, planName) => onCtaClick?.(section, `${planName}: ${label}`)}
        />
      )
    case "faq":
      return <Faq section={section} />
    case "gallery":
      return <Gallery section={section} />
    case "contact":
      return <Contact section={section} onFormSubmit={(data) => onFormSubmit?.(section, data)} />
    case "cta-final":
      return <CtaFinal section={section} onCtaClick={(label) => onCtaClick?.(section, label)} />
    case "footer":
      return <Footer section={section} brandName={brandName} onCtaClick={(label) => onCtaClick?.(section, label)} />
    default:
      return null
  }
}
