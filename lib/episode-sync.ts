/**
 * Episode sync orchestration
 * ---------------------------
 * The brain of the cron. Reads current state, fetches the RSS feed, computes
 * the diff, builds new episode objects, and writes the merged state back to
 * JSON files via the GitHub API.
 *
 * Idempotent: running multiple times with no new episodes is a no-op.
 */

import type { Episode, Guest } from "./types";
import { fetchRssEpisodes, type RssEpisode } from "./rss";
import {
  fetchSpotifyEpisodeMap,
  resolveSpotifyIdByTitle,
  type SpotifyEpisodeRef,
} from "./spotify-scrape";
import { fetchJsonFile, commitJsonFile } from "./github";
import {
  findGuestsInTitle,
  slugifyTitle,
  slugifyName,
  extractProbableGuestName,
} from "./title-parser";

const EPISODES_PATH = "data/episodes.json";
const GUESTS_PATH = "data/guests.json";

/** Topics applied to solo host episodes (no guest in title). */
const SOLO_EPISODE_TOPICS = ["mental-performance", "mindset", "leadership"];

export type SyncResult = {
  newEpisodeCount: number;
  newGuestCount: number;
  newEpisodes: Array<{
    slug: string;
    title: string;
    topics: string[];
    guests: string[];
  }>;
  stubGuests: string[];
  errors: string[];
  noop: boolean;
};

/** Strip HTML tags + decode a few common entities for the plain-text summary. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

/** Pull a short summary (~2 sentences) out of a full description. */
function generateSummary(html: string): string {
  const plain = stripHtml(html).trim();
  const sentences = plain.match(/[^.!?]+[.!?]+/g) ?? [plain];
  let summary = "";
  for (const sentence of sentences) {
    if ((summary + sentence).length > 320) break;
    summary += sentence;
    if (summary.length > 180) break;
  }
  return summary.trim() || plain.substring(0, 280) + "…";
}

function deriveTopics(guestSlugs: string[], guests: Guest[]): string[] {
  if (guestSlugs.length === 0) return SOLO_EPISODE_TOPICS;
  const topicSet = new Set<string>();
  for (const slug of guestSlugs) {
    const guest = guests.find((g) => g.slug === slug);
    if (guest?.defaultTopics) {
      for (const t of guest.defaultTopics) topicSet.add(t);
    }
  }
  return [...topicSet];
}

/**
 * Build an Episode object from an RSS episode + roster context.
 * Mutates `guests` if a stub guest is created.
 */
function buildEpisodeEntry(
  rssEp: RssEpisode,
  guests: Guest[],
  nextNumber: number,
  stubGuestsAdded: string[],
  spotifyRefs: SpotifyEpisodeRef[],
): Episode {
  let guestSlugs = findGuestsInTitle(rssEp.title, guests);
  const knownGuestNames = guests
    .filter((g) => guestSlugs.includes(g.slug))
    .map((g) => g.name);

  if (guestSlugs.length === 0) {
    const probable = extractProbableGuestName(rssEp.title);
    if (probable) {
      const newSlug = slugifyName(probable);
      if (!guests.some((g) => g.slug === newSlug)) {
        guests.push({
          slug: newSlug,
          name: probable,
          title: "TODO — fill in guest title",
          bio: "TODO — fill in guest bio. This guest was auto-stubbed by the episode-sync cron.",
          defaultTopics: [],
        });
        stubGuestsAdded.push(newSlug);
      }
      guestSlugs = [newSlug];
      knownGuestNames.push(probable);
    }
  }

  const spotifyEpisodeId = resolveSpotifyIdByTitle(rssEp.title, spotifyRefs);

  return {
    number: nextNumber,
    slug: slugifyTitle(rssEp.title, knownGuestNames),
    title: rssEp.title,
    airDate: rssEp.releaseDate,
    guests: guestSlugs,
    topics: deriveTopics(guestSlugs, guests),
    durationSeconds: rssEp.durationSeconds,
    guid: rssEp.guid,
    audioUrl: rssEp.audioUrl,
    spotifyEpisodeId,
    summary: generateSummary(rssEp.descriptionHtml),
    showNotes: rssEp.descriptionHtml,
    chapters: [],
    resources: [],
    relatedEpisodes: [],
  };
}

export async function runSync(): Promise<SyncResult> {
  const result: SyncResult = {
    newEpisodeCount: 0,
    newGuestCount: 0,
    newEpisodes: [],
    stubGuests: [],
    errors: [],
    noop: false,
  };

  // 1. Load current state from GitHub
  const [episodesFile, guestsFile] = await Promise.all([
    fetchJsonFile<Episode[]>(EPISODES_PATH),
    fetchJsonFile<Guest[]>(GUESTS_PATH),
  ]);

  // 2. Fetch RSS feed + Spotify show page in parallel
  //    (scraper failure shouldn't block sync — fallback to native audio)
  const [rssEpisodes, spotifyRefs] = await Promise.all([
    fetchRssEpisodes(),
    fetchSpotifyEpisodeMap().catch((err) => {
      result.errors.push(
        `Spotify scrape failed (will fall back to native audio): ${err instanceof Error ? err.message : String(err)}`,
      );
      return [] as SpotifyEpisodeRef[];
    }),
  ]);

  // 3. Identify new episodes by GUID
  const existingGuids = new Set(
    episodesFile.content
      .map((e) => e.guid)
      .filter((g): g is string => Boolean(g)),
  );
  const newRssEpisodes = rssEpisodes.filter((ep) => !existingGuids.has(ep.guid));

  if (newRssEpisodes.length === 0) {
    result.noop = true;
    return result;
  }

  // 4. Order oldest → newest so episode numbers increment correctly
  newRssEpisodes.sort(
    (a, b) =>
      new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime(),
  );

  // 5. Determine starting episode number
  const maxExistingNumber = Math.max(
    0,
    ...episodesFile.content.map((e) => e.number),
  );

  // 6. Build new episode entries (may stub-create new guests)
  const updatedGuests = [...guestsFile.content];
  const newEpisodeEntries: Episode[] = [];
  for (let i = 0; i < newRssEpisodes.length; i++) {
    const entry = buildEpisodeEntry(
      newRssEpisodes[i],
      updatedGuests,
      maxExistingNumber + i + 1,
      result.stubGuests,
      spotifyRefs,
    );
    newEpisodeEntries.push(entry);
  }

  // 7. Merge: prepend newest so JSON stays newest-first
  const mergedEpisodes = [
    ...newEpisodeEntries.slice().reverse(),
    ...episodesFile.content,
  ];

  // 8. Commit episodes file
  const epLabel = newEpisodeEntries.length === 1 ? "episode" : "episodes";
  await commitJsonFile(
    EPISODES_PATH,
    mergedEpisodes,
    episodesFile.sha,
    `cron: add ${newEpisodeEntries.length} new ${epLabel} from RSS`,
  );

  // 9. Commit updated guests file if any stubs were created
  if (result.stubGuests.length > 0) {
    await commitJsonFile(
      GUESTS_PATH,
      updatedGuests,
      guestsFile.sha,
      `cron: stub-add ${result.stubGuests.length} new guest(s) — fill in bio + defaultTopics`,
    );
  }

  result.newEpisodeCount = newEpisodeEntries.length;
  result.newGuestCount = result.stubGuests.length;
  result.newEpisodes = newEpisodeEntries.map((e) => ({
    slug: e.slug,
    title: e.title,
    topics: e.topics,
    guests: e.guests,
  }));
  return result;
}
