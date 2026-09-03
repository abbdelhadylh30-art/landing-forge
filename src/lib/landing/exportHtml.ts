"use client"

// ─────────────────────────────────────────────────────────────────────────────
// Standalone-HTML export: renders the landing page to a single self-contained
// .html file (compiled Tailwind CSS inlined + SEO meta + tiny interactivity
// script). Runs fully client-side — the sections are already loaded as React
// components in the browser, so react-dom/server's browser build can render
// them to static markup without touching the network for anything but the CSS.
// ─────────────────────────────────────────────────────────────────────────────
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { LandingPreview } from "@/components/forge/preview/LandingPreview"
import { googleFontLinkTags } from "./themes"
import type { LandingConfig } from "./types"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Vanilla-JS behaviors for the static snapshot (FAQ accordion, smooth scroll). */
const INTERACTIVE_SCRIPT = [
  "document.addEventListener('click', function (e) {",
  "  var t = e.target.closest('[data-slot=\"accordion-trigger\"]');",
  "  if (t) {",
  "    e.preventDefault();",
  "    var item = t.closest('[data-slot=\"accordion-item\"]');",
  "    if (!item) return;",
  "    var open = item.getAttribute('data-state') === 'open';",
  "    var next = open ? 'closed' : 'open';",
  "    item.setAttribute('data-state', next);",
  "    t.setAttribute('data-state', next);",
  "    t.setAttribute('aria-expanded', open ? 'false' : 'true');",
  "    var c = item.querySelector('[data-slot=\"accordion-content\"]');",
  "    if (c) {",
  "      c.setAttribute('data-state', next);",
  "      if (open) { c.setAttribute('hidden', ''); } else { c.removeAttribute('hidden'); }",
  "    }",
  "  }",
  "}, false);",
].join("\n")

export interface StandaloneHtml {
  html: string
  bytes: number
}

export async function buildStandaloneHtml(config: LandingConfig): Promise<StandaloneHtml> {
  // 1. fetch the pre-compiled stylesheet (served from /api/export/css)
  const cssRes = await fetch("/api/export/css")
  if (!cssRes.ok) throw new Error("Could not load the export stylesheet")
  const css = await cssRes.text()

  // 2. render the page to static markup
  const markup = renderToStaticMarkup(createElement(LandingPreview, { config }))

  // 3. assemble the document
  const title = escapeHtml(config.seo?.title || `${config.brand.name} — ${config.brand.tagline ?? ""}`.trim())
  const description = escapeHtml(config.seo?.description ?? "")
  const brand = escapeHtml(config.brand.name)
  const year = new Date().getFullYear()
  // ✦ Google webfont pairs: preconnect + css2 links (empty for system pairs)
  const fontLinks = googleFontLinkTags(config.brand.font)

  const html = [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${title}</title>`,
    description ? `<meta name="description" content="${description}">` : "",
    '<meta property="og:title" content="' + title + '">',
    description ? '<meta property="og:description" content="' + description + '">' : "",
    '<meta name="generator" content="landing-forge studio">',
    ...fontLinks,
    "<style>",
    css,
    "</style>",
    "<style>html{scroll-behavior:smooth}html,body{min-height:100%}</style>",
    "</head>",
    "<body>",
    markup,
    "<script>",
    INTERACTIVE_SCRIPT,
    "</script>",
    `<!-- Built with landing-forge studio · ${year} · ${brand} -->`,
    "</body>",
    "</html>",
  ]
    .filter(Boolean)
    .join("\n")

  return { html, bytes: new Blob([html]).size }
}

/** Trigger a browser download for the generated document. */
export function downloadStandaloneHtml(html: string, slug: string): string {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${slug || "landing"}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // keep the URL alive for the "open in new tab" action that follows
  return url
}
