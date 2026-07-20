# DEPLOY.md — Unlimit Your Potential

Deployment + operations runbook for **unlimitpodcast.com**. The site is **live** on Vercel with a custom domain and a daily auto-sync cron. This document covers how it deploys now, its configuration, and how to operate it — not a from-scratch launch (that already happened).

- **Stack:** Next.js 15 + Tailwind v4 + TypeScript (editorial light theme)
- **Owner:** Erik Thureson (Epiphany Digital Media)
- **Hosting:** Vercel (Git integration) · **Repo:** `epiphanydigitalmedia/unlimitpodcast` · **Branch:** `main`
- **Domain:** `unlimitpodcast.com` (registrar: Namecheap) — live
- **Sibling property:** sethpepper.com (same architecture, dark theme)

## How it deploys

**Push to `main` → Vercel builds and deploys.** There is no manual `vercel` CLI step in the normal flow — Vercel's Git integration watches `main`:

```
git push origin main → Vercel build → production deploy → live
```

This is also how the **cron publishes episodes**: the cron commits `data/*.json` to `main` via the GitHub API, which triggers the same rebuild. See [`docs/CRON.md`](docs/CRON.md).

> Because every push to `main` deploys to production, treat `main` as production. Confirm intent before pushing.

## Local development

```bash
npm install
cp .env.example .env.local     # fill in the values below
npm run dev                    # http://localhost:3000
npm run build                  # verify a production build before pushing
```

## Environment variables

Set these in **Vercel → Project Settings → Environment Variables** (Production / Preview / Development) and mirror them in `.env.local` for local work. Client vars (`NEXT_PUBLIC_`) are browser-exposed; the rest are server-only (cron).

| Variable | Scope | Value / source |
|---|---|---|
| `NEXT_PUBLIC_ADOBE_FONTS_KIT` | client | `xgf6ltz` (shared Effra kit) |
| `NEXT_PUBLIC_SUBSTACK_HANDLE` | client | `unlimitpodcast` |
| `RSS_FEED_URL` | server | `https://anchor.fm/s/11288f500/podcast/rss` |
| `SPOTIFY_SHOW_ID` | server | `033fC9vZNYBsByh1MQrpam` |
| `GITHUB_TOKEN` | server | Fine-grained PAT — this repo only, **Contents: Read+Write** |
| `GITHUB_REPO` | server | `epiphanydigitalmedia/unlimitpodcast` |
| `GITHUB_BRANCH` | server | `main` |
| `CRON_SECRET` | server | `openssl rand -hex 32` — Vercel Cron sends it as `Authorization: Bearer …` |

Creating the PAT and cron secret is documented step-by-step in [`docs/CRON.md`](docs/CRON.md) → *One-time setup*.

> **Legacy env vars:** `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` are no longer used (Spotify gated its Web API behind Premium; we moved to RSS + show-page scraping). `NEXT_PUBLIC_SPOTIFY_SHOW_ID` is also retired — the code reads server-only `SPOTIFY_SHOW_ID`. Delete all three from Vercel if still present.

## The cron

A daily Vercel Cron (`0 14 * * *` in `vercel.json`) auto-registers on deploy — confirm under **Project → Settings → Cron Jobs**. To force a sync without waiting for 14:00 UTC:

```bash
curl -s https://unlimitpodcast.com/api/cron/sync-episodes \
  -H "Authorization: Bearer $CRON_SECRET"
```

Responses: `{"status":"noop"}` (nothing new) · `{"status":"success","newEpisodeCount":N,"backfilledSpotifyIds":M,...}` · `{"status":"error",...}`. Logs: **Vercel → Functions → `/api/cron/sync-episodes`**. Full operational detail in [`docs/CRON.md`](docs/CRON.md).

## Domain / DNS (Namecheap → Vercel)

Already configured; kept here for reference / disaster recovery.

| Type  | Host | Value                   |
|-------|------|-------------------------|
| A     | `@`  | `76.76.21.21`           |
| CNAME | `www`| `cname.vercel-dns.com.` |

Domains `unlimitpodcast.com` + `www.unlimitpodcast.com` are added in Vercel → Domains. SSL provisions automatically.

## Post-deploy verification

- Production domain serves the latest build; key routes render (`/`, `/episodes`, `/episodes/[slug]`, `/guests`, `/topics`, `/about`, `/listen`, `/newsletter`, `/contact`).
- View Source shows `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">`.
- Effra loads from Typekit (`<link ... href="https://use.typekit.net/xgf6ltz.css">`).
- Newest episode shows the **rich Spotify player** (iframe), not the fallback audio bar — if it shows the bar, its `spotifyEpisodeId` is missing (see Troubleshooting).

## Troubleshooting

- **Newest episode shows the plain audio bar** → its `spotifyEpisodeId` is missing (scraper missed it on publish day). The cron now self-heals on the next run; to fix immediately, set the ID directly in `data/episodes.json` (get it from the episode's Spotify share link) and push, or run the manual cron trigger.
- **Effra not loading** → confirm `localhost`, `*.vercel.app`, and the production domain are in the `xgf6ltz` kit's allowed domains.
- **Substack iframe empty** → verify `https://unlimitpodcast.substack.com/embed` exists; if the subdomain differs, update `NEXT_PUBLIC_SUBSTACK_HANDLE`.
- **Cron returns 401** → `CRON_SECRET` mismatch between the request and Vercel env.
- **Cron returns 500** → the error message names the failing step (RSS fetch, GitHub commit, etc.); check function logs.
- **New guest shows placeholder bio** → the cron stub-created it; fill in `data/guests.json` (see `docs/CRON.md` → *Maintenance*).

## Rollback

Vercel → Deployments → pick the last-good deployment → **Promote to Production**. (Or revert the offending commit on `main` and push.)
