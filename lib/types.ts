/**
 * Content model types — UPDATED for cron sync architecture.
 *
 * The key change from the previous version: `Guest` now has an optional
 * `defaultTopics` field. The cron uses this to auto-tag new episodes
 * featuring a known guest. Set once per guest, applies forever.
 */

export type Topic = {
  slug: string;
  name: string;
  description?: string;
};

export type Guest = {
  slug: string;
  name: string;
  title: string;
  bio: string;
  imageUrl?: string;
  links?: {
    website?: string;
    twitter?: string;
    linkedin?: string;
  };
  /**
   * Topic slugs that always apply to episodes featuring this guest.
   * The cron uses this to auto-tag new episodes — set once per guest,
   * applies to every future episode they appear on.
   *
   * Empty array (or undefined) on a stub-created guest. Edit via JSON
   * directly when filling in the guest's bio.
   */
  defaultTopics?: string[];
};

export type ChapterMarker = {
  timestamp: number;
  label: string;
};

export type ResourceLink = {
  title: string;
  url: string;
  type?: string;
};

export type Episode = {
  number: number;
  slug: string;
  title: string;
  airDate: string;
  guests: string[];
  topics: string[];
  durationSeconds: number;
  /** RSS <guid> — stable unique ID, used by the sync cron to detect new episodes. */
  guid: string;
  /** Direct audio URL from the RSS <enclosure>, used as a fallback if the
   *  Spotify embed isn't available for this episode. */
  audioUrl: string;
  /** Spotify episode ID for the embed iframe. Resolved by the cron's
   *  open.spotify.com scraper; may be absent if the scraper missed. */
  spotifyEpisodeId?: string;
  youtubeVideoId?: string;
  summary: string;
  showNotes: string;
  chapters: ChapterMarker[];
  transcript?: string;
  resources: ResourceLink[];
  relatedEpisodes?: string[];
};

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatAirDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTimestamp(seconds: number): string {
  return formatDuration(seconds);
}
