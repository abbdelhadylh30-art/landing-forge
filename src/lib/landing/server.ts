// ─────────────────────────────────────────────────────────────────────────────
// Landing Forge — shared SERVER helpers for API route handlers.
// ⚠ SERVER ONLY: imports Prisma. Never import this file from client components.
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from "next/server"
import type { Project } from "@prisma/client"
import { db } from "@/lib/db"
import { slugify } from "./defaults"
import { normalizeConfig } from "./yaml"
import type { LandingConfig, ProjectSummary, ProjectWithConfig } from "./types"

/** Thrown by handlers to produce a JSON error response with a specific status. */
export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Central try/catch wrapper for every route handler. */
export async function guard(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn()
  } catch (e) {
    if (e instanceof HttpError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error("[api-error]", e)
    const message = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** Safely read + parse a JSON object body. 400 on invalid JSON. */
export async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  let text = ""
  try {
    text = await req.text()
  } catch {
    throw new HttpError(400, "Could not read request body")
  }
  if (!text.trim()) return {}
  if (text.length > 2_000_000) throw new HttpError(413, "Request body too large")
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new HttpError(400, "Invalid JSON body")
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new HttpError(400, "Request body must be a JSON object")
  }
  return parsed as Record<string, unknown>
}

// ── unknown → primitive narrowing helpers ────────────────────────────────────
export function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined
}
export function optStr(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null
}
export function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined
}

// ── project mapping ──────────────────────────────────────────────────────────

/** Parse a stored config JSON string → LandingConfig. Resilient — never throws. */
export function parseStoredConfig(raw: string): LandingConfig {
  try {
    return normalizeConfig(JSON.parse(raw) as unknown)
  } catch {
    return normalizeConfig({})
  }
}

/** Prisma Project row → ProjectSummary (config parsed for sectionCount/themeId). */
export function toSummary(p: Project): ProjectSummary {
  const config = parseStoredConfig(p.config)
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    sectionCount: config.sections.length,
    themeId: config.themeId,
  }
}

/** Prisma Project row → ProjectWithConfig. */
export function toWithConfig(p: Project): ProjectWithConfig {
  return { ...toSummary(p), config: parseStoredConfig(p.config) }
}

/** Generate a slug from a name, appending -2, -3… when taken. */
export async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name)
  let candidate = base
  for (let i = 2; i <= 200; i++) {
    const existing = await db.project.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!existing) return candidate
    candidate = `${base}-${i}`
  }
  return `${base}-${Date.now().toString(36)}`
}
