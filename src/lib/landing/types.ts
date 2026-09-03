// ─────────────────────────────────────────────────────────────────────────────
// Landing Forge — shared landing page config types (single source of truth)
// ─────────────────────────────────────────────────────────────────────────────

export type DeviceType = "desktop" | "tablet" | "mobile"
export type ThemeId = "nebula" | "ember" | "emerald" | "rose" | "mono" | "paper"

export interface Cta {
  label: string
  href: string
}

// ── A/B testing ──────────────────────────────────────────────────────────────
export interface AbVariant {
  id: string
  name: string // "A" | "B" | "C"...
  headline: string
  sub?: string
  ctaLabel?: string
  weight: number // percent, should total 100
}

export interface AbConfig {
  enabled: boolean
  metric: string // e.g. "cta_click"
  autoWinner: boolean
  sampleSize: number
  variants: AbVariant[]
}

/** Section types that support their own A/B test (variants override title/headline + sub + CTA label). */
export const AB_SECTION_TYPES = ["hero", "features", "testimonials", "pricing", "faq", "contact", "cta-final"] as const
export type AbSectionType = (typeof AB_SECTION_TYPES)[number]

// ── Sections ─────────────────────────────────────────────────────────────────
export interface NavbarSection {
  id: string
  type: "navbar"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  brandLabel?: string // override brand name
  links: { label: string; href: string }[]
  cta?: Cta
}

export interface HeroSection {
  id: string
  type: "hero"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  layout: "split-right" | "split-left" | "center" | "full-bleed"
  badge?: string
  headline: string
  sub: string
  cta: Cta
  secondaryCta?: Cta
  image?: string // url or empty
  stats?: { value: string; label: string }[]
  /** sticky mobile CTA bar on the published page (default ON when undefined) */
  stickyCta?: boolean
  ab?: AbConfig
}

export interface LogosSection {
  id: string
  type: "logos"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  title?: string
  items: string[] // company names rendered as wordmark-styled text
}

export interface FeatureItem {
  icon: string // emoji
  title: string
  body: string
}

export interface FeaturesSection {
  id: string
  type: "features"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  title?: string
  subtitle?: string
  style: "grid" | "alternating" | "bento" | "tabs" | "carousel"
  columns?: number // 2 | 3 | 4 for grid
  items: FeatureItem[]
  ab?: AbConfig
}

export interface StatsItem {
  value: string
  label: string
  delta?: string // "+12% this quarter"
}

export interface StatsSection {
  id: string
  type: "stats"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  title?: string
  items: StatsItem[]
}

export interface TestimonialItem {
  quote: string
  author: string
  role: string
  initials?: string
  rating?: number // 1-5
}

export interface TestimonialsSection {
  id: string
  type: "testimonials"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  title?: string
  subtitle?: string
  style: "grid" | "marquee" | "spotlight" | "video" | "logo-wall"
  items: TestimonialItem[]
  ab?: AbConfig
}

export interface PricingPlan {
  name: string
  price: string
  period?: string
  description?: string
  features: string[]
  highlighted?: boolean
  ctaLabel?: string
}

export interface PricingSection {
  id: string
  type: "pricing"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  title?: string
  subtitle?: string
  annualToggle?: boolean
  annualDiscountLabel?: string
  plans: PricingPlan[]
  ab?: AbConfig
}

export interface FaqItem {
  q: string
  a: string
}

export interface FaqSection {
  id: string
  type: "faq"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  title?: string
  subtitle?: string
  style: "accordion" | "twocol"
  items: FaqItem[]
  ab?: AbConfig
}

export interface GalleryItem {
  src?: string // url
  alt: string
  hue?: string // css hue used for generated placeholder art
  caption?: string
}

export interface GallerySection {
  id: string
  type: "gallery"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  title?: string
  subtitle?: string
  style: "masonry" | "carousel"
  items: GalleryItem[]
}

export interface ContactSection {
  id: string
  type: "contact"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  title?: string
  subtitle?: string
  email?: string
  phone?: string
  fields: string[] // labels of inputs to render
  submitLabel: string
  ab?: AbConfig
}

export interface CtaFinalSection {
  id: string
  type: "cta-final"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  headline: string
  sub?: string
  cta: Cta
  note?: string
  ab?: AbConfig
}

export interface FooterLinkGroup {
  group: string
  items: { label: string; href: string }[]
}

export interface FooterSection {
  id: string
  type: "footer"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  style: "minimal" | "mega" | "newsletter"
  tagline?: string
  linkGroups: FooterLinkGroup[]
  social?: string[] // labels e.g. ["X", "GitHub", "Discord"]
  copyright?: string
}

export type Section =
  | NavbarSection
  | HeroSection
  | LogosSection
  | FeaturesSection
  | StatsSection
  | TestimonialsSection
  | PricingSection
  | FaqSection
  | GallerySection
  | ContactSection
  | CtaFinalSection
  | FooterSection

export type SectionType = Section["type"]

export const SECTION_TYPES: SectionType[] = [
  "navbar",
  "hero",
  "logos",
  "features",
  "stats",
  "testimonials",
  "pricing",
  "faq",
  "gallery",
  "contact",
  "cta-final",
  "footer",
]

