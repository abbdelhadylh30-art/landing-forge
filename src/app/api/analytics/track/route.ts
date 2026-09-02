// ─────────────────────────────────────────────────────────────────────────────
// /api/analytics/track — privacy-friendly event ingest (single record)
//
// POST /api/analytics/track
// body: { projectId, type, path?, referrer?, country?, device?, browser?,
//         visitorId?, duration?, isBounce?, label?, variant?, value? }
//   type: "pageview" | "cta_click" | "form_submit" | "section_view" |
//         "variant_exposure" | "promote_winner"
// → 200 { ok: true, id } | 400 | 404
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { guard, HttpError, num, optStr, readJsonBody, str } from "@/lib/landing/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TRACK_TYPES = ["pageview", "cta_click", "form_submit", "section_view", "variant_exposure", "promote_winner"] as const
type TrackType = (typeof TRACK_TYPES)[number]

export async function POST(req: NextRequest) {
  return guard(async () => {
    const body = await readJsonBody(req)
    const projectId = str(body.projectId)
    if (!projectId) throw new HttpError(400, "Missing 'projectId'")
    const type = str(body.type) as TrackType
    if (!TRACK_TYPES.includes(type)) {
      throw new HttpError(400, `Invalid 'type' — must be one of: ${TRACK_TYPES.join(", ")}`)
    }
    const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true } })
    if (!project) throw new HttpError(404, "Project not found")

    if (type === "pageview") {
      const row = await db.pageView.create({
        data: {
          projectId,
          path: str(body.path) || "/",
          referrer: str(body.referrer) || "direct",
          country: str(body.country) || "US",
          device: str(body.device) || "desktop",
          browser: str(body.browser) || "Chrome",
          visitorId: str(body.visitorId) || "anon",
          duration: Math.max(0, Math.floor(num(body.duration) ?? 0)),
          isBounce: body.isBounce === true,
        },
        select: { id: true },
      })
      return NextResponse.json({ ok: true, id: row.id })
    }

    const row = await db.event.create({
      data: {
        projectId,
        type,
        label: str(body.label) ?? "",
        variant: optStr(body.variant),
        value: num(body.value) ?? 0,
        path: str(body.path) || "/",
      },
      select: { id: true },
    })
    return NextResponse.json({ ok: true, id: row.id })
  })
}
