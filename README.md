# Unlimit Your Potential — Site

Next.js 15 + Tailwind v4 site for unlimitpodcast.com. The audio/video podcast hosted by Seth Pepper, produced by Cupid Soldiers Studios / Epiphany Digital Media.

**Theme:** Editorial light (cool paper background, rich ink text, restrained ink-colored accent)
**Typography:** Effra (display + body sans via Adobe Fonts, shared with sethpepper.com for brand consistency) with Inter via Google Fonts as the system fallback while Typekit loads
**Architecture:** Show-first (audience-facing), studio-template (internally — same architecture as sethpepper.com, distinct visual identity)

## Quick start

```bash
npm install
cp .env.example .env.local        # then add your Adobe Fonts kit ID and Spotify Show ID
npm run dev
```

Open <http://localhost:3000>.

## Stack

- **Next.js 15** (App Router, React 19, TypeScript)
- **Tailwind CSS v4** (CSS-first configuration in `app/globals.css`)
- **Effra** via Adobe Fonts (Typekit) — shared kit with sethpepper.com — with **Inter** via `next/font/google` as system fallback
- **Spotify embed** for podcast players (iframe-based, no SDK)
- **Substack** for newsletter (iframe embed)
- Zero state management, zero icon libraries, zero CSS-in-JS

## Project structure

```
app/
  layout.tsx             Root layout, fonts, metadata
  page.tsx               Homepage
  globals.css            Design system: tokens, base styles, components
  about/page.tsx         About the show + host
  episodes/page.tsx      All episodes archive
  episodes/[slug]/       Individual episode page (show notes, transcript, player)
  topics/page.tsx        Topics index
  topics/[slug]/         Episodes filtered by topic
  guests/page.tsx        Guests index
  guests/[slug]/         Guest archive page
  listen/page.tsx        Subscribe links
  newsletter/page.tsx    Substack signup
  sponsor/page.tsx       Sponsorship inquiry
  press/page.tsx         Press kit
  contact/page.tsx       Contact routes by inquiry type
components/
  Nav.tsx                Top navigation
  Footer.tsx             Site-wide footer
  ui/
    Container.tsx        Width-constrained container
    SpotifyEmbed.tsx     Reusable Spotify episode iframe
  sections/
    Hero.tsx             Homepage masthead
    LatestEpisode.tsx    Featured latest episode with player
    RecentEpisodes.tsx   Earlier episodes list
    HostIntro.tsx        Seth Pepper as host introduction
    NewsletterCTA.tsx    Substack signup callout
lib/
  content.ts             Single source of truth for show metadata, episodes, guests, topics
  types.ts               Episode/Guest/Topic schemas + date/duration helpers
  utils.ts               Class-name helper
```

## Setting up Adobe Fonts (Effra)

This site reuses the same Adobe Fonts kit as sethpepper.com (kit ID `xgf6ltz`) for brand consistency. Effra serves both display and body type at weights 400 (Regular) and 700 (Bold).

1. In `.env.local`:
   ```
   NEXT_PUBLIC_ADOBE_FONTS_KIT=xgf6ltz
   ```
2. In Adobe Fonts project settings for the shared kit, add to the allowed domains:
   - `localhost`
   - `unlimitpodcast.com`, `www.unlimitpodcast.com`
   - `*.vercel.app` (for preview deployments)

Without the kit ID — or if the current domain isn't in the kit's allowlist — the site falls back to Inter for everything. Functional but loses the brand voice.

## Configuring podcast hosting (Spotify for Creators)

1. From your Spotify for Creators dashboard, get:
   - **Show ID** — the long ID in `open.spotify.com/show/XXXXXXXXXXXX`
   - **Individual episode IDs** for Episodes 1-4 — the long ID in `open.spotify.com/episode/XXXXXXXXXXXX`
2. Update `lib/content.ts`:
   - Set `SPOTIFY_SHOW_ID` in `.env.local` (server-only; used by the episode-sync cron's Spotify scraper)
   - Set each `spotifyEpisodeId` field on the `EPISODES` array entries

Embed players will then render via the `SpotifyEmbed` component automatically.

## Configuring the newsletter (Substack)

The publication is at `https://substack.com/@unlimitpodcast`. The embed iframe on `/newsletter` points at `https://unlimitpodcast.substack.com/embed`. If your publication's underlying subdomain is different (Substack sometimes assigns a different one when there's a name collision), update `NEXT_PUBLIC_SUBSTACK_HANDLE` in `.env.local` to match.

For a customized embed (custom colors, copy), go to Substack Settings → Sharing → Embed sign-up form. Copy the iframe URL into the embed src in `app/newsletter/page.tsx`.

## Editing content

**All content lives in `lib/content.ts`.** Single source of truth. Structured for direct mapping to Sanity Studio when CMS is wired in.

The four content types:

- `SHOW` — show metadata (name, tagline, description, URL)
- `HOST` — host bio (short and long versions)
- `TOPICS` — topic taxonomy. Add new topics here, then tag episodes with their slugs.
- `GUESTS` — guest bios with title, bio, optional links
- `EPISODES` — episode data following the schema in `lib/types.ts`

The episode schema includes: number, slug, title, airDate, guests (slug refs), topics (slug refs), durationSeconds, spotifyEpisodeId, youtubeVideoId, summary, showNotes, chapters (timestamp + label), transcript, resources, relatedEpisodes.

**TODO items in episode data:**
- Spotify episode IDs (pull from Spotify for Creators dashboard)
- Full show notes for Episodes 1-4 (existing content suites have YouTube descriptions, IG carousels, pull quotes — needs assembly into website-quality show notes)
- Chapter timestamps
- Full transcripts (if available from existing workflow)

## Deploy to Vercel

```bash
git init && git add . && git commit -m "Initial build"
git remote add origin <github-repo-url>
git push -u origin main
```

In Vercel: New Project → import the GitHub repo → Vercel auto-detects Next.js. Set these environment variables in project settings:

- `NEXT_PUBLIC_ADOBE_FONTS_KIT`
- `NEXT_PUBLIC_SUBSTACK_HANDLE` (default: `unlimitpodcast`)
- `SPOTIFY_SHOW_ID` (server-only)

Add custom domains `unlimitpodcast.com` + `www.unlimitpodcast.com` in project settings.

### DNS — Namecheap → Vercel

| Type  | Host | Value                     |
|-------|------|---------------------------|
| A     | @    | `76.76.21.21`             |
| CNAME | www  | `cname.vercel-dns.com.`   |

SSL provisions automatically.

## Hard rules at launch

1. **Meta-robots must read `index, follow`** (with `max-*` modifiers). Default in `app/layout.tsx` is correct; verify in production via View Source.
2. **Spotify show must be configured** before launch — placeholder URLs in `LISTEN_PLATFORMS` will 404 if left as-is.

## Intentionally not yet here

- **Sanity Studio.** Content layer is structured to map cleanly to Sanity schemas. Roughly half a day of work when needed.
- **AI search across the episode library.** V2 feature per the design decisions.
- **Premium tier / companion resources.** V2 features per the design decisions.
- **OG image.** Add `public/og-image.jpg` (1200×630) when designed.
- **Favicon set.** Need a vector source for the show's mark.
- **Show artwork.** Spotify for Creators requires podcast cover art — when designed, reference it in the show metadata.
