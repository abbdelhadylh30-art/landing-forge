<div align="center">

<br/>

<img alt="landing-forge studio" src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=800&size=38&duration=2400&pause=900&color=A78BFA&center=true&vCenter=true&width=820&height=70&lines=landing-forge+studio"/>

**The visual builder from the README — built and running.**
_Drag & drop sections · live device preview · one-click themes · AI prompts · A/B testing · real analytics · deploy._

<br/>

<p>
<img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
<img src="https://img.shields.io/badge/Tailwind_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
<img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white"/>
<img src="https://img.shields.io/badge/AI-A78BFA?style=for-the-badge"/>
</p>

</div>

---

## ⚒️ What this branch is

This is the **full web implementation** of the `landing-forge` vision described in the main README — a self-contained **Forge Studio** where you build, test and ship a landing page without writing code.

Everything runs locally: the studio (Next.js 16), a SQLite database via Prisma, and a tiny analytics relay (Bun + socket.io) for live visitor stats.

## ✨ Features

### Studio (visual builder)
- **Drag & drop section list** — reorder, duplicate, hide, delete 12 section types (navbar, hero, features, logos, gallery, testimonials, pricing, stats, FAQ, contact, final CTA, footer) with 30+ template variants
- **Live preview with device tabs** — desktop / tablet / phone frames
- **Inline editing** — every headline, sub, CTA, item and image editable in the properties panel
- **One-click themes** — 6 themes (nebula, ember, emerald, rose, mono, paper) driving CSS variables
- **Section-level A/B testing** — run an experiment on any major section; per-visitor weighted assignment, per-test exposure tracking, winners and one-click *Promote*
- **AI prompt generation** — describe the page, get a full config (`/api/ai/generate`), improve any section's copy (`/api/ai/improve`), generate images
- **YAML import/export** — round-trips with the CLI config format
- **Readiness audit** — weighted score (SEO, content, links, brand) with fix suggestions
- **Command palette (⌘K)**, undo/redo, autosave, ⌘S save
- **Deploy simulation** with build logs + published page URL

### Published pages
- `/?p=<slug>` renders the saved config as a **real visitor page** with tracking
- Privacy-friendly analytics: pageviews, referrers, countries, devices, bounce, engaged time
- A/B variant exposure + CTA click attribution per section
- Contact form leads land in the dashboard

### Analytics dashboard
- **Live relay (socket.io)** — visitors "right now", live events ticker
- Traffic charts, top referrers/countries, device mix
- A/B results with confidence, auto-winner detection, per-test tabs
- Leads inbox with detail sheet
- **CSV export**, traffic simulation (replace or append)

## 🚀 Run it

```bash
bun install
bun run db:push        # create the SQLite schema
bun run dev            # studio on http://localhost:3000

# optional: live analytics relay
cd mini-services/analytics-live && bun install && bun run dev
```

The studio creates a demo project on first run (seeded analytics included).

## 🗂️ Layout

```
src/lib/landing/       types, themes, defaults/templates, store, YAML, A/B, readiness, export
src/components/forge/  studio shell, panels, dialogs, preview sections, dashboard, published page
src/app/api/           projects, analytics (+track/seed/export), ai, deploy, images, export
mini-services/analytics-live/   Bun + socket.io live relay (:3003) + ingest (:3004)
prisma/schema.prisma   Project, PageView, Event, Deploy
```

## 🔀 Relationship to `main`

`main` holds the CLI/YAML generator + docs. This branch is the **visual builder web app** — merge it if you want the studio in the mainline, or keep it as the app track.

---

<div align="center">
<sub>Ship faster. Sleep better.</sub>
</div>
