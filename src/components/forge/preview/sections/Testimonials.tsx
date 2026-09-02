"use client"

import { Star } from "lucide-react"

import type { TestimonialItem, TestimonialsSection } from "@/lib/landing/types"

import { cn } from "@/lib/utils"

import { CONTAINER, SECTION_PAD, SectionHeader } from "../shared"

export interface TestimonialsProps {
  section: TestimonialsSection
}

function initialsOf(author: string): string {
  const parts = author
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return "•"
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase()
}

function Stars({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <div className="flex gap-0.5" aria-label={`${r} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className="size-3.5"
          strokeWidth={1.5}
          fill={i < r ? "currentColor" : "none"}
          style={{ color: i < r ? "var(--lf-accent)" : "var(--lf-border)" }}
        />
      ))}
    </div>
  )
}

interface TestimonialCardProps {
  item: TestimonialItem
  compact?: boolean
  className?: string
}

function TestimonialCard({ item, compact = false, className }: TestimonialCardProps) {
  const initials = item.initials?.trim() || initialsOf(item.author)
  return (
    <figure
      className={cn("flex h-full flex-col rounded-2xl border p-5", className)}
      style={{ background: "var(--lf-surface)", borderColor: "var(--lf-border)" }}
    >
      <Stars rating={item.rating ?? 5} />
      <blockquote className={cn("mt-3 leading-relaxed", compact ? "text-sm" : "text-sm md:text-[15px]")} style={{ color: "var(--lf-text)" }}>
        {item.quote}
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3 pt-5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}
        >
          {initials}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold" style={{ color: "var(--lf-text)" }}>
            {item.author}
          </span>
          <span className="block truncate text-xs" style={{ color: "var(--lf-muted)" }}>
            {item.role}
          </span>
        </span>
      </figcaption>
    </figure>
  )
}

/** Infinite horizontal marquee (animation defined in globals.css). */
function Marquee({ items }: { items: TestimonialItem[] }) {
  const doubled = [...items, ...items]
  return (
    <div
      className="relative overflow-hidden py-1"
      style={{
        maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
      }}
    >
      <div className="lf-marquee-track flex w-max">
        {doubled.map((t, i) => (
          <TestimonialCard key={i} item={t} className="mr-5 w-[300px] shrink-0 md:w-[340px]" />
        ))}
      </div>
    </div>
  )
}

/** First testimonial huge, the rest in a compact grid. */
function Spotlight({ items }: { items: TestimonialItem[] }) {
  if (items.length === 0) return null
  const [first, ...rest] = items
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <figure
        className="relative rounded-2xl border p-6 md:p-10"
        style={{ background: "var(--lf-surface)", borderColor: "var(--lf-border)" }}
      >
        <span
          aria-hidden
          className="absolute left-4 top-2 select-none font-serif text-6xl leading-none md:left-6 md:text-7xl"
          style={{ color: "var(--lf-accent)", opacity: 0.5 }}
        >
          &ldquo;
        </span>
        <Stars rating={first.rating ?? 5} />
        <blockquote className="relative mt-3 text-xl font-medium leading-relaxed md:text-2xl" style={{ color: "var(--lf-text)" }}>
          {first.quote}
        </blockquote>
        <figcaption className="mt-6 flex items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}
          >
            {first.initials?.trim() || initialsOf(first.author)}
          </span>
          <span>
            <span className="block text-sm font-semibold" style={{ color: "var(--lf-text)" }}>
              {first.author}
            </span>
            <span className="block text-xs" style={{ color: "var(--lf-muted)" }}>
              {first.role}
            </span>
          </span>
        </figcaption>
      </figure>
      {rest.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
          {rest.map((t, i) => (
            <TestimonialCard key={i} item={t} compact />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function Testimonials({ section }: TestimonialsProps) {
  const items = section.items ?? []
  const isMarquee = section.style === "marquee" && items.length > 0

  return (
    <section className={SECTION_PAD}>
      <div className={CONTAINER}>
        <SectionHeader title={section.title} subtitle={section.subtitle} center />
      </div>
      {isMarquee ? (
        <Marquee items={items} />
      ) : (
        <div className={CONTAINER}>
          {section.style === "grid" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
              {items.map((t, i) => (
                <TestimonialCard key={i} item={t} />
              ))}
            </div>
          ) : (
            <Spotlight items={items} />
          )}
        </div>
      )}
    </section>
  )
}
