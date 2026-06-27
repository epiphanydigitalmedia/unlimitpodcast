#!/usr/bin/env node
/**
 * sync-episodes — pull new episodes from the show's RSS feed and stub them
 * into lib/content.ts. Run after publishing a new episode to Spotify/Anchor.
 *
 * Usage:
 *   npm run sync-episodes          # write changes
 *   npm run sync-episodes -- --dry-run   # preview only
 *
 * What it does:
 *   1. Fetches the RSS feed
 *   2. Parses each item (title, pubDate, duration, summary, GUID)
 *   3. Compares against lib/content.ts by title and GUID
 *   4. For each new episode, generates a stub entry with TODOs and inserts
 *      it at the top of the EPISODES array (reverse-chronological order)
 *
 * What it does NOT do:
 *   - Populate spotifyEpisodeId (paste from open.spotify.com after sync)
 *   - Write transcripts or show notes (manual editorial passes)
 *   - Touch existing entries (idempotent — safe to re-run)
 */
import { readFile, writeFile } from "node:fs/promises";

const RSS_URL = "https://anchor.fm/s/11288f500/podcast/rss";
const CONTENT_PATH = "lib/content.ts";
const SPOTIFY_SHOW_URL = "https://open.spotify.com/show/033fC9vZNYBsByh1MQrpam";
const DRY_RUN = process.argv.includes("--dry-run");

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[''"`]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function toISODate(rfc822) {
  return new Date(rfc822).toISOString().slice(0, 10);
}

function parseDurationToSeconds(str) {
  if (!str) return 0;
  if (/^\d+$/.test(str)) return parseInt(str, 10);
  const parts = str.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function htmlEntitiesDecode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function cleanSummary(html) {
  if (!html) return "";
  const decoded = htmlEntitiesDecode(html);
  const plain = decoded.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  // Take the first ~3 sentences, capped at ~500 chars
  const sentences = plain.match(/[^.!?]+[.!?]+(?:\s|$)/g);
  const truncated = sentences
    ? sentences.slice(0, 3).join("").trim()
    : plain.slice(0, 500).trim();
  return truncated.length > 500 ? truncated.slice(0, 497) + "..." : truncated;
}

function extractTag(item, tagName) {
  // Handles both <tag>value</tag> and <tag><![CDATA[value]]></tag>
  const re = new RegExp(
    `<${tagName}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tagName}>`,
  );
  const m = item.match(re);
  return m ? m[1].trim() : null;
}

function escapeForTsString(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// ----------------------------------------------------------------------------
// RSS parsing
// ----------------------------------------------------------------------------

async function fetchRssEpisodes() {
  const res = await fetch(RSS_URL);
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const rss = await res.text();
  const items = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  return items
    .map((item) => ({
      guid: extractTag(item, "guid"),
      title: extractTag(item, "title"),
      pubDate: extractTag(item, "pubDate"),
      durationStr: extractTag(item, "itunes:duration"),
      summaryHtml:
        extractTag(item, "itunes:summary") || extractTag(item, "description"),
    }))
    .filter((e) => e.title && e.pubDate)
    .map((e) => ({
      guid: e.guid,
      title: e.title,
      airDate: toISODate(e.pubDate),
      durationSeconds: parseDurationToSeconds(e.durationStr),
      summary: cleanSummary(e.summaryHtml),
    }));
}

// ----------------------------------------------------------------------------
// content.ts manipulation
// ----------------------------------------------------------------------------

function findExistingMatchKeys(content) {
  // Pull out every title string and rss-guid comment that's already in the file
  // so we can compare against fresh RSS items.
  const titles = new Set();
  const guids = new Set();

  // Match `title:` strings (multi-line indented)
  const titleRe = /title:\s*\n?\s*"((?:[^"\\]|\\.)*)"/g;
  for (const m of content.matchAll(titleRe)) {
    titles.add(m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\"));
  }

  // Match `// rss-guid: <uuid>` comments left behind by previous syncs
  const guidRe = /\/\/\s*rss-guid:\s*([a-z0-9-]+)/gi;
  for (const m of content.matchAll(guidRe)) {
    guids.add(m[1]);
  }

  return { titles, guids };
}

