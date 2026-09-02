# Task 2-a — full-stack-developer — Backend API routes for Landing Forge Studio

Prior context: Task 1 built the frozen foundation in `src/lib/landing/` (types/themes/defaults/yaml/store) + Prisma schema (Project/PageView/Event/Deploy, SQLite at db/custom.db). See /home/z/my-project/worklog.md.

## Files created (all mine, nothing else touched)
- `src/lib/landing/server.ts` — SERVER-ONLY helpers: HttpError, guard(), readJsonBody(), str/optStr/num, parseStoredConfig(), toSummary()/toWithConfig(), uniqueSlug(). ⚠ Client code must NOT import this (pulls in Prisma).
- `src/app/api/projects/route.ts` — GET list / POST create
- `src/app/api/projects/[id]/route.ts` — GET / PATCH / DELETE (Next 16: `params` is a Promise, awaited)
- `src/app/api/projects/[id]/duplicate/route.ts` — POST duplicate
- `src/app/api/analytics/route.ts` — GET AnalyticsPayload (windowed by ?days=1..90)
- `src/app/api/analytics/track/route.ts` — POST single-event ingest
- `src/app/api/analytics/seed/route.ts` — POST "Simulate traffic" (wipes + reseeds, batched createMany 500/chunk, <1s for 30d)
- `src/app/api/analytics/export/route.ts` — GET CSV attachment
- `src/app/api/deploy/route.ts` — GET { deploy | null } (by ?projectId or ?id) / POST starts detached ~7s pipeline queued→building→live
- `src/app/api/ai/generate/route.ts` — POST prompt → { config } (z-ai-web-dev-sdk, real LLM, one retry with "raw JSON only" nudge)
- `src/app/api/ai/improve/route.ts` — POST config+instruction → { config } (copy-only edit, always normalizeConfig'd)

## Test results (curl against live dev server, all PASS)
| Route | Result |
|---|---|
| POST /api/projects (config {}) | 201, normalized config: hero+footer defaults |
| POST /api/projects (templateId "agency") | 201, 7 sections, brand name stamped from project name |
| GET /api/projects | 200 bare ProjectSummary[] |
| PATCH rename / GET by id | 200 ProjectWithConfig |
| POST duplicate | 201 "… copy", unique slug |
| DELETE | 200 { ok: true }, cascades (deploy lookup → null after) |
| bad body / unknown id | 400 / 404 { error } |
| POST track (pageview + cta_click + bad type) | 200 { ok, id } ×2, 400 on bad type |
| POST seed days=5 / 30 | 424pv+36ev @0.25s / 2146pv+4871ev @0.44s |
| GET analytics | full AnalyticsPayload; timeseries zero-filled 30 days; ab winner "B" (1.8x bias works), ab null when disabled |
| GET export CSV | 200 text/csv, correct headers, PAGEVIEWS + blank + EVENTS tables |
| POST deploy | 201 queued → live in ~7s, 9 logs, url https://{slug}.landing-forge.app; double-run → 200 reused; stale self-heal |
| POST ai/generate ("smart water bottle") | 200 in 25s — real LLM, valid config (brand AquaFlow, emerald, 8 sections) |
| POST ai/improve | 200 in 5.6s, structure kept, copy improved |

`bun run lint` → clean. dev.log → no compile errors. All test projects deleted (DB empty for the frontend's own demo creation).

## Contract for frontend agents
- Import types from `@/lib/landing/types`. Never import `@/lib/landing/server` or `z-ai-web-dev-sdk` client-side.
- Exact response shapes are listed in the Task 2-a section of worklog.md (read it before wiring fetch calls).
- Errors are always JSON `{ error: string }` with status 400/404/500.
- Deploy polling: `GET /api/deploy?id={id}` → `{ deploy: DeployRecord | null }`; status flows queued → building → live.
