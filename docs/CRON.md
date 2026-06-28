# CRON.md — Episode auto-sync

A daily Vercel Cron pulls new episodes onto the site automatically. You publish to Spotify-for-Creators; ~24 hours later the new episode appears at unlimitpodcast.com with no code edits.

## How it works

```
You publish to Spotify-for-Creators
        ↓ (Anchor populates RSS within ~1h)
RSS feed (anchor.fm/.../podcast/rss)
        ↓
Daily Vercel Cron (14:00 UTC) — /api/cron/sync-episodes
        ↓
  1. Fetches RSS → list of all current episodes
  2. Fetches https://open.spotify.com/show/<id> in parallel → (title → episodeId) map
  3. Diffs RSS against data/episodes.json (by RSS <guid>)
  4. For each new episode:
       • parses title for known guests → applies their defaultTopics
       • for solo episodes → applies SOLO_EPISODE_TOPICS constant
       • for unknown guests → creates a stub guest entry (fill in bio later)
       • resolves spotifyEpisodeId from the show-page map
       • populates audioUrl from the RSS enclosure (fallback if no Spotify ID)
  5. Commits data/episodes.json (+ data/guests.json if stubs added) via GitHub API
        ↓
GitHub webhook → Vercel rebuild → episode live on site
```

The Spotify scraper is best-effort: if Spotify changes their HTML and our regex misses, the new episode still publishes — it just uses the native HTML5 audio player (built into the SpotifyEmbed component as a fallback) instead of the Spotify iframe until we re-fix the scraper.

## One-time setup

### 1. GitHub fine-grained PAT
- <https://github.com/settings/personal-access-tokens/new>
- Token name: `unlimit-podcast cron writer`
- Expiration: 1 year (calendar a renewal reminder)
- Repository access: *Only select repositories* → `unlimitpodcast` only
- Repository permissions: **Contents: Read and Write** (Metadata auto-selects)
- Generate → copy the `github_pat_...` value (only shown once)
- Vercel env var: `GITHUB_TOKEN`

### 2. Cron secret
```bash
openssl rand -hex 32
```
Vercel env var: `CRON_SECRET`. Vercel Cron sends this in the `Authorization: Bearer <secret>` header on every scheduled invocation.

### 3. Vercel env vars

In **Project Settings → Environment Variables**, add for **Production / Preview / Development**:

| Variable | Value |
|---|---|
| `RSS_FEED_URL` | `https://anchor.fm/s/11288f500/podcast/rss` |
| `SPOTIFY_SHOW_ID` | `033fC9vZNYBsByh1MQrpam` |
| `GITHUB_TOKEN` | from step 1 |
| `GITHUB_REPO` | `epiphanydigitalmedia/unlimitpodcast` |
| `GITHUB_BRANCH` | `main` |
| `CRON_SECRET` | from step 2 |

> **Note:** earlier versions of this setup required `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`. Those are no longer used — Spotify gated their Web API behind a Premium subscription requirement, so we moved to RSS-based sync + show-page scraping. You can safely delete those two env vars from Vercel if they're still there.

### 4. Deploy
After pushing, Vercel auto-picks up `vercel.json` and registers the schedule. Confirm in **Project → Settings → Cron Jobs**.

## Manual trigger / testing

```bash
curl -s https://unlimitpodcast.com/api/cron/sync-episodes \
  -H "Authorization: Bearer $CRON_SECRET"
```

Expected responses:
- `{"status":"noop", ...}` — no new episodes, nothing to do
- `{"status":"success", "newEpisodeCount": N, ...}` — N new episodes synced
- `{"status":"error", "error": "..."}` — something failed; the message tells you what

Logs: Vercel → Functions → `/api/cron/sync-episodes` → Recent invocations.

## Maintenance

### A new guest gets stub-created
The cron writes:
```json
{
  "slug": "jane-doe",
  "name": "Jane Doe",
  "title": "TODO — fill in guest title",
  "bio": "TODO — ...",
  "defaultTopics": []
}
```
Edit `data/guests.json` directly (via Claude Code) to fill in `title`, `bio`, optional `links`, and **populate `defaultTopics`** with 2-4 topic slugs from `data/topics.json`. From the next episode forward, this guest's `defaultTopics` will auto-apply. To retroactively tag the current episode, also edit its `topics` array in `data/episodes.json`.

### Add a new topic
Edit `data/topics.json` to add `{slug, name, description}`. Then update any guest's `defaultTopics` to reference the new slug. Cron applies it on the next sync.

### The scraper misses a title
If Spotify changes their HTML, the regex in `lib/spotify-scrape.ts` will start returning fewer matches. Symptoms: new episodes appear on the site with the native audio player instead of the Spotify embed. Fix: update the regex in `lib/spotify-scrape.ts` to match the new structure, then push.

### The title parser misses a guest
The parser uses case-insensitive name matching against `data/guests.json`. A typo in the episode title (`Mark Immleman` vs `Mark Immelman`) won't match. Fix manually in `data/episodes.json`.

## Rotating credentials

- **GitHub PAT**: regenerate before expiration in https://github.com/settings/personal-access-tokens, update `GITHUB_TOKEN` in Vercel
- **Cron secret**: `openssl rand -hex 32`, update `CRON_SECRET` in Vercel, redeploy to bust the warm-function env cache

## Operational notes

- **Cost**: free across the board (Vercel cron free tier, public RSS, public Spotify show page, GitHub API free tier)
- **Lag**: Spotify-for-Creators publishes to Anchor's RSS within ~1 hour. Daily cron runs at 14:00 UTC. Worst-case: publish at 14:30 UTC Monday → episode live by ~14:15 UTC Tuesday (~24h). Need faster? Hit the manual curl right after publishing.
- **Idempotency**: GUID-based diff. Re-running with no new episodes is a no-op (no commit).
- **Failure mode**: if any step fails, the cron returns 500 with the error message. No partial state.
- **Disable temporarily**: rename `vercel.json` → `vercel.json.bak`, redeploy.
