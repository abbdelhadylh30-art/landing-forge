"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BarChart3, Crown, Download, Globe2, Loader2, Mail, MonitorSmartphone, MousePointerClick, Sparkles, Timer, TrendingDown, TrendingUp, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useForge } from "@/lib/landing/store"
import type { AnalyticsPayload, LeadRecord } from "@/lib/landing/types"

const ACCENT = "#A78BFA"
const ACCENT2 = "#f0abfc"
const GREEN = "#34d399"

function countryFlag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "🌐"
  return String.fromCodePoint(...[...code].map((c) => 127397 + c.charCodeAt(0)))
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k"
  return String(Math.round(n))
}

function fmtDuration(s: number): string {
  if (!s) return "0s"
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return m ? `${m}m ${sec}s` : `${sec}s`
}

function StatCard({ icon: Icon, label, value, delta, deltaUp, hint }: { icon: typeof Users; label: string; value: string; delta?: string; deltaUp?: boolean; hint?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-all hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-zinc-900/70">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
        <Icon className="h-4 w-4 text-violet-300/70" />
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-50">{value}</p>
      {delta && (
        <p className={cn("mt-1 flex items-center gap-1 text-[11px]", deltaUp ? "text-emerald-400" : "text-rose-400")}>
          {deltaUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {delta}
        </p>
      )}
      {hint && <p className="mt-1 text-[10px] text-zinc-600">{hint}</p>}
    </div>
  )
}

function PanelCard({ title, icon: Icon, children, actions }: { title: string; icon: typeof Globe2; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-violet-300" />
        <h3 className="text-[13px] font-semibold text-zinc-100">{title}</h3>
        <div className="ml-auto">{actions}</div>
      </div>
      {children}
    </div>
  )
}

const CHART_TOOLTIP = {
  contentStyle: {
    background: "#18181b",
    border: "1px solid #3f3f46",
    borderRadius: "8px",
    fontSize: "11px",
    color: "#e4e4e7",
  },
  labelStyle: { color: "#a1a1aa" },
} as const

export function DashboardView() {
  const projectId = useForge((s) => s.project.id)
  const projectName = useForge((s) => s.project.name)
  const slug = useForge((s) => s.project.slug)
  const updateSection = useForge((s) => s.updateSection)
  const sections = useForge((s) => s.config.sections)

  const [data, setData] = React.useState<AnalyticsPayload | null>(null)
  const [leads, setLeads] = React.useState<LeadRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [seeding, setSeeding] = React.useState(false)
  const [days, setDays] = React.useState("30")

  const load = React.useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?projectId=${projectId}&days=${days}`)
      const payload = (await res.json()) as AnalyticsPayload
      setData(payload)
    } catch {
      toast.error("Could not load analytics")
    } finally {
      setLoading(false)
    }
    try {
      const res = await fetch(`/api/leads?projectId=${projectId}&take=50`)
      const out = (await res.json()) as { leads?: LeadRecord[] }
      setLeads(out.leads ?? [])
    } catch {
      /* leads inbox is best-effort */
    }
  }, [projectId, days])

  React.useEffect(() => {
    void load()
  }, [load])

  const seed = async () => {
    if (!projectId) return
    setSeeding(true)
    try {
      const res = await fetch("/api/analytics/seed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, days: Number(days) }),
      })
      const out = (await res.json()) as { pageviews?: number; events?: number; leads?: number; error?: string }
      if (!res.ok) throw new Error(out.error)
      toast.success("Demo traffic generated 🌍", { description: `${fmtNum(out.pageviews ?? 0)} pageviews · ${fmtNum(out.events ?? 0)} events · ${out.leads ?? 0} leads` })
      await load()
    } catch (e) {
      toast.error("Seeding failed", { description: e instanceof Error ? e.message : undefined })
    } finally {
      setSeeding(false)
    }
  }

  const promoteWinner = async () => {
    const hero = sections.find((s) => s.type === "hero" && s.ab?.enabled)
    if (!hero || hero.type !== "hero" || !data?.ab?.winner) return
    const winnerVariant = data.ab.variants.find((v) => v.name === data.ab!.winner)
    if (!winnerVariant) return
    updateSection(hero.id, {
      headline: winnerVariant.headline,
      ab: { ...hero.ab!, enabled: false },
    })
    if (projectId) {
      // persist the promoted config so analytics & reloads agree (await before refetch)
      const updated = useForge.getState().config
      try {
        await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: useForge.getState().project.name, config: updated }),
        })
      } catch {
        /* keep local update even if persist fails */
      }
      void fetch("/api/analytics/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, type: "promote_winner", label: `Promoted variant ${data.ab.winner}`, variant: data.ab.winner }),
      })
    }
    toast.success(`Variant ${data.ab.winner} promoted 👑`, { description: "Winning headline applied to the hero; test paused." })
    await load()
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          <p className="text-[12px]">Loading analytics…</p>
        </div>
      </div>
    )
  }

  const stats = data?.stats
  const hasData = (stats?.pageviews ?? 0) > 0
  const funnelMax = Math.max(1, ...(data?.funnel.map((f) => f.count) ?? [1]))

  return (
    <div className="lf-scroll min-h-0 flex-1 overflow-y-auto bg-zinc-950">
      <div className="mx-auto max-w-6xl space-y-4 p-4 pb-16 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-50">
              <BarChart3 className="h-5 w-5 text-violet-300" /> Analytics — {projectName}
            </h2>
            <p className="text-[11px] text-zinc-500">
              Privacy-friendly · no cookies · GDPR-safe · <span className="font-mono">/{slug}/dashboard</span>
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="h-8 w-24 border-zinc-800 bg-zinc-900 text-[12px] text-zinc-200" aria-label="Date range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                <SelectItem value="7" className="text-[12px] focus:bg-violet-500/20">Last 7 days</SelectItem>
                <SelectItem value="30" className="text-[12px] focus:bg-violet-500/20">Last 30 days</SelectItem>
                <SelectItem value="90" className="text-[12px] focus:bg-violet-500/20">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 border-zinc-800 bg-zinc-900 text-[11px] text-zinc-200 hover:border-violet-500/50" onClick={seed} disabled={seeding}>
              {seeding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 text-amber-300" />} Simulate traffic
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-zinc-800 bg-zinc-900 text-[11px] text-zinc-200 hover:border-violet-500/50"
              onClick={() => projectId && window.open(`/api/analytics/export?projectId=${projectId}`, "_blank")}
              disabled={!hasData}
            >
              <Download className="h-3 w-3" /> Export CSV
            </Button>
          </div>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-800 py-20 text-center">
            <Globe2 className="h-10 w-10 text-zinc-700" />
            <div>
              <p className="text-[15px] font-semibold text-zinc-200">No traffic yet</p>
              <p className="mt-1 max-w-sm text-[12px] text-zinc-500">
                Use “Test preview” in the Studio to record real pageviews & CTA clicks, or generate a realistic 30-day demo dataset.
              </p>
            </div>
            <Button size="sm" className="gap-1.5 bg-violet-500 text-white hover:bg-violet-600" onClick={seed} disabled={seeding}>
              {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />} Generate demo traffic
            </Button>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="lf-fade-up-stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div style={{ animationDelay: "0ms" }}>
                <StatCard icon={BarChart3} label="Pageviews" value={fmtNum(stats!.pageviews)} />
              </div>
              <div style={{ animationDelay: "60ms" }}>
                <StatCard icon={Users} label="Unique visitors" value={fmtNum(stats!.uniqueVisitors)} />
              </div>
              <div style={{ animationDelay: "120ms" }}>
                <StatCard icon={TrendingDown} label="Bounce rate" value={`${Math.round(stats!.bounceRate * 100)}%`} />
              </div>
              <div style={{ animationDelay: "180ms" }}>
                <StatCard icon={Timer} label="Avg. duration" value={fmtDuration(stats!.avgDuration)} />
              </div>
              <div style={{ animationDelay: "240ms" }}>
                <StatCard icon={MousePointerClick} label="CTA clicks" value={fmtNum(stats!.ctaClicks)} />
              </div>
              <div style={{ animationDelay: "300ms" }}>
                <StatCard icon={Sparkles} label="Conversion" value={`${(stats!.conversionRate * 100).toFixed(1)}%`} hint="clicks / pageviews" />
              </div>
            </div>

            {/* Traffic chart */}
            <div className="lf-fade-up" style={{ animationDelay: "340ms" }}>
              <PanelCard title={`Traffic — last ${days} days`} icon={BarChart3}>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data!.timeseries} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                      <defs>
                        <linearGradient id="lfViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="lfClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={GREEN} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={GREEN} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#71717a", fontSize: 10 }}
                        tickFormatter={(d: string) => d.slice(5)}
                        axisLine={{ stroke: "#3f3f46" }}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip {...CHART_TOOLTIP} />
                      <Area type="monotone" dataKey="views" name="Pageviews" stroke={ACCENT} strokeWidth={2} fill="url(#lfViews)" />
                      <Area type="monotone" dataKey="clicks" name="CTA clicks" stroke={GREEN} strokeWidth={2} fill="url(#lfClicks)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </PanelCard>
            </div>

            <div className="lf-fade-up-stagger grid gap-4 lg:grid-cols-3">
              {/* Devices */}
              <div style={{ animationDelay: "380ms" }}>
                <PanelCard title="Devices" icon={MonitorSmartphone}>
                  <div className="flex h-44 items-center">
                    <div className="h-full w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data!.devices} dataKey="count" nameKey="name" innerRadius={38} outerRadius={58} paddingAngle={3} strokeWidth={0}>
                            {data!.devices.map((_, i) => (
                              <Cell key={i} fill={[ACCENT, ACCENT2, "#86198f"][i % 3]} />
                            ))}
                          </Pie>
                          <Tooltip {...CHART_TOOLTIP} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="w-1/2 space-y-1.5">
                      {data!.devices.map((d, i) => (
                        <li key={d.name} className="flex items-center gap-2 text-[12px] text-zinc-300">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: [ACCENT, ACCENT2, "#86198f"][i % 3] }} />
                          <span className="flex-1 capitalize">{d.name}</span>
                          <span className="font-mono text-zinc-500">{Math.round((d.count / Math.max(1, stats!.pageviews)) * 100)}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </PanelCard>
              </div>

              {/* Visitor countries */}
              <div style={{ animationDelay: "440ms" }}>
                <PanelCard title="Visitor map" icon={Globe2}>
                  <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {data!.countries.slice(0, 8).map((c) => {
                      const pct = (c.count / Math.max(1, stats!.pageviews)) * 100
                      return (
                        <li key={c.name} className="flex items-center gap-2">
                          <span className="w-6 text-center text-base leading-none">{countryFlag(c.name)}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-zinc-300">{c.name}</span>
                              <span className="font-mono text-zinc-500">{fmtNum(c.count)}</span>
                            </div>
                            <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
                              <div className="h-full rounded-full bg-violet-400/70" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </PanelCard>
              </div>

              {/* Referrers */}
              <div style={{ animationDelay: "500ms" }}>
                <PanelCard title="Top referrers" icon={Globe2}>
                  <ul className="space-y-1.5">
                    {data!.referrers.slice(0, 7).map((r) => {
                      const pct = (r.count / Math.max(1, stats!.pageviews)) * 100
                      return (
                        <li key={r.name} className="flex items-center gap-2">
                          <span className="w-28 truncate font-mono text-[11px] text-zinc-400">{r.name}</span>
                          <div className="h-4 flex-1 overflow-hidden rounded bg-zinc-800">
                            <div className="flex h-full items-center justify-end rounded bg-gradient-to-r from-violet-500/40 to-fuchsia-500/60 pr-1.5" style={{ width: `${Math.max(12, pct)}%` }}>
                              <span className="text-[9px] font-semibold text-white/90">{fmtNum(r.count)}</span>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </PanelCard>
              </div>
            </div>

            <div className="lf-fade-up-stagger grid gap-4 lg:grid-cols-2">
              {/* Funnel */}
              <div style={{ animationDelay: "560ms" }}>
                <PanelCard title="Conversion funnel" icon={MousePointerClick}>
                  <ul className="space-y-3">
                    {data!.funnel.map((f, i) => (
                      <li key={f.label}>
                        <div className="mb-1 flex justify-between text-[11px]">
                          <span className="text-zinc-300" title={i === 1 ? "Counts each section interaction — can exceed pageviews by design" : undefined}>
                            {i + 1}. {f.label}
                            {i === 1 && <span className="ml-1 text-[9px] text-zinc-600">(interactions)</span>}
                          </span>
                          <span className="font-mono text-zinc-400">
                            {fmtNum(f.count)} · {Math.round((f.count / funnelMax) * 100)}%
                          </span>
                        </div>
                        <div className="h-6 overflow-hidden rounded-md bg-zinc-800/60">
                          <div
                            className="flex h-full items-center rounded-md bg-gradient-to-r from-violet-500 to-fuchsia-500/80 px-2 transition-all"
                            style={{ width: `${Math.max(3, (f.count / funnelMax) * 100)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </PanelCard>
              </div>

              {/* A/B test */}
              <div style={{ animationDelay: "620ms" }}>
                <PanelCard
                  title="A/B test — hero"
                  icon={Sparkles}
                  actions={
                    data!.ab?.winner ? (
                      <Button size="sm" className="h-6 gap-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-[10px] text-white hover:from-violet-600 hover:to-fuchsia-600 lf-glow" onClick={promoteWinner}>
                        <Crown className="h-3 w-3" /> Promote {data!.ab.winner}
                      </Button>
                    ) : undefined
                  }
                >
                  {data!.ab?.enabled ? (
                    <div className="space-y-3">
                      {data!.ab.winner && (
                        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                          <Crown className="h-3.5 w-3.5" />
                          Variant <b>{data!.ab.winner}</b> is winning (sample {fmtNum(data!.ab.totalExposures)} / {fmtNum(data!.ab.sampleSize)} reached) — auto-winner {data!.ab.autoWinner ? "ON" : "OFF"}
                        </div>
                      )}
                      {!data!.ab.hasData && <p className="text-[11px] text-zinc-500">No exposures recorded yet — use “Test preview” with a variant selected, or simulate traffic.</p>}
                      {data!.ab.variants.map((v) => (
                        <div key={v.name} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                          <div className="flex items-center gap-2">
                            <span className={cn("flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold", v.name === data!.ab!.winner ? "bg-amber-400 text-black" : "bg-violet-500/20 text-violet-200")}>{v.name}</span>
                            <span className="min-w-0 flex-1 truncate text-[12px] text-zinc-300">{v.headline}</span>
                            <span className="font-mono text-[10px] text-zinc-500">w {v.weight}%</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300" style={{ width: `${Math.round(v.ctr * 100)}%` }} />
                            </div>
                            <span className="w-24 text-right font-mono text-[10px] text-zinc-400">
                              CTR {(v.ctr * 100).toFixed(1)}% · {v.clicks}/{v.exposures}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <Sparkles className="h-6 w-6 text-zinc-700" />
                      <p className="text-[12px] text-zinc-500">No A/B test running.</p>
                      <p className="max-w-xs text-[10px] text-zinc-600">Enable “A/B test this hero” in the hero section properties (Studio → Section tab) to compare weighted headline variants.</p>
                    </div>
                  )}
                </PanelCard>
              </div>
            </div>

            {/* Leads inbox — contact form submissions */}
            <div className="lf-fade-up" style={{ animationDelay: "640ms" }}>
              <PanelCard
                title="Leads inbox"
                icon={Mail}
                actions={
                  <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-violet-300">
                    {leads.length} {leads.length === 1 ? "submission" : "submissions"}
                  </span>
                }
              >
                {leads.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Mail className="h-6 w-6 text-zinc-700" />
                    <p className="text-[12px] text-zinc-500">No form submissions yet.</p>
                    <p className="max-w-xs text-[10px] text-zinc-600">
                      Open “Test preview” in the Studio and submit the contact form — every submission lands here as a lead.
                    </p>
                  </div>
                ) : (
                  <ul className="grid max-h-96 gap-2 overflow-y-auto lf-scroll pr-1 sm:grid-cols-2">
                    {leads.map((lead) => {
                      const initials = (lead.name || lead.email || "?")
                        .split(/[\s.@]+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((w) => w[0]?.toUpperCase())
                        .join("")
                      const hue = (lead.id.charCodeAt(0) * 13) % 360
                      return (
                        <li
                          key={lead.id}
                          className="group flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:border-violet-500/30 hover:bg-zinc-900/80"
                        >
                          <span
                            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-[11px] font-bold text-zinc-100"
                            style={{ background: `hsl(${hue} 45% 22%)` }}
                          >
                            {initials}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <p className="truncate text-[12px] font-semibold text-zinc-100">{lead.name || "Anonymous"}</p>
                              <span className="ml-auto shrink-0 font-mono text-[9px] text-zinc-600">
                                {new Date(lead.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                              </span>
                            </div>
                            {lead.email && (
                              <a
                                href={`mailto:${lead.email}`}
                                className="mt-0.5 block truncate text-[11px] text-violet-300/90 underline-offset-2 hover:underline"
                                title={`Email ${lead.email}`}
                              >
                                {lead.email}
                              </a>
                            )}
                            {lead.message && (
                              <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-zinc-400" title={lead.message}>
                                {lead.message}
                              </p>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </PanelCard>
            </div>

            {/* Recent events */}
            <div className="lf-fade-up" style={{ animationDelay: "680ms" }}>
              <PanelCard title="Recent events" icon={Zap}>
                <ul className="divide-y divide-zinc-800/60">
                  {data!.recentEvents.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 py-1.5 text-[11px]">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase",
                          e.type === "cta_click" ? "bg-emerald-500/15 text-emerald-300" : e.type === "form_submit" ? "bg-fuchsia-500/15 text-fuchsia-300" : e.type === "variant_exposure" ? "bg-violet-500/15 text-violet-300" : "bg-zinc-500/15 text-zinc-400"
                        )}
                      >
                        {e.type.replace("_", " ")}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-zinc-300">{e.label}</span>
                      {e.variant && <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-violet-300">v{e.variant}</span>}
                      <span className="font-mono text-zinc-600">{new Date(e.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </li>
                  ))}
                </ul>
              </PanelCard>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
