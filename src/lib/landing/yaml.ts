import { load as yamlLoad, dump as yamlDump } from "js-yaml"
import { createSection, sid } from "./defaults"
import { isValidAccent, isFontPairId } from "./themes"
import type { LandingConfig, Section, SectionType, ThemeId } from "./types"
import { SECTION_TYPES } from "./types"

const THEME_IDS: ThemeId[] = ["nebula", "ember", "emerald", "rose", "mono", "paper"]

/**
 * Coerce arbitrary / partial / AI-generated data into a valid LandingConfig.
 * Fixes missing fields, wrong enum values, empty sections etc.
 */
export function normalizeConfig(input: unknown): LandingConfig {
  const raw = (input ?? {}) as Record<string, unknown>
  const brand = (raw.brand ?? {}) as Record<string, unknown>
  const seo = (raw.seo ?? {}) as Record<string, unknown>
  const themeId = THEME_IDS.includes(raw.themeId as ThemeId) ? (raw.themeId as ThemeId) : "nebula"
  const rawSections = Array.isArray(raw.sections) ? raw.sections : []

  const sections: Section[] = []
  for (const s of rawSections) {
    const rs = (s ?? {}) as Record<string, unknown>
    const type = rs.type as SectionType
    if (!SECTION_TYPES.includes(type)) continue
    const fresh = createSection(type)
    // merge AI/partial fields over defaults (shallow — nested arrays replaced if present & valid)
    const merged: Record<string, unknown> = { ...fresh, ...stripUndefined(rs) }
    merged.id = typeof rs.id === "string" && rs.id ? rs.id : sid(type)
    // per-type guards
    if (type === "hero") {
      const layout = rs.layout
      merged.layout = ["split-right", "split-left", "center", "full-bleed"].includes(layout as string)
        ? layout
        : "split-right"
      merged.cta = validCta(rs.cta) ?? (fresh as { cta: { label: string; href: string } }).cta
    }
    if (type === "features") {
      merged.style = ["grid", "alternating", "bento", "tabs", "carousel"].includes(rs.style as string) ? rs.style : "grid"
      merged.items = validItems(rs.items, 3, (x) => ({
        icon: String((x as Record<string, unknown>).icon ?? "⚡"),
        title: String((x as Record<string, unknown>).title ?? "Feature"),
        body: String((x as Record<string, unknown>).body ?? ""),
      }))
    }
    if (type === "testimonials") {
      merged.style = ["grid", "marquee", "spotlight", "video", "logo-wall"].includes(rs.style as string) ? rs.style : "grid"
      merged.items = validItems(rs.items, 3, (x) => {
        const o = x as Record<string, unknown>
        return {
          quote: String(o.quote ?? ""),
          author: String(o.author ?? "Anonymous"),
          role: String(o.role ?? ""),
          initials: String(o.initials ?? initialsOf(String(o.author ?? "A"))),
          rating: typeof o.rating === "number" ? Math.max(1, Math.min(5, Math.round(o.rating))) : 5,
        }
      })
    }
    if (type === "pricing") {
      merged.plans = validItems(rs.plans, 3, (x) => {
        const o = x as Record<string, unknown>
        return {
          name: String(o.name ?? "Plan"),
          price: String(o.price ?? "$0"),
          period: String(o.period ?? "/mo"),
          description: String(o.description ?? ""),
          features: Array.isArray(o.features) ? o.features.map(String).slice(0, 8) : [],
          highlighted: Boolean(o.highlighted),
          ctaLabel: String(o.ctaLabel ?? "Choose plan"),
        }
      })
    }
    if (type === "faq") {
      merged.style = ["accordion", "twocol"].includes(rs.style as string) ? rs.style : "accordion"
      merged.items = validItems(rs.items, 3, (x) => {
        const o = x as Record<string, unknown>
        return { q: String(o.q ?? o.question ?? "Question"), a: String(o.a ?? o.answer ?? "") }
      })
    }
    if (type === "logos") {
      merged.items = validItems(rs.items, 4, (x) => String(x))
    }
    if (type === "stats") {
      merged.items = validItems(rs.items, 4, (x) => {
        const o = x as Record<string, unknown>
        return { value: String(o.value ?? "0"), label: String(o.label ?? ""), delta: String(o.delta ?? "") }
      })
    }
    if (type === "gallery") {
      merged.style = ["masonry", "carousel"].includes(rs.style as string) ? rs.style : "masonry"
      merged.items = validItems(rs.items, 4, (x) => {
        const o = x as Record<string, unknown>
        return {
          src: typeof o.src === "string" ? o.src : "",
          alt: String(o.alt ?? "Image"),
          hue: String(o.hue ?? String(Math.floor(Math.random() * 360))),
          caption: String(o.caption ?? ""),
        }
      })
    }
    if (type === "contact") {
      const c = merged as unknown as { fields: string[]; submitLabel: string }
      c.fields = validItems(rs.fields, 2, (x) => String(x))
      if (!c.fields.length) c.fields = ["Your name", "Email address", "Message"]
      c.submitLabel = String(c.submitLabel ?? "Send message")
    }
    if (type === "navbar") {
      merged.links = validItems(rs.links, 1, (x) => {
        const o = x as Record<string, unknown>
        return { label: String(o.label ?? "Link"), href: String(o.href ?? "#") }
      })
    }
    if (type === "footer") {
      merged.style = ["minimal", "mega", "newsletter"].includes(rs.style as string) ? rs.style : "mega"
      merged.linkGroups = validItems(rs.linkGroups, 1, (x) => {
        const o = x as Record<string, unknown>
        return {
          group: String(o.group ?? "Links"),
          items: Array.isArray(o.items)
            ? o.items.map((i) => ({ label: String((i as Record<string, unknown>).label ?? "Link"), href: String((i as Record<string, unknown>).href ?? "#") }))
            : [],
        }
      })
    }
    if (type === "cta-final") {
      merged.cta = validCta(rs.cta) ?? { label: "Start free trial", href: "#cta" }
    }
    sections.push(merged as unknown as Section)
  }

  // sanitize custom anchors ([a-z0-9-] slugs — empty means "use the type default")
  for (const s of sections) {
    if (s.anchor == null) continue
    const a = String(s.anchor).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")
    if (a) s.anchor = a
    else delete s.anchor
  }

  const name = String(brand.name ?? "MyProduct").slice(0, 60) || "MyProduct"
  const brandOut: LandingConfig["brand"] = { name, tagline: String(brand.tagline ?? "") }
  const logoUrl = typeof brand.logoUrl === "string" ? brand.logoUrl.trim() : ""
  if (logoUrl) brandOut.logoUrl = logoUrl
  const accent = typeof brand.accent === "string" ? brand.accent.trim() : ""
  if (isValidAccent(accent)) brandOut.accent = accent.startsWith("#") ? accent : `#${accent}`
  if (typeof brand.font === "string" && isFontPairId(brand.font)) brandOut.font = brand.font
  return {
    version: 1,
    brand: brandOut,
    themeId,
    seo: {
      title: String(seo.title ?? `${name} — Ship faster`).slice(0, 120),
      description: String(seo.description ?? "").slice(0, 300),
    },
    sections: sections.length ? sections : [createSection("hero"), createSection("footer")],
  }
}

