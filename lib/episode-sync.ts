/**
 * Episode sync orchestration
 * ---------------------------
 * The brain of the cron. Reads current state, fetches Spotify state,
 * computes the diff, builds new episode objects, and writes the merged
 * state back to JSON files via the GitHub API.
 *
 * Idempotent: running multiple times with no new episodes is a no-op.
 */

import type { Episode, Guest, Topic } from "./types";
import { fetchAllShowEpisodes, type SpotifyEpisode } from "./spotify";
import { fetchJsonFile, commitJsonFile } from "./github";
import {
  findGuestsInTitle,
  slugifyTitle,
  slugifyName,
  extractProbableGuestName,
} from "./title-parser";

const EPISODES_PATH = "data/episodes.json";
const GUESTS_PATH = "data/guests.json";
const TOPICS_PATH = "data/topics.json";

/** Topics applied to solo host episodes (no guest in title) */
const SOLO_EPISODE_TOPICS = ["mental-performance", "mindset", "leadership"];

export type SyncResult = {
  newEpisodeCount: number;
  newGuestCount: number;
  newEpisodes: Array<{ slug: string; title: string; topics: string[]; guests: string[] }>;
  stubGuests: string[];
  errors: string[];
  noop: boolean;
};

/**
 * Strip HTML from a string. Used to convert Spotify's html_description into
 * plain text for the `summary` field.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}

/**
 * Generate a 2-3 sentence summary from a full description.
 * Takes up to ~280 chars or the first 2 sentences, whichever is shorter.
 */
function generateSummary(description: string): string {
  const plain = stripHtml(description).trim();
  // Find sentence boundaries
  const sentences = plain.match(/[^.!?]+[.!?]+/g) ?? [plain];
  let summary = "";
  for (const sentence of sentences) {
    if ((summary + sentence).length > 320) break;
    summary += sentence;
    if (summary.length > 180) break; // 2 short sentences is enough
  }
  return summary.trim() || plain.substring(0, 280) + "…";
}

/**
 * Given a Spotify episode and current guest roster, derive the topic slugs
 * to apply via the persistent-topics model.
 */
function deriveTopics(guestSlugs: string[], guests: Guest[]): string[] {
  if (guestSlugs.length === 0) {
    // Solo episode
    return SOLO_EPISODE_TOPICS;
  }
  // Union of all matched guests' defaultTopics
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
 * Build an Episode object from a Spotify episode + roster context.
 * Mutates the guests array if a stub guest is created.
 */
function buildEpisodeEntry(
  spotifyEp: SpotifyEpisode,
  guests: Guest[],
  nextNumber: number,
  stubGuestsAdded: string[]
): Episode {
  // 1. Try to match against known guests
  let guestSlugs = findGuestsInTitle(spotifyEp.name, guests);
  const knownGuestNames = guests
    .filter((g) => guestSlugs.includes(g.slug))
    .map((g) => g.name);

  // 2. If no known guests matched, try to extract a probable new guest
  if (guestSlugs.length === 0) {
    const probable = extractProbableGuestName(spotifyEp.name);
    if (probable) {
      const newSlug = slugifyName(probable);
      // Make sure we're not duplicating an existing slug
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

  return {
    number: nextNumber,
    slug: slugifyTitle(spotifyEp.name, knownGuestNames),
    title: spotifyEp.name,
    airDate: spotifyEp.release_date,
    guests: guestSlugs,
    topics: deriveTopics(guestSlugs, guests),
    durationSeconds: Math.round(spotifyEp.duration_ms / 1000),
    spotifyEpisodeId: spotifyEp.id,
    youtubeVideoId: undefined,
    summary: generateSummary(spotifyEp.description),
    showNotes: spotifyEp.html_description,
    chapters: [], // TODO — parse from description if needed in a future revision
    resources: [],
    relatedEpisodes: [],
  };
}

/**
 * Run the sync. Pulls current data, fetches Spotify, diffs, commits any
 * new episodes back to the repo.
 */
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

  // 2. Fetch all episodes from Spotify
  const spotifyEpisodes = await fetchAllShowEpisodes();

  // 3. Identify new episodes (by Spotify ID)
  const existingSpotifyIds = new Set(
    episodesFile.content
      .map((e) => e.spotifyEpisodeId)
      .filter((id): id is string => Boolean(id))
  );
  const newSpotifyEpisodes = spotifyEpisodes.filter((ep) => !existingSpotifyIds.has(ep.id));

  if (newSpotifyEpisodes.length === 0) {
    result.noop = true;
    return result;
  }

  // 4. Order new episodes from oldest to newest so episode numbers increment correctly
  newSpotifyEpisodes.sort(
    (a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
  );

  // 5. Determine starting episode number
  const maxExistingNumber = Math.max(0, ...episodesFile.content.map((e) => e.number));

  // 6. Build new episode entries (may stub-create new guests)
  const updatedGuests = [...guestsFile.content];
  const newEpisodeEntries: Episode[] = [];
  for (let i = 0; i < newSpotifyEpisodes.length; i++) {
    const spotifyEp = newSpotifyEpisodes[i];
    const entry = buildEpisodeEntry(
      spotifyEp,
      updatedGuests,
      maxExistingNumber + i + 1,
      result.stubGuests
    );
    newEpisodeEntries.push(entry);
  }

  // 7. Merge: prepend new episodes so newest-first ordering is preserved
  //    (we sort by airDate in code, but having JSON in sensible order helps editing)
  const mergedEpisodes = [...newEpisodeEntries.reverse(), ...episodesFile.content];

  // 8. Commit the updated episodes file
  const episodeCount = newEpisodeEntries.length;
  const episodeLabel = episodeCount === 1 ? "episode" : "episodes";
  await commitJsonFile(
    EPISODES_PATH,
    mergedEpisodes,
    episodesFile.sha,
    `cron: add ${episodeCount} new ${episodeLabel} from Spotify`
  );

  // 9. Commit updated guests file if any stub guests were created
  if (result.stubGuests.length > 0) {
    // Refetch sha since we may need it (or use the original)
    await commitJsonFile(
      GUESTS_PATH,
      updatedGuests,
      guestsFile.sha,
      `cron: stub-add ${result.stubGuests.length} new guest(s) — fill in bio + defaultTopics`
    );
  }

  // 10. Populate result
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
