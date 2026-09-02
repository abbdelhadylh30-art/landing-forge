"use client"

import * as React from "react"
import { ChevronsUpDown, Eye, EyeOff, GripVertical, Plus, Trash2, Copy, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useForge } from "@/lib/landing/store"
import { THEMES } from "@/lib/landing/themes"
import { SECTION_META } from "@/lib/landing/types"
import type {
  Cta,
  FaqSection,
  FeaturesSection,
  FooterSection,
  GallerySection,
  HeroSection,
  LogosSection,
  NavbarSection,
  PricingSection,
  Section,
  StatsSection,
  TestimonialsSection,
  ContactSection,
  CtaFinalSection,
} from "@/lib/landing/types"

// ─── Field primitives ────────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</Label>
      {children}
      {hint && <p className="text-[10px] leading-tight text-zinc-500">{hint}</p>}
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  mono,
  maxLength,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  mono?: boolean
  maxLength?: number
}) {
  return (
    <Field label={label} hint={hint}>
      <Input
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100 focus-visible:ring-violet-500/60", mono && "font-mono text-xs")}
      />
    </Field>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
  hint,
  maxLength,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
  hint?: string
  maxLength?: number
}) {
  return (
    <Field label={label} hint={hint ?? (maxLength ? `${value.length}/${maxLength}` : undefined)}>
      <Textarea
        value={value}
        rows={rows}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="resize-none border-zinc-700/80 bg-zinc-900/60 text-[13px] leading-snug text-zinc-100 focus-visible:ring-violet-500/60"
      />
    </Field>
  )
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  hint?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-zinc-700/80 bg-zinc-900 text-zinc-100">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-[13px] focus:bg-violet-500/20">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function SwitchField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
      <div>
        <p className="text-[12px] font-medium text-zinc-200">{label}</p>
        {hint && <p className="text-[10px] text-zinc-500">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="data-[state=checked]:bg-violet-500" />
    </div>
  )
}

function CtaFields({
  cta,
  onChange,
  onRemove,
  removeLabel,
}: {
  cta: Cta
  onChange: (c: Cta) => void
  onRemove?: () => void
  removeLabel?: string
}) {
  return (
    <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Button</span>
        {onRemove && (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-rose-300 hover:bg-rose-500/10" onClick={onRemove}>
            {removeLabel ?? "Remove"}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-[1fr_100px] gap-2">
        <Input
          value={cta.label}
          placeholder="Label"
          onChange={(e) => onChange({ ...cta, label: e.target.value })}
          className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100"
        />
        <Input
          value={cta.href}
          placeholder="#href"
          onChange={(e) => onChange({ ...cta, href: e.target.value })}
          className="h-8 border-zinc-700/80 bg-zinc-900/60 font-mono text-xs text-zinc-100"
        />
      </div>
    </div>
  )
}

/** Generic list editor with collapsible cards + reorder + remove + add */
function ListEditor<T>({
  items,
  onChange,
  createItem,
  renderFields,
  itemTitle,
  max = 12,
  addLabel = "Add item",
  label,
}: {
  items: T[]
  onChange: (items: T[]) => void
  createItem: () => T
  renderFields: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode
  itemTitle: (item: T, i: number) => string
  max?: number
  addLabel?: string
  label?: string
}) {
  const [open, setOpen] = React.useState<number | null>(null)
  const updateAt = (i: number, patch: Partial<T>) => {
    const next = items.slice()
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = items.slice()
    const [x] = next.splice(i, 1)
    next.splice(j, 0, x)
    onChange(next)
    setOpen(j)
  }
  return (
    <div className="space-y-2">
      {label && <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label} ({items.length})</Label>}
      {items.map((item, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-1 px-2 py-1.5">
            <button
              type="button"
              className="flex flex-1 items-center gap-2 truncate text-left"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <ChevronsUpDown className={cn("h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform", open === i && "rotate-180")} />
              <span className="truncate text-[12px] text-zinc-200">{itemTitle(item, i)}</span>
            </button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-zinc-200" onClick={() => move(i, -1)} aria-label="Move up" disabled={i === 0}>
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-zinc-200" onClick={() => move(i, 1)} aria-label="Move down" disabled={i === items.length - 1}>
              <ArrowDown className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-500 hover:text-rose-300"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              aria-label="Remove item"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          {open === i && <div className="space-y-2.5 border-t border-zinc-800 p-2.5">{renderFields(item, (patch) => updateAt(i, patch))}</div>}
        </div>
      ))}
      {items.length < max && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full border-dashed border-zinc-700 bg-transparent text-[11px] text-zinc-400 hover:border-violet-500/50 hover:text-violet-300"
          onClick={() => {
            onChange([...items, createItem()])
            setOpen(items.length)
          }}
        >
          <Plus className="mr-1 h-3 w-3" /> {addLabel}
        </Button>
      )}
    </div>
  )
}

