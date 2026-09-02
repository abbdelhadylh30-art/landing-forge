import type { LandingConfig } from "./types"
import { collectAnchorLinks, findBrokenAnchorLinks } from "./anchors"

export type ReadinessLevel = "pass" | "warn" | "fail"

export interface ReadinessCheck {
  id: string
  category: "structure" | "seo" | "conversion"
  label: string
  detail: string
  level: ReadinessLevel
  weight: number
  /** Select this section in the studio when the item is clicked (fix action). */
  selectSectionId?: string
}

export interface ReadinessReport {
  score: number // 0-100
  grade: "A" | "B" | "C" | "D"
  checks: ReadinessCheck[]
  counts: { pass: number; warn: number; fail: number }
}

const TITLE_MIN = 30
const TITLE_MAX = 60
const DESC_MIN = 70
const DESC_MAX = 160
const HEADLINE_MIN = 20
const HEADLINE_MAX = 90

/**
 * Audit a landing config for launch readiness — structure, SEO and conversion
 * essentials. Pure function: no React, no store. Returns weighted score + grade.
 */
export function auditConfig(config: LandingConfig): ReadinessReport {
  const sections = config.sections
  const visible = sections.filter((s) => !s.hidden)
  const find = (type: string) => visible.find((s) => s.type === type)

  const hero = find("hero")
  const navbar = find("navbar")
  const footer = find("footer")
  const social = find("testimonials") ?? find("logos")
  const pricing = find("pricing")
  const faq = find("faq")
  const finalCta = find("cta-final")
  const contact = find("contact")
  const hiddenCount = sections.length - visible.length

  const checks: ReadinessCheck[] = []

  // ── Structure ──────────────────────────────────────────────────────────────
  checks.push(
    hero
      ? {
          id: "hero",
          category: "structure",
          label: "Hero section",
          detail: "Every landing page needs a hero with a clear value proposition.",
          level: "pass",
          weight: 15,
          selectSectionId: hero.id,
        }
      : {
          id: "hero",
          category: "structure",
          label: "Hero section",
          detail: "No hero found — add one so visitors see your pitch instantly.",
          level: "fail",
          weight: 15,
        }
  )

  if (hero && hero.type === "hero") {
    const ctaOk = hero.cta.label.trim().length > 2 && hero.cta.href.trim().length > 0
    checks.push({
      id: "hero-cta",
      category: "structure",
      label: "Primary CTA",
      detail: ctaOk
        ? `“${hero.cta.label}” is wired and ready.`
        : "Hero CTA is missing a label or destination — visitors won't know what to do.",
      level: ctaOk ? "pass" : "fail",
      weight: 10,
      selectSectionId: hero.id,
    })

    const len = hero.headline.length
    checks.push({
      id: "headline-length",
      category: "structure",
      label: "Headline length",
      detail:
        len < HEADLINE_MIN
          ? `Headline is ${len} chars — aim for ${HEADLINE_MIN}–${HEADLINE_MAX} so the value lands.`
          : len > HEADLINE_MAX
            ? `Headline is ${len} chars — trim toward ${HEADLINE_MIN}–${HEADLINE_MAX} for punch.`
            : `${len} chars — right in the sweet spot.`,
      level: len >= HEADLINE_MIN && len <= HEADLINE_MAX ? "pass" : "warn",
      weight: 5,
      selectSectionId: hero.id,
    })

    const abOn = hero.ab?.enabled === true
    checks.push({
      id: "ab",
      category: "conversion",
      label: "A/B experiment",
      detail: abOn
        ? `Live with ${hero.ab?.variants.length ?? 0} variants — winner auto-promotes at ${hero.ab?.sampleSize ?? 0} exposures.`
        : "No A/B test on the hero. Enable one to let data pick your best headline.",
      level: abOn ? "pass" : "warn",
      weight: 5,
      selectSectionId: hero.id,
    })
  }

  checks.push(
    navbar
      ? { id: "navbar", category: "structure", label: "Navigation", detail: "Navbar present — brand + links anchor the page.", level: "pass" as ReadinessLevel, weight: 5, selectSectionId: navbar.id }
      : { id: "navbar", category: "structure", label: "Navigation", detail: "No navbar — visitors lose orientation on long pages.", level: "fail" as ReadinessLevel, weight: 5 }
  )

  checks.push(
    footer
      ? { id: "footer", category: "structure", label: "Footer", detail: "Footer present with links and legal line.", level: "pass" as ReadinessLevel, weight: 5, selectSectionId: footer.id }
      : { id: "footer", category: "structure", label: "Footer", detail: "No footer — add one for links, social and trust.", level: "fail" as ReadinessLevel, weight: 5 }
  )

  checks.push(
    social
      ? { id: "social-proof", category: "conversion", label: "Social proof", detail: social.type === "testimonials" ? "Testimonials build trust with real voices." : "A logo wall signals adoption by known companies.", level: "pass" as ReadinessLevel, weight: 10, selectSectionId: social.id }
      : { id: "social-proof", category: "conversion", label: "Social proof", detail: "No testimonials or logo wall — add social proof to de-risk the decision.", level: "warn" as ReadinessLevel, weight: 10 }
  )

  checks.push(
    pricing
      ? { id: "pricing", category: "conversion", label: "Pricing", detail: "Pricing section present — buyers can self-qualify.", level: "pass" as ReadinessLevel, weight: 5, selectSectionId: pricing.id }
      : { id: "pricing", category: "conversion", label: "Pricing", detail: "No pricing — fine for pre-launch, expected once you sell.", level: "warn" as ReadinessLevel, weight: 5 }
  )

  checks.push(
    faq
      ? { id: "faq", category: "conversion", label: "FAQ", detail: "FAQ pre-answers objections before the final CTA.", level: "pass" as ReadinessLevel, weight: 5, selectSectionId: faq.id }
      : { id: "faq", category: "conversion", label: "FAQ", detail: "No FAQ — common objections go unanswered.", level: "warn" as ReadinessLevel, weight: 5 }
  )

  checks.push(
    finalCta
      ? { id: "final-cta", category: "conversion", label: "Final CTA", detail: "Closing CTA converts readers at the bottom of the page.", level: "pass" as ReadinessLevel, weight: 10, selectSectionId: finalCta.id }
      : { id: "final-cta", category: "conversion", label: "Final CTA", detail: "No final CTA — the page ends without a last ask.", level: "fail" as ReadinessLevel, weight: 10 }
  )

  checks.push(
    contact
      ? { id: "contact", category: "conversion", label: "Contact capture", detail: "Contact form gives visitors a low-friction path.", level: "pass" as ReadinessLevel, weight: 5, selectSectionId: contact.id }
      : { id: "contact", category: "conversion", label: "Contact capture", detail: "No contact section or form to capture intent.", level: "warn" as ReadinessLevel, weight: 5 }
  )

  checks.push({
    id: "length",
    category: "structure",
    label: "Page depth",
    detail:
      visible.length >= 5
        ? `${visible.length} visible sections — solid narrative arc.`
        : `${visible.length} sections — a fuller story converts better (aim for 5+).`,
    level: visible.length >= 5 ? "pass" : "warn",
    weight: 5,
  })

  checks.push({
    id: "hidden",
    category: "structure",
    label: "Hidden sections",
    detail:
      hiddenCount === 0
        ? "Nothing hidden — your whole draft will ship."
        : `${hiddenCount} section${hiddenCount > 1 ? "s" : ""} hidden and won't deploy. Un-hide or delete to clean up.`,
    level: hiddenCount === 0 ? "pass" : "warn",
    weight: 3,
  })

  // ── In-page navigation: every #anchor link must resolve to a section ──────
  const brokenLinks = findBrokenAnchorLinks(config)
  const anchorLinks = collectAnchorLinks(config)
  checks.push({
    id: "anchor-links",
    category: "structure",
    label: "Anchor links",
    detail:
      anchorLinks.length === 0
        ? "No in-page anchor links — navbar/footer links pointing at sections would aid navigation."
        : brokenLinks.length === 0
          ? `${anchorLinks.length} in-page link${anchorLinks.length > 1 ? "s" : ""} — all resolve to sections. ✓`
          : `${brokenLinks.length} broken: ${brokenLinks
              .slice(0, 3)
              .map((b) => `“${b.label}” → #${b.target}`)
              .join(" · ")}${brokenLinks.length > 3 ? " …" : ""} — nothing on the page has that anchor.`,
    level: anchorLinks.length === 0 ? "warn" : brokenLinks.length === 0 ? "pass" : "fail",
    weight: 5,
    selectSectionId: brokenLinks[0]?.sectionId,
  })

  // ── SEO ────────────────────────────────────────────────────────────────────
  const titleLen = config.seo.title.length
  checks.push({
    id: "seo-title",
    category: "seo",
    label: "SEO title",
    detail:
      titleLen === 0
        ? "Meta title is empty — search engines will invent one."
        : titleLen < TITLE_MIN
          ? `${titleLen} chars — a little short for keyword real estate (${TITLE_MIN}–${TITLE_MAX}).`
          : titleLen > TITLE_MAX
            ? `${titleLen} chars — will be cut off in results (${TITLE_MIN}–${TITLE_MAX}).`
            : `${titleLen} chars — ideal.`,
    level: titleLen >= TITLE_MIN && titleLen <= TITLE_MAX ? "pass" : titleLen === 0 ? "fail" : "warn",
    weight: 10,
  })

  const descLen = config.seo.description.length
  checks.push({
    id: "seo-desc",
    category: "seo",
    label: "Meta description",
    detail:
      descLen === 0
        ? "Meta description is empty — write one to control your search snippet."
        : descLen < DESC_MIN
          ? `${descLen} chars — expand toward ${DESC_MIN}–${DESC_MAX}.`
          : descLen > DESC_MAX
            ? `${descLen} chars — trim toward ${DESC_MIN}–${DESC_MAX}.`
            : `${descLen} chars — ideal.`,
    level: descLen >= DESC_MIN && descLen <= DESC_MAX ? "pass" : descLen === 0 ? "fail" : "warn",
    weight: 10,
  })

  checks.push({
    id: "brand",
    category: "seo",
    label: "Brand name",
    detail: config.brand.name.trim() ? `“${config.brand.name}” is set.` : "Brand name is empty.",
    level: config.brand.name.trim() ? "pass" : "fail",
    weight: 2,
  })

  // ── Score ──────────────────────────────────────────────────────────────────
  const totalWeight = checks.reduce((a, c) => a + c.weight, 0)
  const earned = checks.reduce((a, c) => a + (c.level === "pass" ? c.weight : 0), 0)
  const score = Math.round((earned / totalWeight) * 100)
  const grade: ReadinessReport["grade"] = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : "D"

  return {
    score,
    grade,
    checks,
    counts: {
      pass: checks.filter((c) => c.level === "pass").length,
      warn: checks.filter((c) => c.level === "warn").length,
      fail: checks.filter((c) => c.level === "fail").length,
    },
  }
}
