/**
 * Content store
 * -------------
 * Episodes / guests / topics live in JSON files under `data/` so the daily
 * Spotify sync cron can update them programmatically without touching code.
 *
 * Show metadata, host info, listen platforms, and the Substack URL still live
 * here — they're stable enough that code edits are fine for changes.
 *
 * Transcripts are kept as TypeScript modules (markdown-as-string) and merged
 * into the episode list by slug at runtime. New episodes auto-synced by the
 * cron simply get no transcript until one is added here.
 */

import type { Episode, Guest, Topic } from "./types";
import episodesData from "@/data/episodes.json";
import guestsData from "@/data/guests.json";
import topicsData from "@/data/topics.json";

// Transcripts — keyed by episode slug.
import jonGordonTranscript from "./transcripts/jon-gordon-the-energy-bus";
import kenCrenshawTranscript from "./transcripts/ken-crenshaw-on-the-long-game";
import markImmelmanTranscript from "./transcripts/mark-immelman-on-tour-mindset";
import chrisStrevelerTranscript from "./transcripts/chris-streveler-the-long-path";
import fckItSwitchTranscript from "./transcripts/the-fck-it-switch";

const TRANSCRIPTS: Record<string, string> = {
  "jon-gordon-the-energy-bus": jonGordonTranscript,
  "ken-crenshaw-on-the-long-game": kenCrenshawTranscript,
  "mark-immelman-on-tour-mindset": markImmelmanTranscript,
  "chris-streveler-the-long-path": chrisStrevelerTranscript,
  "the-fck-it-switch": fckItSwitchTranscript,
};

// ============================================================================
// Show metadata (rarely changes — staying as code)
// ============================================================================

export const SHOW = {
  name: "Unlimit Your Potential",
  tagline: "Mental performance, mindset, and the work behind elite execution.",
  description:
    "The Unlimit Your Potential podcast goes inside the minds of those who perform at the highest level — Olympians, World Champions, business executives, and creative leaders. Host Seth Pepper draws out what they think, what they say to themselves, and the work behind their action.",
  url: "https://unlimitpodcast.com",
};

export const HOST = {
  name: "Seth Pepper",
  shortBio:
    "Former American Record-Holder, World Championships Medalist, and high-performance coach to Olympians, business executives, and creative leaders.",
  longBio:
    "Seth Pepper is a high-performance coach with 25 years of experience competing and coaching when the stakes are at their greatest. A former American Record-Holder, two-time National Champion, and World Championships Medalist in swimming, Seth has dedicated his professional life to applying what he learned reaching the top of his own field to help others reach theirs — across sport, business, and creative leadership.",
  personalSiteUrl: "https://sethpepper.com",
};

export const LISTEN_PLATFORMS = [
  {
    name: "Spotify",
    url: "https://open.spotify.com/show/033fC9vZNYBsByh1MQrpam",
    handle: "Spotify",
  },
  {
    name: "Apple Podcasts",
    url: "https://podcasts.apple.com/us/podcast/unlimit-your-potential-with-seth-pepper/id1896638745",
    handle: "Apple Podcasts",
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com/@unlimitpodcast",
    handle: "YouTube",
  },
  {
    name: "Amazon Music",
    url: "https://music.amazon.com/podcasts/32b7830c-b948-4809-a4ec-50aeda15b3ab/unlimit-your-potential-with-seth-pepper",
    handle: "Amazon Music",
  },
  {
    name: "RSS",
    url: "https://anchor.fm/s/11288f500/podcast/rss",
    handle: "RSS Feed",
  },
];

export const SUBSTACK_URL = "https://substack.com/@unlimitpodcast";

// ============================================================================
// Episodes, guests, and topics — from JSON, mutated by the cron
// ============================================================================

export const TOPICS: Topic[] = topicsData as Topic[];
export const GUESTS: Guest[] = guestsData as Guest[];

// Merge transcripts onto episodes by slug.
export const EPISODES: Episode[] = (episodesData as Episode[]).map((e) => {
  const transcript = TRANSCRIPTS[e.slug];
  return transcript ? { ...e, transcript } : e;
});

// ============================================================================
// Helpers
// ============================================================================

export function getAllEpisodes(): Episode[] {
  return [...EPISODES].sort(
    (a, b) => new Date(b.airDate).getTime() - new Date(a.airDate).getTime(),
  );
}

export function getEpisodeBySlug(slug: string): Episode | undefined {
  return EPISODES.find((e) => e.slug === slug);
}

export function getGuestBySlug(slug: string): Guest | undefined {
  return GUESTS.find((g) => g.slug === slug);
}

export function getTopicBySlug(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

export function getEpisodesByTopic(topicSlug: string): Episode[] {
  return getAllEpisodes().filter((e) => e.topics.includes(topicSlug));
}

export function getEpisodesByGuest(guestSlug: string): Episode[] {
  return getAllEpisodes().filter((e) => e.guests.includes(guestSlug));
}