/** Simple list of editable strings (companies, field labels…) */
function StringListEditor({ label, items, onChange, createValue, addLabel, max = 12, placeholder }: { label?: string; items: string[]; onChange: (items: string[]) => void; createValue: () => string; addLabel?: string; max?: number; placeholder?: string }) {
  const updateAt = (i: number, v: string) => {
    const next = items.slice()
    next[i] = v
    onChange(next)
  }
  return (
    <div className="space-y-2">
      {label && <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label} ({items.length})</Label>}
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          <Input
            value={item}
            placeholder={placeholder}
            onChange={(e) => updateAt(i, e.target.value)}
            className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100"
          />
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-zinc-500 hover:text-rose-300" onClick={() => onChange(items.filter((_, idx) => idx !== i))} aria-label="Remove">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      {items.length < max && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full border-dashed border-zinc-700 bg-transparent text-[11px] text-zinc-400 hover:border-violet-500/50 hover:text-violet-300"
          onClick={() => onChange([...items, createValue()])}
        >
          <Plus className="mr-1 h-3 w-3" /> {addLabel ?? "Add"}
        </Button>
      )}
    </div>
  )
}

// ─── Per-section editors ─────────────────────────────────────────────────────

type EditorProps<S extends Section> = { section: S; update: (patch: Partial<S>) => void }

