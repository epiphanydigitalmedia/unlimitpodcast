# Unlimit Your Potential — Site

Next.js 15 + Tailwind v4 site for **unlimitpodcast.com** — the audio/video podcast hosted by Seth Pepper, produced by Cupid Soldiers Studios / Epiphany Digital Media. Live in production on Vercel.

**Theme:** Editorial light (cool paper background, rich ink text, restrained ink-colored accent)
**Typography:** Effra (display + body via Adobe Fonts, shared kit with sethpepper.com) with Inter via Google Fonts as the fallback while Typekit loads

## Quick start

```bash
npm install
cp .env.example .env.local        # then fill in the values (see Environment variables)
npm run dev
```

Open <http://localhost:3000>.

## Stack

- **Next.js 15** (App Router, React 19, TypeScript)
- **Tailwind CSS v4** (CSS-first config in `app/globals.css`)
- **Effra** via Adobe Fonts (Typekit), **Inter** via `next/font/google` as fallback
- **react-markdown** + **remark-gfm** — renders episode show notes and transcripts
- **Spotify embed** for players (iframe, no SDK) with a native `<audio>` fallback
- **Substack** for newsletter (iframe embed)
- No state management, no icon libraries, no CSS-in-JS

## How content works

Episodes are **published automatically** — you publish to Spotify-for-Creators and a daily cron pulls the new episode onto the site within ~24h, no code edits (see [Auto-sync cron](#auto-sync-cron)). Here's where each kind of content lives:

| Content | Source | Who maintains it |
|---|---|---|
| Episodes | `data/episodes.json` | The cron (auto-added from RSS) |
| Guests | `data/guests.json` | Cron **stub-creates** new guests; you fill in bio/links/`defaultTopics` |
| Topics | `data/topics.json` | Hand-edited |
| Transcripts | `lib/transcripts/<slug>.ts` (markdown-as-string) | Hand-added; merged onto episodes by slug at runtime |
| Show / host / listen links / Substack | `lib/content.ts` (code) | Hand-edited (stable, rarely changes) |

`lib/content.ts` is the read layer: it imports the `data/*.json` files, merges transcripts by slug, and exposes `getAllEpisodes()`, `getEpisodeBySlug()`, etc. Types live in `lib/types.ts`. Show notes are HTML stored on `episode.showNotes` (from the RSS description), rendered with react-markdown.

## Auto-sync cron

A daily **Vercel Cron** (`14:00 UTC`, configured in `vercel.json`) hits `/api/cron/sync-episodes`:

```
Publish to Spotify-for-Creators → Anchor RSS → daily cron → diff by GUID →
add new episodes (+ stub new guests) → resolve Spotify embed IDs (scrape show page) →
commit data/*.json to GitHub → Vercel rebuild → live
```

If the Spotify scraper misses an episode's embed ID on publish day (Spotify hadn't indexed it yet), the player falls back to a native `<audio>` bar and the cron **self-heals** it on a later run (backfills any still-missing IDs). Full details, setup, and troubleshooting: **[`docs/CRON.md`](docs/CRON.md)**.

## Project structure

```
app/
  layout.tsx             Root layout, fonts, metadata
  page.tsx               Homepage
  globals.css            Design system: tokens, base styles, components
  about|listen|newsletter|sponsor|press|contact/   Static pages
  episodes/page.tsx      Episode archive       episodes/[slug]/   Episode page (notes, transcript, player)
  guests/page.tsx        Guest index           guests/[slug]/     Guest archive
  topics/page.tsx        Topic index           topics/[slug]/     Episodes by topic
  api/cron/sync-episodes/route.ts   Daily episode-sync cron endpoint
components/
  Nav.tsx, Footer.tsx
  ui/Container.tsx, ui/SpotifyEmbed.tsx
  sections/              Homepage sections (Hero, LatestEpisode, RecentEpisodes, HostIntro, NewsletterCTA)
data/
  episodes.json, guests.json, topics.json     Content source of truth (cron-managed + hand-edited)
lib/
  content.ts             Read layer: merges data/*.json + transcripts; show/host metadata
  types.ts               Episode/Guest/Topic schemas + date/duration helpers
  episode-sync.ts        Cron sync logic (runSync)
  rss.ts                 Anchor RSS parser
  spotify-scrape.ts      Resolves Spotify episode IDs from the public show page
  github.ts              Commits data/*.json back to the repo via the GitHub API
  title-parser.ts        Extracts guests/topics from episode titles
  transcripts/           Per-episode transcript modules (markdown strings)
```

## Environment variables

Copy `.env.example` → `.env.local`. Client vars (`NEXT_PUBLIC_`) are browser-exposed; the rest are server-only (used by the cron).

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_ADOBE_FONTS_KIT` | client | Adobe Fonts (Typekit) kit ID for Effra — shared kit `xgf6ltz` |
| `NEXT_PUBLIC_SUBSTACK_HANDLE` | client | Substack publication handle (default `unlimitpodcast`) |
| `RSS_FEED_URL` | server | Anchor/Spotify-for-Creators RSS feed the cron reads |
| `SPOTIFY_SHOW_ID` | server | Public show ID the cron scrapes to resolve embed IDs |
| `GITHUB_TOKEN` | server | Fine-grained PAT (this repo, Contents R/W) the cron commits with |
| `GITHUB_REPO` / `GITHUB_BRANCH` | server | Commit target (`epiphanydigitalmedia/unlimitpodcast` / `main`) |
| `CRON_SECRET` | server | Bearer secret Vercel Cron sends to authorize the endpoint |

## Adobe Fonts (Effra)

Reuses the same Adobe Fonts kit as sethpepper.com (kit ID `xgf6ltz`) — Effra at weights 400 and 700. Set `NEXT_PUBLIC_ADOBE_FONTS_KIT=xgf6ltz` in `.env.local`, and ensure `localhost`, `unlimitpodcast.com`, `www.unlimitpodcast.com`, and `*.vercel.app` are in the kit's allowed-domains list. Without it, the site falls back to Inter (functional, off-brand).

## Substack newsletter

Publication: `https://substack.com/@unlimitpodcast`. The `/newsletter` embed points at `https://unlimitpodcast.substack.com/embed`. If Substack assigned a different subdomain, update `NEXT_PUBLIC_SUBSTACK_HANDLE`.

## Editing content

- **New episode** → nothing to do; the cron adds it. To force it immediately, trigger the sync (see `docs/CRON.md` → *Manual trigger*).
- **Fill in a stub guest** → edit `data/guests.json`: set `title`, `bio`, optional `links`, and `defaultTopics` (2–4 slugs from `data/topics.json`). `defaultTopics` auto-applies to that guest's future episodes.
- **Add a topic** → add `{slug, name, description}` to `data/topics.json`, then reference it from guests' `defaultTopics`.
- **Add a transcript** → create `lib/transcripts/<slug>.ts` exporting a default markdown string, and wire it into the map in `lib/content.ts`. (A cleaner file-based publishing flow for notes/transcripts is a known future improvement.)
- **Show/host/listen links** → edit `lib/content.ts`.

## Deployment

Deploys are **push-to-main via Vercel's Git integration** — merging to `main` triggers a production build + deploy. The cron is registered automatically from `vercel.json`. Full runbook, env setup, and domain/DNS: **[`DEPLOY.md`](DEPLOY.md)**.

## Not yet built (future)

- **Sanity Studio** — the content layer maps cleanly to Sanity schemas when non-technical editing is wanted.
- **AI search** across the episode library.
- **File-based show-notes/transcript publishing** — replace the per-transcript TS module + import wiring with markdown files loaded by slug.
