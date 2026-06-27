# CRON.md — Episode auto-sync

This document explains the Spotify-driven episode auto-sync cron. Read this if you're setting it up for the first time, debugging a failed run, or onboarding a new episode workflow.

## What it does

A daily Vercel Cron job runs `/api/cron/sync-episodes` at 14:00 UTC (07:00 Pacific). On each run:

1. Fetches the full episode list for the show from the Spotify Web API
2. Diffs it against `data/episodes.json` in the GitHub repo
3. For each new episode:
   - Parses the title for any known guest (matched against `data/guests.json`)
   - Looks up that guest's `defaultTopics` field — these become the episode's topic tags
   - If the title contains a name not yet in the roster, creates a **stub guest** with empty bio and empty `defaultTopics` (you fill these in later via Claude Code)
   - For solo episodes (no guest in title), applies the `SOLO_EPISODE_TOPICS` constant in `lib/episode-sync.ts`
   - Generates a slug from the title (with the guest name stripped if known)
   - Pulls the summary, full description, duration, release date, and canonical Spotify episode ID directly from the API
4. Commits the updated `data/episodes.json` (and `data/guests.json` if stubs were added) via the GitHub API
5. Vercel's GitHub webhook auto-triggers a production rebuild
6. New episodes appear on the live site within a few minutes

Net result: publish on Spotify, episode appears on the site within ~24 hours, zero involvement.

## One-time setup

### 1. Register a Spotify Developer app

- Go to <https://developer.spotify.com/dashboard>, log in with your Spotify account
- Create app → call it "Unlimit Podcast Cron" → website `https://unlimitpodcast.com` → redirect URIs can be blank (we only use client credentials flow)
- Save → "Settings" → copy the Client ID and click "View client secret" to copy the secret
- These go into Vercel env vars: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`

### 2. Create a GitHub fine-grained PAT

- Go to <https://github.com/settings/personal-access-tokens/new>
- Token name: "unlimit-podcast cron writer"
- Expiration: 1 year (set a calendar reminder to rotate)
- Repository access: "Only select repositories" → select the unlimit-podcast repo only
- Repository permissions:
  - **Contents**: Read and Write
  - **Metadata**: Read (auto-selected)
  - Everything else: No access
- Generate → copy the token (only shown once)
- Vercel env var: `GITHUB_TOKEN`
- Also set: `GITHUB_REPO=<your-username-or-org>/<repo-name>` and `GITHUB_BRANCH=main`

### 3. Generate the cron secret

Anyone who hits the cron endpoint without the secret gets a 401. Generate a long random string:

```bash
openssl rand -hex 32
```

Set it as `CRON_SECRET` in Vercel env vars. (Vercel automatically sends this in the `Authorization` header when its own cron triggers the endpoint, so no further config needed on that side.)

### 4. Set all env vars in Vercel

In Vercel project settings → Environment Variables, add for **Production**, **Preview**, and **Development**:

| Variable | Value |
|---|---|
| `SPOTIFY_CLIENT_ID` | From step 1 |
| `SPOTIFY_CLIENT_SECRET` | From step 1 |
| `SPOTIFY_SHOW_ID` | `033fC9vZNYBsByh1MQrpam` |
| `GITHUB_TOKEN` | From step 2 |
| `GITHUB_REPO` | e.g., `epiphany/unlimit-podcast` |
| `GITHUB_BRANCH` | `main` |
| `CRON_SECRET` | From step 3 |

### 5. Deploy

After pushing the cron code, Vercel automatically picks up `vercel.json` and registers the cron schedule. Verify by going to Vercel project → Settings → Cron Jobs — you should see `/api/cron/sync-episodes` scheduled at `0 14 * * *`.

## Testing the cron manually

To trigger a sync immediately rather than waiting for the daily schedule:

```bash
curl -X GET \
  https://unlimitpodcast.com/api/cron/sync-episodes \
  -H "Authorization: Bearer <your CRON_SECRET>"
```

Expected responses:

- `{ "status": "noop", ... }` — no new episodes, nothing to do
- `{ "status": "success", "newEpisodeCount": N, ... }` — synced N episodes
- `{ "status": "error", "error": "..." }` — something failed; the error message tells you what

Logs are in Vercel → Functions → `/api/cron/sync-episodes` → Recent invocations.

## Maintenance tasks

### When a new guest's stub is created

The cron will write something like:

```json
{
  "slug": "jane-doe",
  "name": "Jane Doe",
  "title": "TODO — fill in guest title",
  "bio": "TODO — fill in guest bio. This guest was auto-stubbed by the episode-sync cron.",
  "defaultTopics": []
}
```

Open `data/guests.json` in Claude Code, fill in `title`, `bio`, optionally `links`, and **populate `defaultTopics`** with 2-4 topic slugs from `data/topics.json`. From the next episode forward, this guest's `defaultTopics` will auto-apply.

The current episode (the one that triggered the stub creation) will have empty `topics` until you also edit it manually — or, simpler, after filling in `defaultTopics`, just edit the affected episode in `data/episodes.json` and paste in the same topic slugs.

### When you want to add a new topic

Edit `data/topics.json`, add the new topic with a slug, name, and description. Then update any guest's `defaultTopics` to reference the new slug. The cron will start applying it on the next episode.

### When the cron silently misses a guest

The title parser uses exact case-insensitive name matching. If a title says "Mark Immleman" (typo) instead of "Mark Immelman" (correct), the parser won't match. In that case it falls back to the heuristic name extractor and might either correctly extract or skip. The remedy is the same either way: open the affected episode in `data/episodes.json` and manually set its `guests` array to the right slug.

## Rotating credentials

- **Spotify**: regenerate the client secret in the Spotify Developer dashboard; update `SPOTIFY_CLIENT_SECRET` in Vercel
- **GitHub**: PATs expire on the date you set. Rotate before expiration: generate a new fine-grained PAT with the same scopes, update `GITHUB_TOKEN` in Vercel, delete the old PAT
- **Cron secret**: generate a new random string with `openssl rand -hex 32`, update `CRON_SECRET` in Vercel; Vercel Cron will pick up the new value on next run

## Operational notes

- **Cost**: free tier on Vercel (1 cron job, daily), free tier on Spotify Web API (we use a tiny fraction of the rate limit), free tier on GitHub. Total ongoing cost of the cron itself: $0.
- **Spotify RSS lag**: Spotify-for-Creators-published episodes typically appear in the Web API within 1-3 hours. The daily cron picks them up the next morning UTC. If you publish at 6am UTC on Monday, the episode is on the live site by ~14:30 UTC Tuesday at the latest. Want it faster? Trigger the cron manually via the curl command above immediately after publishing.
- **Idempotency**: the cron compares Spotify IDs against `data/episodes.json`. Running it twice produces no extra commits if there are no new episodes.
- **Failure mode**: if any step fails (Spotify API down, GitHub down, token expired), the cron returns 500 and logs to Vercel. No partial state — either the full commit lands or nothing changes.
- **Disabling temporarily**: rename `vercel.json` to `vercel.json.bak` and redeploy. The cron schedule deregisters. Restore the file and redeploy to re-enable.