function stripUndefined(o: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined && v !== null) out[k] = v
  }
  return out
}

function validCta(c: unknown): { label: string; href: string } | null {
  if (!c || typeof c !== "object") return null
  const o = c as Record<string, unknown>
  if (typeof o.label !== "string") return null
  return { label: o.label, href: String(o.href ?? "#") }
}

function validItems<T>(arr: unknown, min: number, map: (x: unknown) => T): T[] {
  if (!Array.isArray(arr)) return []
  const items = arr.slice(0, 24).map(map)
  return items.length >= min ? items : items.length ? items : []
}

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "A"
  )
}

/** config → YAML string (reorders keys for readability) */
export function configToYaml(config: LandingConfig): string {
  const ordered = {
    brand: {
      name: config.brand.name,
      tagline: config.brand.tagline || undefined,
      logoUrl: config.brand.logoUrl || undefined,
      accent: config.brand.accent || undefined,
      font: config.brand.font || undefined,
    },
    theme: config.themeId,
    seo: { ...config.seo },
    sections: config.sections.map((s) => {
      const { hidden, ...rest } = s as unknown as Record<string, unknown>
      return hidden === true ? { ...rest, hidden: true } : rest
    }),
  }
  return yamlDump(ordered, { lineWidth: 100, noRefs: true, sortKeys: false })
}

/** YAML string → normalized config. Throws on invalid YAML. */
export function yamlToConfig(yamlText: string): LandingConfig {
  const parsed = yamlLoad(yamlText)
  if (typeof parsed !== "object" || parsed === null) throw new Error("YAML root must be a mapping")
  const raw = parsed as Record<string, unknown>
  // accept `theme:` as alias for themeId
  if (raw.themeId === undefined && typeof raw.theme === "string") raw.themeId = raw.theme
  return normalizeConfig(raw)
}

/** Try to parse AI output that may be wrapped in ```json fences */
export function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/```(?:json|ya?ml)?\s*/gi, "")
    .replace(/```\s*$/g, "")
    .trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    // maybe it's yaml
    try {
      return yamlLoad(cleaned)
    } catch {
      /* fallthrough */
    }
    // last resort: find first { ... last }
    const first = cleaned.indexOf("{")
    const last = cleaned.lastIndexOf("}")
    if (first !== -1 && last > first) {
      try {
        return JSON.parse(cleaned.slice(first, last + 1))
      } catch {
        /* give up */
      }
    }
    throw new Error("Could not parse AI response as JSON/YAML")
  }
}
