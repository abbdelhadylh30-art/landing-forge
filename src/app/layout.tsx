import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "landing-forge studio — build landing pages visually",
  description:
    "Generate beautiful landing pages from one YAML file or an AI prompt. Visual builder, A/B testing, privacy-friendly analytics, one-click deploy.",
  keywords: ["landing page", "builder", "no-code", "AI", "A/B testing", "analytics", "YAML", "landing-forge"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "landing-forge studio",
    description:
      "Beautiful landing pages from one YAML file or AI prompt. Built-in analytics, A/B testing, SEO.",
    siteName: "landing-forge",
    type: "website",
  },
};

/**
 * Boot splash — runs inline in <head> BEFORE first paint.
 *
 * Why: on this sandbox the Next.js dev server is restarted by the supervisor
 * from time to time, and the first page load afterwards must recompile
 * everything (up to ~15s). During that window the SSR html paints but no
 * React handlers are attached yet — the page LOOKS dead ("not clickable").
 * This splash paints a branded "Forging the studio…" state after 120ms
 * (fast loads never see it) and React removes it the moment the app
 * hydrates (ConnectionGuard / error boundaries call window.__lfBootDone).
 * If hydration never completes (dead chunks after a restart), it turns
 * into an honest explainer with a Reload button instead of a silent,
 * unresponsive page.
 */
const BOOT_SPLASH_JS = `(function () {
  "use strict";
  var SHOW_DELAY = 120, SLOW_AFTER = 10000;
  var showTimer = null, slowTimer = null, el = null;
  function remove() {
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    if (slowTimer) { clearTimeout(slowTimer); slowTimer = null; }
    var e = el; el = null;
    if (!e) return;
    try {
      e.style.opacity = "0";
      setTimeout(function () { e.parentNode && e.parentNode.removeChild(e); }, 260);
    } catch (err) {}
  }
  function show() {
    if (el || document.getElementById("lf-boot")) return;
    el = document.createElement("div");
    el.id = "lf-boot";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-label", "landing-forge studio is starting");
    el.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#09090b;display:flex;align-items:center;justify-content:center;transition:opacity .25s ease;";
    el.innerHTML = [
      "<style>",
      "#lf-boot .lf-in{text-align:center;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}",
      "#lf-boot .lf-spark{color:#a78bfa;font-size:36px;line-height:1;animation:lf-pulse 1.6s ease-in-out infinite;text-shadow:0 0 26px rgba(167,139,250,.6)}",
      "#lf-boot .lf-word{margin-top:14px;font-size:15px;font-weight:600;letter-spacing:.02em;color:#f4f4f5}",
      "#lf-boot .lf-word em{font-style:normal;color:#a78bfa}",
      "#lf-boot .lf-cap{margin-top:8px;font-size:12px}",
      "#lf-boot .lf-cap span{background:linear-gradient(90deg,#52525b 0%,#e4e4e7 50%,#52525b 100%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:lf-shimmer 2.4s linear infinite}",
      "#lf-boot .lf-slow{display:none;margin-top:20px}",
      "#lf-boot .lf-slow p{margin:0 auto 10px;font-size:12px;line-height:1.5;color:#a1a1aa;max-width:300px}",
      "#lf-boot .lf-btn{cursor:pointer;border:1px solid #3f3f46;background:#18181b;color:#e4e4e7;font:inherit;font-size:12px;font-weight:600;padding:8px 16px;border-radius:8px;transition:border-color .15s,color .15s}",
      "#lf-boot .lf-btn:hover{border-color:#a78bfa;color:#d8b4fe}",
      "@keyframes lf-pulse{0%,100%{opacity:.5;transform:scale(.92)}50%{opacity:1;transform:scale(1)}}",
      "@keyframes lf-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}",
      "</style>",
      '<div class="lf-in">',
      '<div class="lf-spark" aria-hidden="true">&#10022;</div>',
      '<div class="lf-word">landing-forge <em>studio</em></div>',
      '<div class="lf-cap"><span>Forging the studio&hellip;</span></div>',
      '<div class="lf-slow" id="lf-boot-slow">',
      "<p>First load after a server restart compiles the whole studio \u2014 hang tight. This screen disappears the moment everything is ready.</p>",
      '<button class="lf-btn" type="button" onclick="location.reload()">Reload page</button>',
      "</div>",
      "</div>"
    ].join("");
    (document.body || document.documentElement).appendChild(el);
    slowTimer = setTimeout(function () {
      var s = document.getElementById("lf-boot-slow");
      if (s) s.style.display = "block";
    }, SLOW_AFTER);
  }
  showTimer = setTimeout(show, SHOW_DELAY);
  window.__lfBootDone = remove;
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script id="lf-boot-splash" dangerouslySetInnerHTML={{ __html: BOOT_SPLASH_JS }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
