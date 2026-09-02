// ─────────────────────────────────────────────────────────────────────────────
// /api/analytics/seed — realistic DEMO traffic generator ("Simulate traffic")
//
// POST /api/analytics/seed
// body: { projectId, days?: number = 30 }
// → 200 { ok: true, pageviews: number, events: number } | 400 | 404
//
// Wipes existing PageViews + Events for the project, then seeds:
//  - per-day pageviews (40 + rand(0..90), mild upward trend, weekend dip)
//  - visitor pool ≈ views/2.2 (so unique < pageviews), weighted referrers /
//    countries / devices / browsers, low-skewed durations, 42% bounces
//  - if hero A/B enabled (≥2 variants): ~70% of views get variant_exposure
//    (config weights) and cta_clicks at 6–12% CTR with the LAST variant biased
//    ~1.8x so the auto-winner story works once the sample size is reached
//  - else cta_clicks at 4–7% of views (variant null)
//  - section_view events (~1.5 per view, labels from config sections)
//  - form_submit ~0.8% of views
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { guard, HttpError, num, parseStoredConfig, readJsonBody, str } from "@/lib/landing/server"
import { SECTION_META } from "@/lib/landing/types"
import type { HeroSection } from "@/lib/landing/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const REFERRERS: [string, number][] = [
  ["direct", 30],
  ["google", 28],
  ["x.com", 10],
  ["news.ycombinator.com", 8],
  ["reddit", 6],
  ["producthunt", 6],
  ["linkedin", 5],
  ["bing", 4],
  ["dev.to", 3],
]
const COUNTRIES: [string, number][] = [
  ["US", 24], ["DE", 10], ["GB", 9], ["IN", 9], ["EG", 7], ["FR", 6], ["BR", 6],
  ["JP", 5], ["CA", 5], ["TR", 4], ["ES", 3], ["AU", 3], ["SA", 2], ["NG", 2], ["XX", 7],
]
const DEVICES: [string, number][] = [["desktop", 58], ["mobile", 35], ["tablet", 7]]
const BROWSERS: [string, number][] = [["Chrome", 62], ["Safari", 18], ["Firefox", 9], ["Edge", 7], ["Other", 4]]
const CONTENT_SECTION_TYPES = new Set([
  "logos", "features", "stats", "testimonials", "pricing", "faq", "gallery", "contact", "cta-final",
])

function pickWeighted<T>(pairs: [T, number][]): T {
  const total = pairs.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [value, w] of pairs) {
    r -= w
    if (r <= 0) return value
  }
  return pairs[pairs.length - 1][0]
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function randHex(len: number): string {
  let s = ""
  while (s.length < len) s += Math.floor(Math.random() * 16).toString(16)
  return s.slice(0, len)
}

interface ViewRow {
  projectId: string
  visitorId: string
  path: string
  referrer: string
  country: string
  device: string
  browser: string
  duration: number
  isBounce: boolean
  createdAt: Date
}
interface EventRow {
  projectId: string
  type: string
  label: string
  variant: string | null
  value: number
  path: string
  createdAt: Date
}

