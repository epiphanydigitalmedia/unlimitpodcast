# DEPLOY.md — Unlimit Your Potential

> Handoff document for the Claude Code instance handling this deployment.
> Read in full before any action. Confirm each phase boundary with Erik.

## Project context

This is **unlimitpodcast.com** — the website for the *Unlimit Your Potential* podcast, hosted by Seth Pepper. Produced by Cupid Soldiers Studios / Epiphany Digital Media.

- **Stack:** Next.js 15 + Tailwind v4 + TypeScript, editorial light theme
- **Owner:** Erik Thureson (Epiphany Digital Media)
- **Hosting target:** Vercel
- **Domain registrar:** Namecheap (currently unconfigured for production)
- **Sibling property:** sethpepper.com (dark theme, also Next.js — already deployed via the same pattern)
- **CMS:** None yet. Content in `lib/content.ts`, structured to map to Sanity Studio in v1.1.

## Hard rules

1. **Meta-robots tag must read `index, follow`** with `max-*` modifiers on every page. Default in `app/layout.tsx` is correct.
2. **Do not push or deploy without Erik's explicit confirmation** at each phase boundary.
3. **No premium tier, no companion resources, no AI search** — these are explicitly v2 features. Do not add them during deploy.
4. **Spotify show URL must be valid** before pointing the domain at the build — listed URLs in `LISTEN_PLATFORMS` are currently placeholders and will 404.

## Pre-flight requirements from Erik

Before starting Phase 1, you need from Erik:

- Adobe Fonts kit ID containing **Effra** at weights 400 and 700 — reuses the same kit as sethpepper.com (kit ID `xgf6ltz`)
- Spotify Show ID from his Spotify for Creators dashboard
- Spotify episode IDs for Episodes 1–4 (Jon Gordon, Ken Crenshaw, Mark Immelman, Chris Streveler)
- Confirmation that Substack publication at `https://substack.com/@unlimitpodcast` is configured
- Apple Podcasts, YouTube, Amazon Music URLs once the show is approved on those platforms
- Confirmation of contact email aliases (`hello@`, `guests@`, `partners@`, `press@` `unlimitpodcast.com`) — may not be set up yet

If any are not yet available, deploy with placeholders and document them as follow-ups. The build renders cleanly with all of these missing; they just produce non-functional links until filled in.

## Phases

### Phase 1 — Local setup and verification

1. `npm install`
2. `cp .env.example .env.local` and populate:
   - `NEXT_PUBLIC_ADOBE_FONTS_KIT=<kit_id>`
   - `NEXT_PUBLIC_SUBSTACK_HANDLE=unlimitpodcast` (default already set)
   - `NEXT_PUBLIC_SPOTIFY_SHOW_ID=<show_id>`
3. Edit `lib/content.ts`:
   - Update `LISTEN_PLATFORMS` array — replace `PLACEHOLDER` strings in URLs with actual Spotify/Apple/Amazon URLs
   - Update each entry in `EPISODES` array — populate `spotifyEpisodeId` with real IDs
   - Optionally: populate `showNotes`, `chapters`, `transcript` for Episodes 1–4 from existing content suites (this is a content workstream, not a code workstream; can be deferred)
4. `npm run dev` — verify at `localhost:3000`:
   - Homepage renders with Hero, Latest Episode, Recent Episodes, Host Intro, Newsletter CTA
   - Effra is loading (sans-serif body + headings; the "Unlimit" wordmark renders in Effra italic)
   - Spotify embed renders for the latest episode (if episode ID is set)
   - All routes navigate without 404: /, /episodes, /episodes/[slug] (test 1–2 episodes), /topics, /topics/[slug], /guests, /guests/[slug], /about, /listen, /newsletter, /sponsor, /press, /contact
   - Substack iframe loads on /newsletter
5. `npm run build` — confirm production build succeeds

**Decision point:** Erik reviews local build. Adjustments before any git activity.

### Phase 2 — Git and GitHub

6. `git init && git add . && git commit -m "Initial build: unlimitpodcast.com"`
7. Ask Erik for repo name preference (suggest `unlimit-podcast` or `unlimit-podcast-site`)
8. If `gh` CLI available: `gh repo create <name> --private --source=. --push`. Otherwise direct Erik to create at <https://github.com/new>, then add remote and push.

**Decision point:** Repo visibility (private/public). Push.

### Phase 3 — Vercel project setup

9. Direct Erik to <https://vercel.com/new> → import the GitHub repo
10. Before first deploy, set environment variables in Vercel project settings (all three environments: Production, Preview, Development):
    - `NEXT_PUBLIC_ADOBE_FONTS_KIT`
    - `NEXT_PUBLIC_SUBSTACK_HANDLE`
    - `NEXT_PUBLIC_SPOTIFY_SHOW_ID`
11. Deploy. Verify the Vercel preview URL renders correctly.
12. Verify in View Source:
    - `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">`
    - Effra CSS is loading from Typekit (look for `<link rel="stylesheet" href="https://use.typekit.net/xgf6ltz.css">`)

**Decision point:** Erik reviews preview deployment. Last chance to catch issues before DNS cutover.

### Phase 4 — Domain cutover (Namecheap → Vercel)

This is what takes the site live. Explicit confirmation required.

13. Vercel project settings → Domains → add `unlimitpodcast.com` and `www.unlimitpodcast.com`. Vercel will display the required DNS records.
14. Namecheap → Domain List → unlimitpodcast.com → Manage → Advanced DNS:
    - A record, Host `@`, Value `76.76.21.21`
    - CNAME record, Host `www`, Value `cname.vercel-dns.com.`
15. Wait for DNS propagation (typically 1–4 hours; use `dig unlimitpodcast.com` to verify). SSL provisions automatically.

**Decision point:** Confirm live domain serves the site.

### Phase 5 — Post-launch verification

16. Verify all pages render at the production domain
17. Check meta-robots in View Source
18. Run Lighthouse audit. Target: 95+ Performance, 100 Accessibility, 100 Best Practices, 100 SEO.
19. Submit sitemap to Google Search Console

## Things to flag to Erik

- **Show notes for Episodes 1–4 are placeholder.** The existing content suites have the source material; needs assembly into website-quality show notes. Suggest doing this as a separate content workstream after launch.
- **No show artwork yet.** Spotify for Creators requires podcast cover art; once designed, reference it in `SHOW.coverArtUrl` (field to be added to the content store).
- **No OG image.** Social shares will render generic preview. 1200×630 image needed.
- **Apple Podcasts URL placeholder.** Get from <https://podcasters.apple.com> once the show is approved.
- **Sanity Studio** for non-technical content editing is structurally ready but not wired. Roughly half a day of work when needed.

## Troubleshooting

- **Effra not loading** → check `localhost`, `*.vercel.app`, and the production domain are in the `xgf6ltz` kit's allowed domains list
- **Substack iframe empty** → verify the publication exists at `https://unlimitpodcast.substack.com/embed`. If Substack assigned a different subdomain, update `NEXT_PUBLIC_SUBSTACK_HANDLE`.
- **Spotify embed shows fallback box** → episode ID not yet set in `lib/content.ts` for that episode. Update and redeploy.
- **DNS not propagating** → up to 24 hours. <https://www.whatsmydns.net> checks globally.

## Done

When the live domain serves the new site, all post-launch checks pass, and Erik has signed off on the launch checklist.
