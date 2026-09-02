"use client"

import { useState } from "react"

import type { FeatureItem, FeaturesSection } from "@/lib/landing/types"

import { cn } from "@/lib/utils"

import { CONTAINER, SECTION_PAD, SectionHeader } from "../shared"

export interface FeaturesProps {
  section: FeaturesSection
}

/** Static Tailwind class strings for grid column counts (required for JIT). */
const GRID_COLS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
}

function MiniBars() {
  const bars = [30, 52, 41, 66, 48, 80, 58, 92, 72, 84]
  return (
    <div className="mt-auto flex h-20 items-end gap-1.5 pt-6" aria-hidden>
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm"
          style={{ height: `${h}%`, background: "var(--lf-accent)", opacity: 0.3 + (i / bars.length) * 0.7 }}
        />
      ))}
    </div>
  )
}

interface FeatureCardProps {
  item: FeatureItem
  big?: boolean
  chart?: boolean
  className?: string
}

function FeatureCard({ item, big = false, chart = false, className }: FeatureCardProps) {
  return (
    <div
      className={cn("flex h-full flex-col rounded-2xl border p-5 transition-transform duration-150 hover:-translate-y-0.5", className)}
      style={{ background: "var(--lf-surface)", borderColor: "var(--lf-border)" }}
    >
      <div
        className={cn("flex items-center justify-center rounded-xl", big ? "size-14 text-3xl" : "size-10 text-xl")}
        style={{ background: "var(--lf-accent-soft)" }}
      >
        <span aria-hidden>{item.icon}</span>
      </div>
      <h3 className={cn("mt-4 font-semibold", big ? "text-lg md:text-xl" : "text-base")} style={{ color: "var(--lf-text)" }}>
        {item.title}
      </h3>
      <p className={cn("mt-2 leading-relaxed", big ? "text-sm md:text-base" : "text-sm")} style={{ color: "var(--lf-muted)" }}>
        {item.body}
      </p>
      {chart ? <MiniBars /> : null}
    </div>
  )
}

export function Features({ section }: FeaturesProps) {
  const items = section.items ?? []
  const [active, setActive] = useState(0)
  const activeIdx = Math.min(active, Math.max(items.length - 1, 0))
  const current = items[activeIdx]
  const cols = GRID_COLS[section.columns ?? 3] ?? GRID_COLS[3]

  return (
    <section className={SECTION_PAD}>
      <div className={CONTAINER}>
        <SectionHeader title={section.title} subtitle={section.subtitle} center />

        {section.style === "grid" ? (
          <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5", cols)}>
            {items.map((item, i) => (
              <FeatureCard key={`${item.title}-${i}`} item={item} />
            ))}
          </div>
        ) : section.style === "alternating" ? (
          <div className="flex flex-col">
            {items.map((item, i) => (
              <div
                key={`${item.title}-${i}`}
                className={cn(
                  "flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:gap-8",
                  i % 2 === 1 && "sm:flex-row-reverse",
                  i > 0 && "border-t"
                )}
                style={i > 0 ? { borderColor: "var(--lf-border)" } : undefined}
              >
                <div
                  className="mx-auto flex size-16 shrink-0 items-center justify-center rounded-2xl text-3xl sm:mx-0"
                  style={{ background: "var(--lf-accent-soft)" }}
                >
                  <span aria-hidden>{item.icon}</span>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold" style={{ color: "var(--lf-text)" }}>
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed md:text-base" style={{ color: "var(--lf-muted)" }}>
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : section.style === "bento" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {items.map((item, i) => (
              <FeatureCard
                key={`${item.title}-${i}`}
                item={item}
                big={i === 0}
                chart={i === 0}
                className={i === 0 ? "lg:col-span-2 lg:row-span-2" : i === 3 ? "lg:col-span-2" : undefined}
              />
            ))}
          </div>
        ) : items.length > 0 && current ? (
          <div>
            {/* tab bar */}
            <div className="flex flex-wrap gap-2">
              {items.map((item, i) => (
                <button
                  key={`${item.title}-tab-${i}`}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={i === activeIdx}
                  className={cn("rounded-xl px-4 py-2 text-sm font-semibold transition-colors", i !== activeIdx && "border")}
                  style={
                    i === activeIdx
                      ? { background: "var(--lf-accent)", color: "var(--lf-accent-contrast)" }
                      : { background: "var(--lf-surface)", borderColor: "var(--lf-border)", color: "var(--lf-muted)" }
                  }
                >
                  <span aria-hidden className="mr-1.5">
                    {item.icon}
                  </span>
                  {item.title}
                </button>
              ))}
            </div>
            {/* detail card */}
            <div
              className="mt-5 flex flex-col items-start gap-6 rounded-2xl border p-6 md:flex-row md:p-8"
              style={{ background: "var(--lf-surface)", borderColor: "var(--lf-border)" }}
            >
              <div
                className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-4xl md:size-20"
                style={{ background: "var(--lf-accent-soft)" }}
              >
                <span aria-hidden>{current.icon}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold md:text-xl" style={{ color: "var(--lf-text)" }}>
                  {current.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed md:text-base" style={{ color: "var(--lf-muted)" }}>
                  {current.body}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