export async function POST(req: NextRequest) {
  return guard(async () => {
    const body = await readJsonBody(req)
    const projectId = str(body.projectId)
    if (!projectId) throw new HttpError(400, "Missing 'projectId'")
    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) throw new HttpError(404, "Project not found")
    const days = Math.max(1, Math.min(90, Math.floor(num(body.days) ?? 30)))

    // fresh re-seed
    await db.pageView.deleteMany({ where: { projectId } })
    await db.event.deleteMany({ where: { projectId } })

    const config = parseStoredConfig(project.config)
    const hero = config.sections.find((s): s is HeroSection => s.type === "hero")
    const rawAb = hero?.ab
    const abCfg = rawAb && rawAb.enabled && rawAb.variants.length >= 2 ? rawAb : null
    const abVariants = abCfg?.variants ?? []
    const lastVariantName = abVariants.length ? abVariants[abVariants.length - 1].name : null

    const sectionLabels = config.sections
      .filter((s) => !s.hidden && CONTENT_SECTION_TYPES.has(s.type))
      .map((s) => SECTION_META[s.type].label)
    const hasContact = config.sections.some((s) => s.type === "contact")

    const now = new Date()
    const startDay = new Date(now)
    startDay.setHours(0, 0, 0, 0)
    startDay.setDate(startDay.getDate() - (days - 1))

    // plan per-day volumes (mild upward trend toward recent days + weekend dip)
    const perDay: { dayStart: Date; views: number }[] = []
    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDay)
      dayStart.setDate(startDay.getDate() + i)
      const trend = 0.75 + 0.25 * (days === 1 ? 1 : i / (days - 1))
      const dow = dayStart.getDay()
      const weekend = dow === 0 || dow === 6 ? 0.72 : 1
      const views = Math.max(5, Math.round((40 + Math.random() * 90) * trend * weekend))
      perDay.push({ dayStart, views })
    }
    const totalViews = perDay.reduce((s, d) => s + d.views, 0)

    // visitor pool ≈ totalViews / 2.2 unique ids
    const poolSize = Math.max(1, Math.round(totalViews / 2.2))
    const visitors: string[] = Array.from({ length: poolSize }, () => `v-${randHex(8)}`)

    // click rates fixed per seed-run
    const abClickRate = 0.06 + Math.random() * 0.06 // 6–12% of exposures
    const plainClickRate = 0.04 + Math.random() * 0.03 // 4–7% of views

    const viewRows: ViewRow[] = []
    const eventRows: EventRow[] = []

    for (const { dayStart, views } of perDay) {
      const dayEnd = Math.min(dayStart.getTime() + 24 * 3600 * 1000, now.getTime())
      for (let i = 0; i < views; i++) {
        const t = new Date(dayStart.getTime() + Math.random() * Math.max(1, dayEnd - dayStart.getTime()))
        viewRows.push({
          projectId,
          visitorId: visitors[randInt(0, visitors.length - 1)],
          path: "/",
          referrer: pickWeighted(REFERRERS),
          country: pickWeighted(COUNTRIES),
          device: pickWeighted(DEVICES),
          browser: pickWeighted(BROWSERS),
          duration: 5 + Math.floor(275 * Math.pow(Math.random(), 2.2)), // weighted low
          isBounce: Math.random() < 0.42,
          createdAt: t,
        })

        const clickTime = () =>
          new Date(Math.min(now.getTime(), t.getTime() + randInt(10, 180) * 1000))

        if (abVariants.length >= 2) {
          if (Math.random() < 0.7) {
            // exposure assigned by config weights
            const variant = pickWeighted(
              abVariants.map((v) => [v.name, Math.max(1, v.weight)] as [string, number])
            )
            eventRows.push({ projectId, type: "variant_exposure", label: "hero", variant, value: 0, path: "/", createdAt: t })
            // last variant biased ~1.8x CTR so it wins once sample reached
            const rate = abClickRate * (variant === lastVariantName ? 1.8 : 1)
            if (Math.random() < rate) {
              eventRows.push({ projectId, type: "cta_click", label: "hero", variant, value: 0, path: "/", createdAt: clickTime() })
            }
          }
        } else if (Math.random() < plainClickRate) {
          eventRows.push({ projectId, type: "cta_click", label: "hero", variant: null, value: 0, path: "/", createdAt: clickTime() })
        }

        // section views — ~1.5 per view on random distinct sections
        if (sectionLabels.length) {
          const n = 1 + (Math.random() < 0.5 ? 1 : 0)
          const remaining = [...sectionLabels]
          for (let s = 0; s < n && remaining.length; s++) {
            const label = remaining.splice(randInt(0, remaining.length - 1), 1)[0]
            const ct = new Date(Math.min(now.getTime(), t.getTime() + randInt(20, 240) * 1000))
            eventRows.push({ projectId, type: "section_view", label, variant: null, value: 0, path: "/", createdAt: ct })
          }
        }

        // form submissions ~0.8% of views
        if (Math.random() < 0.008) {
          const ct = new Date(Math.min(now.getTime(), t.getTime() + randInt(30, 300) * 1000))
          eventRows.push({
            projectId,
            type: "form_submit",
            label: hasContact ? "Contact" : "contact",
            variant: null,
            value: 0,
            path: "/contact",
            createdAt: ct,
          })
        }
      }
    }

    // batched inserts (SQLite createMany, chunks keep it fast)
    const CHUNK = 500
    for (let i = 0; i < viewRows.length; i += CHUNK) {
      await db.pageView.createMany({ data: viewRows.slice(i, i + CHUNK) })
    }
    for (let i = 0; i < eventRows.length; i += CHUNK) {
      await db.event.createMany({ data: eventRows.slice(i, i + CHUNK) })
    }

    return NextResponse.json({ ok: true, pageviews: viewRows.length, events: eventRows.length })
  })
}