export const SECTION_META: Record<SectionType, { label: string; icon: string; description: string }> = {
  navbar: { label: "Navbar", icon: "🧭", description: "Sticky top navigation with brand + CTA" },
  hero: { label: "Hero", icon: "✨", description: "Big headline, sub copy, CTAs, image" },
  logos: { label: "Logo Wall", icon: "🏢", description: "Trusted-by company strip" },
  features: { label: "Features", icon: "⚡", description: "Icon grid / bento / alternating" },
  stats: { label: "Stats", icon: "📊", description: "Big numbers with labels" },
  testimonials: { label: "Testimonials", icon: "💬", description: "Quotes — grid, marquee, spotlight, video, logo-wall" },
  pricing: { label: "Pricing", icon: "💳", description: "Plans with annual toggle" },
  faq: { label: "FAQ", icon: "❓", description: "Accordion or two-column Q&A" },
  gallery: { label: "Gallery", icon: "🖼️", description: "Masonry or carousel visuals" },
  contact: { label: "Contact", icon: "📮", description: "Contact form + details" },
  "cta-final": { label: "Final CTA", icon: "🚀", description: "Closing call-to-action banner" },
  footer: { label: "Footer", icon: "🧱", description: "Links, social, newsletter" },
}

// ── Root config ──────────────────────────────────────────────────────────────
export interface LandingConfig {
  version: 1
  brand: {
    name: string
    tagline?: string
    /** brand logo shown in the navbar / footer (URL — upload, library or AI) */
    logoUrl?: string
    /** custom accent hex — overrides the theme's accent (and derived tints) */
    accent?: string
    /** curated display/body font pair id (see FONT_PAIRS) */
    font?: string
  }
  themeId: ThemeId
  seo: {
    title: string
    description: string
  }
  sections: Section[]
}

export interface ProjectSummary {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
  sectionCount: number
  themeId: ThemeId
}

export interface ProjectWithConfig extends ProjectSummary {
  config: LandingConfig
}

export type DeployStatus = "queued" | "building" | "live" | "failed"

export interface DeployLogLine {
  t: string
  msg: string
  level: "info" | "success" | "warn"
}

export interface DeployRecord {
  id: string
  projectId: string
  status: DeployStatus
  url: string | null
  logs: DeployLogLine[]
  durationMs: number
  createdAt: string
}

// ── Analytics ────────────────────────────────────────────────────────────────
export interface LeadRecord {
  id: string
  name: string
  email: string
  message: string
  fields: Record<string, string> // full submitted field label → value map
  createdAt: string
}

export interface AnalyticsStats {
  pageviews: number
  uniqueVisitors: number
  bounceRate: number // 0-1
  avgDuration: number // seconds
  ctaClicks: number
  conversionRate: number // cta_clicks / pageviews, 0-1
}

export interface TimeseriesPoint {
  date: string // YYYY-MM-DD
  views: number
  clicks: number
}

export interface NamedCount {
  name: string
  count: number
}

export interface FunnelStep {
  label: string
  count: number
}

export interface AbVariantResult {
  name: string
  headline: string
  weight: number
  exposures: number
  clicks: number
  ctr: number // 0-1
  avgDuration: number // seconds — mean time-on-page for visits exposed to this variant
  engagedPct: number // 0-1 — share of exposed visits that engaged (≥15s or interacted)
  /** Variant-tagged section_view events for this test's section (0 when the
   *  section has no read tracking yet — e.g. the hero, where the pageview IS
   *  the read). reach = sectionReads / exposures. */
  sectionReads: number
}

/** One section-scoped A/B test in the analytics payload (hero, pricing, final CTA…). */
export interface AbTestResult {
  key: string // exposure event label key (section id; hero additionally matches legacy "hero")
  sectionId: string
  sectionType: string
  sectionLabel: string // human label, e.g. "Hero" / "Pricing"
  metric: string
  autoWinner: boolean
  sampleSize: number
  variants: AbVariantResult[]
  winner: string | null
  totalExposures: number
  hasData: boolean
  /** Per-variant duration/engagement data exists for this test (PageView.variantMap). */
  hasEngagement: boolean
  /** True for the page-level (primary) test — historically the only one with per-variant engagement; now every test with variantMap data has it. */
  primary: boolean
}

/** An active visit on the published page ("who's here right now"). */
export interface LiveVisit {
  id: string
  device: string
  browser: string
  country: string
  referrer: string
  variant: string | null
  durationSec: number // live seconds-on-page (max of synced duration and elapsed)
  startedAt: string // ISO
  lastActive: string // ISO — last engagement signal (ping or arrival)
}

export interface AnalyticsPayload {
  stats: AnalyticsStats
  timeseries: TimeseriesPoint[]
  devices: NamedCount[]
  countries: NamedCount[]
  referrers: NamedCount[]
  topSections: NamedCount[]
  funnel: FunnelStep[]
  /** Visits on the published page within the last few minutes (always computed, not windowed by `days`). */
  live: {
    active: LiveVisit[] // still on the page (recent engagement signal)
    last5m: number // total visits in the last 5 minutes
    activeCount: number
  }
  ab: {
    enabled: boolean
    metric: string
    autoWinner: boolean
    sampleSize: number
    variants: AbVariantResult[]
    winner: string | null
    totalExposures: number
    hasData: boolean
  } | null
  /** Every enabled section-level A/B test (hero first, then section order). `ab` is the primary/first entry. */
  abTests: AbTestResult[]
  recentEvents: {
    id: string
    type: string
    label: string
    variant: string | null
    createdAt: string
  }[]
}