function findMaxEpisodeNumber(content) {
  let max = 0;
  for (const m of content.matchAll(/number:\s*(\d+)/g)) {
    const n = parseInt(m[1], 10);
    if (n > max) max = n;
  }
  return max;
}

function generateEntry(ep, number) {
  return `  {
    // rss-guid: ${ep.guid}
    number: ${number},
    slug: "${slugify(ep.title)}",
    title:
      "${escapeForTsString(ep.title)}",
    airDate: "${ep.airDate}",
    guests: [], // TODO: add guest slug(s) if applicable
    topics: [], // TODO: add topic slug(s)
    durationSeconds: ${ep.durationSeconds},
    spotifyEpisodeId: undefined, // TODO: paste from ${SPOTIFY_SHOW_URL}
    youtubeVideoId: undefined,
    summary:
      "${escapeForTsString(ep.summary)}",
    showNotes: \`TODO: Draft from transcript (Plaud → sanitize → editorial pass).\`,
    chapters: [],
    resources: [],
    relatedEpisodes: [],
  },
`;
}

function insertStubs(content, stubs) {
  const marker = "export const EPISODES: Episode[] = [\n";
  const idx = content.indexOf(marker);
  if (idx === -1) {
    throw new Error(`Could not locate EPISODES array in ${CONTENT_PATH}`);
  }
  const insertAt = idx + marker.length;
  return content.slice(0, insertAt) + stubs + content.slice(insertAt);
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

async function main() {
  console.log(`Fetching RSS feed → ${RSS_URL}`);
  const rssEpisodes = await fetchRssEpisodes();
  console.log(`  found ${rssEpisodes.length} episode(s) in feed`);

  const content = await readFile(CONTENT_PATH, "utf8");
  const { titles, guids } = findExistingMatchKeys(content);
  console.log(
    `  ${titles.size} existing title(s), ${guids.size} tracked rss-guid(s) in ${CONTENT_PATH}`,
  );

  const newOnes = rssEpisodes.filter(
    (ep) => !titles.has(ep.title) && !(ep.guid && guids.has(ep.guid)),
  );

  if (newOnes.length === 0) {
    console.log("\n✓ Up to date. No new episodes to add.");
    return;
  }

  console.log(`\nNew episodes to add (${newOnes.length}):`);
  for (const ep of newOnes) {
    console.log(`  • [${ep.airDate}] ${ep.title}`);
    console.log(
      `      duration ${ep.durationSeconds}s · summary: ${ep.summary.slice(0, 100)}${ep.summary.length > 100 ? "…" : ""}`,
    );
  }

  if (DRY_RUN) {
    console.log("\n(--dry-run) No changes written.");
    return;
  }

  // Assign episode numbers: newest gets highest number; insert in reverse-chron order
  const maxExisting = findMaxEpisodeNumber(content);
  // newOnes is in RSS order (newest first); assign descending numbers
  const stubs = newOnes
    .map((ep, idx) => generateEntry(ep, maxExisting + newOnes.length - idx))
    .join("");

  const updated = insertStubs(content, stubs);
  await writeFile(CONTENT_PATH, updated);

  console.log(`\n✓ Inserted ${newOnes.length} stub(s) into ${CONTENT_PATH}.`);
  console.log("\nNext steps:");
  console.log(
    "  1. Open lib/content.ts and fill in the TODOs (spotifyEpisodeId, topics, guests)",
  );
  console.log(
    "  2. Paste Plaud transcript → create lib/transcripts/<slug>.ts → import in content.ts",
  );
  console.log("  3. Draft show notes (replace the TODO string)");
  console.log("  4. npm run build && vercel --prod");
}

main().catch((err) => {
  console.error("\n✗ Sync failed:", err.message);
  process.exit(1);
});
