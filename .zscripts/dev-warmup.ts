/**
 * dev-warmup.ts — background watchdog for the Next.js dev server.
 *
 * Why this exists: the sandbox supervisor restarts the dev server from time
 * to time (config changes, OOM recovery, environment rebuilds). Two painful
 * consequences follow for anyone with the studio open:
 *
 *   1. COLD COMPILE — the first page load after a restart recompiles
 *      everything (10-20s on this box). If a human's browser is the one
 *      doing that first load, the page paints but stays "not clickable"
 *      until hydration finishes.
 *   2. DEAD SERVER — if the restart attempt loses the port race
 *      (EADDRINUSE, seen in dev.log), nothing brings the server back and
 *      every open tab is stranded on the "connection lost" banner.
 *
 * This watchdog (single instance, pidfile-guarded) fixes both:
 *   - polls /api/health every 5s
 *   - when the server (re)appears, immediately requests / and /api/projects
 *     so the compile cache is warm BEFORE any human reload lands
 *   - if the server stays down > 60s, starts `bun run dev` itself
 *     (re-checking the port right before, so supervisor races just
 *     harmlessly fail one side with EADDRINUSE)
 *
 * Run: setsid nohup bun .zscripts/dev-warmup.ts < /dev/null >> .zscripts/warmup.log 2>&1 &
 * (dev.sh starts it automatically; starting a second instance is a no-op.)
 */

const ROOT = `${import.meta.dir}/..`
const BASE = "http://127.0.0.1:3000"
const PIDFILE = `${ROOT}/.zscripts/warmup.pid`
const LOGFILE = `${ROOT}/.zscripts/warmup.log`
const POLL_MS = 5_000
const RESTART_AFTER_MS = 60_000
const SPAWN_SETTLE_MS = 20_000

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// append straight to the log file (bypasses stdout buffering — the file is
// the source of truth when stdout is redirected/fully-buffered)
import { appendFileSync } from "node:fs"

function log(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  try {
    appendFileSync(LOGFILE, line)
  } catch {
    /* logging must never take the watchdog down */
  }
}

type Health = { up: boolean; pid?: number; uptime?: number }

async function health(): Promise<Health> {
  try {
    const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(2500) })
    if (!res.ok) return { up: false }
    const data = (await res.json()) as { ok?: boolean; pid?: number; uptime?: number }
    return { up: data.ok === true, pid: data.pid, uptime: data.uptime }
  } catch {
    return { up: false }
  }
}

async function warm(reason: string): Promise<void> {
  log(`warming compile cache (${reason})`)
  for (const path of ["/", "/api/projects"]) {
    const t0 = Date.now()
    try {
      const res = await fetch(BASE + path, { signal: AbortSignal.timeout(180_000) })
      log(`  ${path} -> ${res.status} in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
    } catch (err) {
      log(`  ${path} FAILED after ${((Date.now() - t0) / 1000).toFixed(1)}s: ${String(err)}`)
    }
  }
}

function spawnDevServer(): void {
  // nohup + & detaches the pipeline; the dev script tees its own dev.log
  Bun.spawn(["bash", "-c", `cd ${ROOT} && nohup bun run dev >/dev/null 2>&1 &`], {
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
  })
}

async function anotherInstanceRunning(): Promise<boolean> {
  try {
    const pid = Number.parseInt((await Bun.file(PIDFILE).text()).trim(), 10)
    if (!Number.isFinite(pid) || pid <= 0 || pid === process.pid) return false
    return await Bun.file(`/proc/${pid}/cmdline`).exists()
  } catch {
    return false
  }
}

async function main(): Promise<void> {
  if (await anotherInstanceRunning()) {
    log("another warmup watchdog is already running — exiting")
    return
  }
  await Bun.write(PIDFILE, String(process.pid))
  log(`dev warmup watchdog started (pid ${process.pid})`)

  let everUp = false
  // start as "up" so that finding the server DOWN on the first poll counts
  // as a down-transition (a watchdog started while the server is dead must
  // still schedule the restart path)
  let lastUp = true
  let downSince = 0
  let restartAttempted = false

  for (;;) {
    let h: Health
    try {
      h = await health()
    } catch {
      h = { up: false }
    }

    if (h.up) {
      if (!lastUp) {
        log(`dev server UP (pid=${h.pid} uptime=${h.uptime}s)${everUp ? " — recovered" : ""}`)
        // warm on every up-transition: after a restart the compile cache is
        // cold; absorb it here so the next human reload is instant
        void warm(everUp ? "post-recovery" : "boot")
        restartAttempted = false
      }
      everUp = true
      lastUp = true
      downSince = 0
    } else {
      if (lastUp) {
        downSince = Date.now()
        log(`dev server DOWN (since ${new Date(downSince).toISOString()}) — waiting for it (or a supervisor)…`)
      }
      lastUp = false
      if (
        downSince > 0 &&
        !restartAttempted &&
        Date.now() - downSince > RESTART_AFTER_MS
      ) {
        restartAttempted = true
        // re-check right before spawning — if a supervisor just won the
        // race, skip (our spawn would EADDRINUSE harmlessly, but why risk it)
        const again = await health()
        if (again.up) {
          log("server recovered on its own right before restart attempt — skipping spawn")
        } else {
          log(`server down >${RESTART_AFTER_MS / 1000}s — starting \`bun run dev\``)
          try {
            spawnDevServer()
          } catch (err) {
            log(`spawn failed: ${String(err)}`)
          }
          await sleep(SPAWN_SETTLE_MS) // let it bind before resuming polls
        }
      }
    }

    await sleep(POLL_MS)
  }
}

// never die silently: log and keep the loop alive
process.on("unhandledRejection", (reason) => {
  log(`unhandledRejection (survived): ${String(reason)}`)
})
process.on("uncaughtException", (err) => {
  log(`uncaughtException (survived): ${String(err)}`)
})

main().catch((err) => {
  log(`fatal: ${String(err)}`)
  process.exit(1)
})