function NavbarEditor({ section, update }: EditorProps<NavbarSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Brand label override" value={section.brandLabel ?? ""} onChange={(v) => update({ brandLabel: v })} placeholder={useForge.getState().config.brand.name} hint="Empty = use page brand name" />
      <ListEditor
        label="Links"
        items={section.links}
        onChange={(links) => update({ links })}
        createItem={() => ({ label: "New link", href: "#" })}
        itemTitle={(l) => l.label}
        addLabel="Add link"
        renderFields={(l, u) => (
          <div className="grid grid-cols-[1fr_100px] gap-2">
            <Input value={l.label} onChange={(e) => u({ label: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            <Input value={l.href} onChange={(e) => u({ href: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 font-mono text-xs text-zinc-100" />
          </div>
        )}
      />
      {section.cta ? (
        <CtaFields cta={section.cta} onChange={(cta) => update({ cta })} onRemove={() => update({ cta: undefined })} removeLabel="Remove CTA" />
      ) : (
        <Button variant="outline" size="sm" className="h-7 w-full border-dashed border-zinc-700 text-[11px] text-zinc-400" onClick={() => update({ cta: { label: "Get started", href: "#cta" } })}>
          <Plus className="mr-1 h-3 w-3" /> Add nav CTA
        </Button>
      )}
    </div>
  )
}

function HeroEditor({ section, update }: EditorProps<HeroSection>) {
  const hasSecondary = Boolean(section.secondaryCta?.label)
  const ab = section.ab
  const totalWeight = ab?.variants.reduce((s, v) => s + v.weight, 0) ?? 0
  return (
    <div className="space-y-4">
      <SelectField
        label="Layout"
        value={section.layout}
        onChange={(v) => update({ layout: v })}
        options={[
          { value: "split-right", label: "Split — visual right" },
          { value: "split-left", label: "Split — visual left" },
          { value: "center", label: "Centered" },
          { value: "full-bleed", label: "Full-bleed gradient" },
        ]}
      />
      <TextField label="Badge" value={section.badge ?? ""} onChange={(v) => update({ badge: v })} placeholder="✨ Now in public beta" />
      <TextAreaField label="Headline" value={section.headline} onChange={(v) => update({ headline: v })} rows={2} maxLength={90} />
      <TextAreaField label="Sub copy" value={section.sub} onChange={(v) => update({ sub: v })} rows={3} maxLength={200} />
      <CtaFields cta={section.cta} onChange={(cta) => update({ cta })} />
      {hasSecondary ? (
        <CtaFields cta={section.secondaryCta!} onChange={(secondaryCta) => update({ secondaryCta })} onRemove={() => update({ secondaryCta: undefined })} removeLabel="Remove secondary" />
      ) : (
        <Button variant="outline" size="sm" className="h-7 w-full border-dashed border-zinc-700 text-[11px] text-zinc-400" onClick={() => update({ secondaryCta: { label: "View demo", href: "#features" } })}>
          <Plus className="mr-1 h-3 w-3" /> Add secondary CTA
        </Button>
      )}
      <TextField label="Image URL" value={section.image ?? ""} onChange={(v) => update({ image: v })} placeholder="https://… (empty = generated mockup)" mono />
      <ListEditor
        label="Trust stats"
        items={section.stats ?? []}
        onChange={(stats) => update({ stats })}
        createItem={() => ({ value: "10k+", label: "new stat" })}
        itemTitle={(s) => `${s.value} · ${s.label}`}
        addLabel="Add stat"
        max={4}
        renderFields={(s, u) => (
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <Input value={s.value} onChange={(e) => u({ value: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            <Input value={s.label} onChange={(e) => u({ label: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
          </div>
        )}
      />

      {/* A/B testing */}
      <div className="space-y-3 rounded-lg border border-violet-500/25 bg-violet-500/5 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold text-violet-200">🧪 A/B test this hero</p>
            <p className="text-[10px] text-zinc-500">Weighted variants with auto-winner</p>
          </div>
          <Switch
            checked={ab?.enabled ?? false}
            onCheckedChange={(enabled) =>
              update({
                ab: {
                  ...(ab ?? { metric: "cta_click", autoWinner: true, sampleSize: 500, variants: [] }),
                  enabled,
                  variants:
                    (ab?.variants ?? []).length >= 2
                      ? ab!.variants
                      : [
                          { id: "va", name: "A", headline: section.headline, sub: "", ctaLabel: "", weight: 50 },
                          { id: "vb", name: "B", headline: "Deploy your product in 30 seconds", sub: "", ctaLabel: "", weight: 50 },
                        ],
                },
              })
            }
            className="data-[state=checked]:bg-violet-500"
          />
        </div>
        {ab?.enabled && (
          <>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Sample size</Label>
                <Input
                  type="number"
                  min={50}
                  step={50}
                  value={ab.sampleSize}
                  onChange={(e) => update({ ab: { ...ab, sampleSize: Math.max(50, Number(e.target.value) || 500) } })}
                  className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100"
                />
              </div>
              <div className="flex-1">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Metric</Label>
                <div className="flex h-8 items-center rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2 font-mono text-[11px] text-violet-300">{ab.metric}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className={cn("font-medium", totalWeight === 100 ? "text-emerald-300" : "text-amber-300")}>
                Total weight: {totalWeight}% {totalWeight !== 100 && "(should be 100)"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[10px] text-violet-300 hover:bg-violet-500/10"
                onClick={() => {
                  const w = Math.floor(100 / ab.variants.length)
                  update({ ab: { ...ab, variants: ab.variants.map((v, i) => ({ ...v, weight: i === ab.variants.length - 1 ? 100 - w * (ab.variants.length - 1) : w })) } })
                }}
              >
                Distribute evenly
              </Button>
            </div>
            <ListEditor
              items={ab.variants}
              onChange={(variants) => update({ ab: { ...ab, variants } })}
              createItem={() => ({
                id: `v${Math.random().toString(36).slice(2, 6)}`,
                name: String.fromCharCode(65 + ab.variants.length),
                headline: "New variant headline",
                sub: "",
                ctaLabel: "",
                weight: 0,
              })}
              itemTitle={(v) => `Variant ${v.name} · ${v.weight}%`}
              addLabel="Add variant"
              max={4}
              renderFields={(v, u) => (
                <div className="space-y-2">
                  <div className="grid grid-cols-[70px_1fr_70px] gap-2">
                    <Input value={v.name} onChange={(e) => u({ name: e.target.value.slice(0, 2) })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
                    <Input type="number" value={v.weight} min={0} max={100} onChange={(e) => u({ weight: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
                    <div className="flex h-8 items-center text-[10px] text-zinc-500">weight %</div>
                  </div>
                  <Input value={v.headline} onChange={(e) => u({ headline: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" placeholder="Headline" />
                  <Input value={v.sub ?? ""} onChange={(e) => u({ sub: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" placeholder="Sub override (optional)" />
                  <Input value={v.ctaLabel ?? ""} onChange={(e) => u({ ctaLabel: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" placeholder="CTA label override (optional)" />
                </div>
              )}
            />
            <SwitchField label="Auto-promote winner" checked={ab.autoWinner} onChange={(autoWinner) => update({ ab: { ...ab, autoWinner } })} hint="Auto-promote the winning variant when sample size is reached" />
          </>
        )}
      </div>
    </div>
  )
}

function LogosEditor({ section, update }: EditorProps<LogosSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} placeholder="Trusted by teams at" />
      <StringListEditor
        label="Companies"
        items={section.items}
        onChange={(items) => update({ items })}
        createValue={() => "Company"}
        addLabel="Add company"
        placeholder="Company name"
      />
    </div>
  )
}

function FeaturesEditor({ section, update }: EditorProps<FeaturesSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
      <SelectField
        label="Style"
        value={section.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "grid", label: "Grid" },
          { value: "alternating", label: "Alternating rows" },
          { value: "bento", label: "Bento" },
          { value: "tabs", label: "Tabs (interactive)" },
          { value: "carousel", label: "Carousel" },
        ]}
      />
      {section.style === "grid" && (
        <SelectField
          label="Columns"
          value={String(section.columns ?? 3)}
          onChange={(v) => update({ columns: Number(v) })}
          options={[
            { value: "2", label: "2 columns" },
            { value: "3", label: "3 columns" },
            { value: "4", label: "4 columns" },
          ]}
        />
      )}
      <ListEditor
        label="Features"
        items={section.items}
        onChange={(items) => update({ items })}
        createItem={() => ({ icon: "⚡", title: "New feature", body: "Describe the benefit." })}
        itemTitle={(f) => `${f.icon} ${f.title}`}
        addLabel="Add feature"
        renderFields={(f, u) => (
          <div className="space-y-2">
            <div className="grid grid-cols-[64px_1fr] gap-2">
              <Input value={f.icon} onChange={(e) => u({ icon: e.target.value.slice(0, 2) })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
              <Input value={f.title} onChange={(e) => u({ title: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            </div>
            <Textarea value={f.body} rows={2} onChange={(e) => u({ body: e.target.value })} className="resize-none border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
          </div>
        )}
      />
    </div>
  )
}

function StatsEditor({ section, update }: EditorProps<StatsSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <ListEditor
        label="Stats"
        items={section.items}
        onChange={(items) => update({ items })}
        createItem={() => ({ value: "100+", label: "new stat", delta: "" })}
        itemTitle={(s) => `${s.value} · ${s.label}`}
        addLabel="Add stat"
        max={6}
        renderFields={(s, u) => (
          <div className="space-y-2">
            <div className="grid grid-cols-[90px_1fr] gap-2">
              <Input value={s.value} onChange={(e) => u({ value: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
              <Input value={s.label} onChange={(e) => u({ label: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            </div>
            <Input value={s.delta ?? ""} onChange={(e) => u({ delta: e.target.value })} placeholder="Delta e.g. +12% this quarter" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
          </div>
        )}
      />
    </div>
  )
}

function TestimonialsEditor({ section, update }: EditorProps<TestimonialsSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
      <SelectField
        label="Style"
        value={section.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "grid", label: "Grid" },
          { value: "marquee", label: "Marquee (scrolling)" },
          { value: "spotlight", label: "Spotlight" },
          { value: "video", label: "Video cards" },
          { value: "logo-wall", label: "Logo wall" },
        ]}
      />
      <ListEditor
        label="Testimonials"
        items={section.items}
        onChange={(items) => update({ items })}
        createItem={() => ({ quote: "Great product!", author: "New Author", role: "Title, Company", initials: "", rating: 5 })}
        itemTitle={(t) => `${t.author} ${"★".repeat(t.rating ?? 5)}`}
        addLabel="Add testimonial"
        renderFields={(t, u) => (
          <div className="space-y-2">
            <Textarea value={t.quote} rows={3} onChange={(e) => u({ quote: e.target.value })} className="resize-none border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={t.author} onChange={(e) => u({ author: e.target.value })} placeholder="Author" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
              <Input value={t.role} onChange={(e) => u({ role: e.target.value })} placeholder="Role" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Rating</Label>
                <Slider
                  value={[t.rating ?? 5]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={([r]) => u({ rating: r })}
                  className="[&_[data-slot=slider-range]]:bg-violet-500"
                />
              </div>
              <span className="text-[13px] text-amber-300">{"★".repeat(t.rating ?? 5)}</span>
            </div>
          </div>
        )}
      />
    </div>
  )
}

function PricingEditor({ section, update }: EditorProps<PricingSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
      <SwitchField label="Annual toggle" checked={section.annualToggle ?? false} onChange={(annualToggle) => update({ annualToggle })} hint="Switch with 20% annual discount" />
      {section.annualToggle && <TextField label="Discount label" value={section.annualDiscountLabel ?? ""} onChange={(v) => update({ annualDiscountLabel: v })} placeholder="Save 20% annually" />}
      <ListEditor
        label="Plans"
        items={section.plans}
        onChange={(plans) => update({ plans })}
        createItem={() => ({ name: "New plan", price: "$19", period: "/mo", description: "", features: ["Feature one"], ctaLabel: "Choose plan" })}
        itemTitle={(p) => `${p.name} ${p.highlighted ? "★" : ""}`}
        addLabel="Add plan"
        max={5}
        renderFields={(p, u) => (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_90px_60px] gap-2">
              <Input value={p.name} onChange={(e) => u({ name: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
              <Input value={p.price} onChange={(e) => u({ price: e.target.value })} placeholder="$29" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
              <Input value={p.period ?? ""} onChange={(e) => u({ period: e.target.value })} placeholder="/mo" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            </div>
            <Input value={p.description ?? ""} onChange={(e) => u({ description: e.target.value })} placeholder="Short description" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            <Textarea
              value={p.features.join("\n")}
              rows={4}
              placeholder="One feature per line"
              onChange={(e) => u({ features: e.target.value.split("\n").filter((x) => x.trim() !== "") })}
              className="resize-none border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100"
            />
            <div className="grid grid-cols-[1fr_auto] items-center gap-2">
              <Input value={p.ctaLabel ?? ""} onChange={(e) => u({ ctaLabel: e.target.value })} placeholder="CTA label" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
              <div className="flex h-9 items-center gap-1.5">
                <Switch checked={p.highlighted ?? false} onCheckedChange={(highlighted) => u({ highlighted })} className="data-[state=checked]:bg-violet-500" />
                <span className="text-[10px] text-zinc-400">Highlight</span>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  )
}

function FaqEditor({ section, update }: EditorProps<FaqSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
      <SelectField
        label="Style"
        value={section.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "accordion", label: "Accordion" },
          { value: "twocol", label: "Two columns" },
        ]}
      />
      <ListEditor
        label="Questions"
        items={section.items}
        onChange={(items) => update({ items })}
        createItem={() => ({ q: "New question?", a: "The answer." })}
        itemTitle={(f) => f.q}
        addLabel="Add question"
        renderFields={(f, u) => (
          <div className="space-y-2">
            <Input value={f.q} onChange={(e) => u({ q: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            <Textarea value={f.a} rows={3} onChange={(e) => u({ a: e.target.value })} className="resize-none border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
          </div>
        )}
      />
    </div>
  )
}

function GalleryEditor({ section, update }: EditorProps<GallerySection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
      <SelectField
        label="Style"
        value={section.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "masonry", label: "Masonry" },
          { value: "carousel", label: "Carousel (swipeable)" },
        ]}
      />
      <ListEditor
        label="Images"
        items={section.items}
        onChange={(items) => update({ items })}
        createItem={() => ({ src: "", alt: "New image", hue: String(Math.floor(Math.random() * 360)), caption: "" })}
        itemTitle={(g) => g.caption || g.alt}
        addLabel="Add image"
        renderFields={(g, u) => (
          <div className="space-y-2">
            <TextField label="Image URL (optional)" value={g.src ?? ""} onChange={(src) => u({ src })} placeholder="https://…" mono />
            <div className="grid grid-cols-2 gap-2">
              <Input value={g.alt} onChange={(e) => u({ alt: e.target.value })} placeholder="Alt text" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
              <Input value={g.caption ?? ""} onChange={(e) => u({ caption: e.target.value })} placeholder="Caption" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            </div>
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-12 shrink-0 rounded-md border border-zinc-700"
                style={{ background: `linear-gradient(135deg, hsl(${g.hue ?? 260} 70% 45%), hsl(${Number(g.hue ?? 260) + 40} 80% 62%))` }}
              />
              <Slider
                value={[Number(g.hue ?? 260)]}
                min={0}
                max={360}
                step={1}
                onValueChange={([h]) => u({ hue: String(h) })}
                className="flex-1 [&_[data-slot=slider-range]]:bg-violet-500"
              />
              <span className="w-8 text-right font-mono text-[10px] text-zinc-400">{g.hue}</span>
            </div>
          </div>
        )}
      />
    </div>
  )
}

function ContactEditor({ section, update }: EditorProps<ContactSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
      <TextField label="Email" value={section.email ?? ""} onChange={(v) => update({ email: v })} placeholder="hello@example.com" mono />
      <TextField label="Phone" value={section.phone ?? ""} onChange={(v) => update({ phone: v })} placeholder="+1 …" mono />
      <StringListEditor
        label="Form fields"
        items={section.fields}
        onChange={(fields) => update({ fields })}
        createValue={() => "New field"}
        addLabel="Add field"
        placeholder="Field label"
      />
      <TextField label="Submit label" value={section.submitLabel} onChange={(v) => update({ submitLabel: v })} />
    </div>
  )
}

function CtaFinalEditor({ section, update }: EditorProps<CtaFinalSection>) {
  return (
    <div className="space-y-4">
      <TextAreaField label="Headline" value={section.headline} onChange={(v) => update({ headline: v })} rows={2} maxLength={70} />
      <TextAreaField label="Sub copy" value={section.sub ?? ""} onChange={(v) => update({ sub: v })} rows={2} maxLength={140} />
      <CtaFields cta={section.cta} onChange={(cta) => update({ cta })} />
      <TextField label="Note" value={section.note ?? ""} onChange={(v) => update({ note: v })} placeholder="No credit card required" />
    </div>
  )
}

function FooterEditor({ section, update }: EditorProps<FooterSection>) {
  return (
    <div className="space-y-4">
      <SelectField
        label="Style"
        value={section.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "minimal", label: "Minimal" },
          { value: "mega", label: "Mega" },
          { value: "newsletter", label: "Newsletter" },
        ]}
      />
      <TextAreaField label="Tagline" value={section.tagline ?? ""} onChange={(v) => update({ tagline: v })} rows={2} />
      <ListEditor
        label="Link groups"
        items={section.linkGroups}
        onChange={(linkGroups) => update({ linkGroups })}
        createItem={() => ({ group: "New group", items: [{ label: "Link", href: "#" }] })}
        itemTitle={(g) => g.group}
        addLabel="Add group"
        max={5}
        renderFields={(g, u) => (
          <div className="space-y-2">
            <Input value={g.group} onChange={(e) => u({ group: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            <ListEditor
              items={g.items}
              onChange={(items) => u({ items })}
              createItem={() => ({ label: "Link", href: "#" })}
              itemTitle={(l) => l.label}
              addLabel="Add link"
              renderFields={(l, uu) => (
                <div className="grid grid-cols-[1fr_90px] gap-2">
                  <Input value={l.label} onChange={(e) => uu({ label: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
                  <Input value={l.href} onChange={(e) => uu({ href: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 font-mono text-xs text-zinc-100" />
                </div>
              )}
            />
          </div>
        )}
      />
      <TextField label="Social (comma separated)" value={(section.social ?? []).join(", ")} onChange={(v) => update({ social: v.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="X, GitHub, Discord" />
      <TextField label="Copyright" value={section.copyright ?? ""} onChange={(v) => update({ copyright: v })} />
    </div>
  )
}

// ─── Section switch ──────────────────────────────────────────────────────────

function SectionEditor({ section }: { section: Section }) {
  const update = (patch: Partial<Section>) => {
    useForge.getState().updateSection(section.id, patch as Partial<Section>)
  }
  switch (section.type) {
    case "navbar":
      return <NavbarEditor section={section} update={update as unknown as (p: Partial<NavbarSection>) => void} />
    case "hero":
      return <HeroEditor section={section} update={update as unknown as (p: Partial<HeroSection>) => void} />
    case "logos":
      return <LogosEditor section={section} update={update as unknown as (p: Partial<LogosSection>) => void} />
    case "features":
      return <FeaturesEditor section={section} update={update as unknown as (p: Partial<FeaturesSection>) => void} />
    case "stats":
      return <StatsEditor section={section} update={update as unknown as (p: Partial<StatsSection>) => void} />
    case "testimonials":
      return <TestimonialsEditor section={section} update={update as unknown as (p: Partial<TestimonialsSection>) => void} />
    case "pricing":
      return <PricingEditor section={section} update={update as unknown as (p: Partial<PricingSection>) => void} />
    case "faq":
      return <FaqEditor section={section} update={update as unknown as (p: Partial<FaqSection>) => void} />
    case "gallery":
      return <GalleryEditor section={section} update={update as unknown as (p: Partial<GallerySection>) => void} />
    case "contact":
      return <ContactEditor section={section} update={update as unknown as (p: Partial<ContactSection>) => void} />
    case "cta-final":
      return <CtaFinalEditor section={section} update={update as unknown as (p: Partial<CtaFinalSection>) => void} />
    case "footer":
      return <FooterEditor section={section} update={update as unknown as (p: Partial<FooterSection>) => void} />
  }
}

// ─── Page settings tab ───────────────────────────────────────────────────────

function PageSettings() {
  const config = useForge((s) => s.config)
  const setTheme = useForge((s) => s.setTheme)
  const updateBrand = useForge((s) => s.updateBrand)
  const updateSeo = useForge((s) => s.updateSeo)
  return (
    <div className="space-y-5">
      <TextField label="Brand name" value={config.brand.name} onChange={(name) => updateBrand({ name })} maxLength={40} />
      <TextField label="Tagline" value={config.brand.tagline ?? ""} onChange={(tagline) => updateBrand({ tagline })} />
      <TextField label="SEO title" value={config.seo.title} onChange={(title) => updateSeo({ title })} maxLength={70} hint={`${config.seo.title.length}/70 — shown in search results & link previews`} />
      <TextAreaField label="SEO description" value={config.seo.description} onChange={(description) => updateSeo({ description })} rows={3} maxLength={160} hint={`${config.seo.description.length}/160`} />
      <div className="space-y-2">
        <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">One-click theme</Label>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={cn(
                "group rounded-lg border p-2 text-left transition-all hover:border-violet-500/60",
                config.themeId === t.id ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/40" : "border-zinc-800 bg-zinc-900/40"
              )}
              aria-pressed={config.themeId === t.id}
            >
              <div className="mb-1.5 flex gap-1">
                {t.swatch.map((c) => (
                  <span key={c} className="h-4 flex-1 rounded-sm border border-black/20" style={{ background: c }} />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-200">{t.name}</span>
                {t.mode === "light" && <Badge variant="outline" className="h-4 px-1 text-[8px] text-zinc-400">light</Badge>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export function PropertiesPanel({ className }: { className?: string }) {
  const sections = useForge((s) => s.config.sections)
  const selectedId = useForge((s) => s.selectedSectionId)
  const toggleHidden = useForge((s) => s.toggleHidden)
  const duplicateSection = useForge((s) => s.duplicateSection)
  const removeSection = useForge((s) => s.removeSection)
  const selected = sections.find((s) => s.id === selectedId) ?? null

  return (
    <div className={cn("lf-fade-up flex min-h-0 flex-col bg-zinc-950", className)}>
      <Tabs defaultValue="section" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-3 mt-3 grid h-8 grid-cols-2 bg-zinc-900">
          <TabsTrigger value="section" className="text-[11px] data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200">Section</TabsTrigger>
          <TabsTrigger value="page" className="text-[11px] data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200">Page & theme</TabsTrigger>
        </TabsList>
        <TabsContent value="page" className="lf-scroll min-h-0 flex-1 overflow-y-auto p-3">
          <PageSettings />
        </TabsContent>
        <TabsContent value="section" className="lf-scroll min-h-0 flex-1 overflow-y-auto">
          {!selected ? (
            <div className="lf-fade-in flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
              <GripVertical className="h-6 w-6 text-zinc-700" />
              <p className="text-[12px] text-zinc-500">Select a section on the left or click it in the preview to edit its properties.</p>
            </div>
          ) : (
            <div key={selectedId} className="lf-fade-in space-y-4 p-3">
              <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5">
                <span className="text-lg leading-none">{SECTION_META[selected.type].icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-zinc-100">{SECTION_META[selected.type].label}</p>
                  <p className="truncate font-mono text-[10px] text-zinc-500">{selected.id.slice(0, 22)}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-100" onClick={() => toggleHidden(selected.id)} aria-label={selected.hidden ? "Show section" : "Hide section"} title={selected.hidden ? "Show" : "Hide"}>
                  {selected.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-100" onClick={() => duplicateSection(selected.id)} aria-label="Duplicate section" title="Duplicate">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-rose-300" onClick={() => removeSection(selected.id)} aria-label="Delete section" title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {selected.hidden && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-300">Hidden — not rendered in the live preview.</div>
              )}
              <SectionEditor section={selected} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
