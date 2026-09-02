// ─────────────────────────────────────────────────────────────────────────────
// /api/analytics — dashboard payload
//
// GET /api/analytics?projectId=xxx&days=30 → 200 AnalyticsPayload | 400 | 404
//   All metrics are windowed to the last `days` days (1–90, default 30,
//   local midnights, today included). Response = AnalyticsPayload (see types.ts):
//   { stats, timeseries, devices, countries, referrers, topSections, funnel,
//     ab, recentEvents }
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { guard, HttpError, parseStoredConfig } from "@/lib/landing/server"
import type { AnalyticsPayload, HeroSection } from "@/lib/landing/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export async function GET(req: NextRequest) {
  return guard(async () => {
    const projectId = req.nextUrl.searchParams.get("projectId")
    if (!projectId) throw new HttpError(400, "Missing 'projectId' query parameter")
    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) throw new HttpError(404, "Project not found")

    const daysRaw = Number(req.nextUrl.searchParams.get("days") ?? "30")
    const days = Math.max(1, Math.min(90, Math.floor(Number.isFinite(daysRaw) ? daysRaw : 30)))

    // window start = local midnight, N-1 days back (today counts as day N)
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - (days - 1))

    const [views, events, deviceGroups, countryGroups, referrerGroups, sectionGroups, recent] =
      await Promise.all([
        db.pageView.findMany({
          where: { projectId, createdAt: { gte: start } },
          select: { visitorId: true, duration: true, isBounce: true, createdAt: true },
        }),
        db.event.findMany({
          where: { projectId, createdAt: { gte: start } },
          select: { type: true, label: true, variant: true, createdAt: true },
        }),
        db.pageView.groupBy({ by: ["device"], where: { projectId, createdAt: { gte: start } }, _count: { _all: true } }),
        db.pageView.groupBy({ by: ["country"], where: { projectId, createdAt: { gte: start } }, _count: { _all: true } }),
        db.pageView.groupBy({ by: ["referrer"], where: { projectId, createdAt: { gte: start } }, _count: { _all: true } }),
        db.event.groupBy({ by: ["label"], where: { projectId, type: "section_view", createdAt: { gte: start } }, _count: { _all: true } }),
        db.event.findMany({
          where: { projectId, createdAt: { gte: start } },
          orderBy: { createdAt: "desc" },
          take: 12,
          select: { id: true, type: true, label: true, variant: true, createdAt: true },
        }),
      ])

    // ── stats ────────────────────────────────────────────────────────────────
    const pageviews = views.length
    const uniqueVisitors = new Set(views.map((v) => v.visitorId)).size
    const bounceRate = pageviews ? views.filter((v) => v.isBounce).length / pageviews : 0
    const avgDuration = pageviews
      ? Math.round(views.reduce((s, v) => s + v.duration, 0) / pageviews)
      : 0
    const ctaClicks = events.filter((e) => e.type === "cta_click").length
    const conversionRate = pageviews ? ctaClicks / pageviews : 0

    // ── timeseries (fill all days with zeros) ────────────────────────────────
    const dayMap = new Map<string, { views: number; clicks: number }>()
    for (let i = 0; i < days; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      dayMap.set(dayKey(d), { views: 0, clicks: 0 })
    }
    for (const v of views) {
      const entry = dayMap.get(dayKey(v.createdAt))
      if (entry) entry.views++
    }
    for (const e of events) {
      if (e.type !== "cta_click") continue
      const entry = dayMap.get(dayKey(e.createdAt))
      if (entry) entry.clicks++
    }
    const timeseries = Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v }))

    // ── dimension breakdowns (top 10, desc) ──────────────────────────────────
    const ranked = (rows: { name: string; count: number }[], top: number) =>
      rows.sort((a, b) => b.count - a.count).slice(0, top)
    const devices = ranked(deviceGroups.map((g) => ({ name: g.device, count: g._count._all })), 10)
    const countries = ranked(countryGroups.map((g) => ({ name: g.country, count: g._count._all })), 10)
    const referrers = ranked(referrerGroups.map((g) => ({ name: g.referrer, count: g._count._all })), 10)
    const topSections = ranked(sectionGroups.map((g) => ({ name: g.label, count: g._count._all })), 8)

    // ── funnel ───────────────────────────────────────────────────────────────
    const countType = (t: string) => events.filter((e) => e.type === t).length
    const funnel = [
      { label: "Visited page", count: pageviews },
      { label: "Engaged with sections", count: countType("section_view") },
      { label: "Clicked CTA", count: countType("cta_click") },
      { label: "Submitted form", count: countType("form_submit") },
    ]

    // ── A/B block (first enabled hero ab) ────────────────────────────────────
    const config = parseStoredConfig(project.config)
    const hero = config.sections.find((s): s is HeroSection => s.type === "hero" && s.ab?.enabled === true)
    const abCfg = hero?.ab
    let ab: AnalyticsPayload["ab"] = null
    if (abCfg) {
      const exposuresBy = new Map<string, number>()
      const clicksBy = new Map<string, number>()
      for (const e of events) {
        if (!e.variant) continue
        if (e.type === "variant_exposure") {
          exposuresBy.set(e.variant, (exposuresBy.get(e.variant) ?? 0) + 1)
        } else if (e.type === "cta_click") {
          clicksBy.set(e.variant, (clicksBy.get(e.variant) ?? 0) + 1)
        }
      }
      const variants = abCfg.variants.map((v) => {
        const exposures = exposuresBy.get(v.name) ?? 0
        const clicks = clicksBy.get(v.name) ?? 0
        return {
          name: v.name,
          headline: v.headline,
          weight: v.weight,
          exposures,
          clicks,
          ctr: exposures > 0 ? clicks / exposures : 0,
        }
      })
      const totalExposures = variants.reduce((s, v) => s + v.exposures, 0)
      const someClicks = variants.some((v) => v.clicks > 0)
      let winner: string | null = null
      if (abCfg.autoWinner && totalExposures >= abCfg.sampleSize && someClicks) {
        winner = variants.reduce((best, v) => (v.ctr > best.ctr ? v : best)).name
      }
      ab = {
        enabled: true,
        metric: abCfg.metric,
        autoWinner: abCfg.autoWinner,
        sampleSize: abCfg.sampleSize,
        variants,
        winner,
        totalExposures,
        hasData: totalExposures > 0,
      }
    }

    const payload: AnalyticsPayload = {
      stats: { pageviews, uniqueVisitors, bounceRate, avgDuration, ctaClicks, conversionRate },
      timeseries,
      devices,
      countries,
      referrers,
      topSections,
      funnel,
      ab,
      recentEvents: recent.map((e) => ({
        id: e.id,
        type: e.type,
        label: e.label,
        variant: e.variant,
        createdAt: e.createdAt.toISOString(),
      })),
    }
    return NextResponse.json(payload)
  })
}
