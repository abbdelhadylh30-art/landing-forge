"use client"

import * as React from "react"
import { AlertTriangle, RotateCw } from "lucide-react"

/**
 * Root-level error boundary (Next.js global-error): catches failures that
 * take down the entire React root — normally a hard white screen. Must render
 * its own <html>/<body>. "Reload" performs a full page load, which almost
 * always recovers (dev-server restarts, stale chunks after Fast Refresh…).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error("[landing-forge] fatal error:", error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          background: "#09090b",
          color: "#f4f4f5",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          display: "flex",
          minHeight: "100dvh",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 16,
              border: "1px solid rgba(251,191,36,0.3)",
              background: "rgba(251,191,36,0.1)",
              marginBottom: 20,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
            landing-forge studio
          </h1>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#a1a1aa", margin: "0 0 22px" }}>
            The app crashed unexpectedly. Your projects are stored safely — a reload restores the
            studio.
            {error?.digest ? (
              <span style={{ display: "block", marginTop: 6, fontFamily: "monospace", fontSize: 10, color: "#52525b" }}>
                digest: {error.digest}
              </span>
            ) : null}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 38,
                padding: "0 18px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #8b5cf6, #d946ef)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload studio
            </button>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 38,
                padding: "0 18px",
                borderRadius: 10,
                border: "1px solid #3f3f46",
                background: "#18181b",
                color: "#e4e4e7",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
