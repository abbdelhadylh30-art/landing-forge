#!/bin/sh
# dev-warmup-loop.sh — supervisor loop for the dev-server watchdog.
#
# Spawned ONCE by the analytics-live relay (a persistent, supervisor-started
# process — children it spawns survive; processes spawned from agent bash
# commands do not). This loop keeps the watchdog script alive forever: if it
# ever exits (crash, fatal error), respawn it after 30s.
#
# The watchdog itself (.zscripts/dev-warmup.ts) polls /api/health, warms the
# Next.js compile cache whenever the dev server (re)appears, and restarts
# `bun run dev` if it stays down > 60s.

cd /home/z/my-project || exit 1

while true; do
  bun .zscripts/dev-warmup.ts >> .zscripts/warmup.log 2>&1
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [loop] watchdog exited (code $?) — respawning in 30s" >> .zscripts/warmup.log
  sleep 30
done
