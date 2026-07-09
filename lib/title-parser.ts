/**
 * Title parsing
 * --------------
 * Episode titles follow patterns like:
 *   "Ryan Sweeney — There Is an AI in You: ..."
 *   "From Undrafted to the NFL: Chris Streveler on Mindset..."
 *   "Stay Calm in the Chaos: ... | Dan Fleyshman"
 *   "Learn To Say No | Dr. Rahsaan Lindsey"
 *   "The F#ck It Switch: How I Broke Every Rule..."  (solo episode)
 *
 * The parser tries to find ANY guest from the known roster whose name
 * appears in the title. It does NOT do fuzzy matching — names must be
 * exact (case-insensitive). This is deliberate: false matches would
 * silently mis-tag episodes.
 */

import type { Guest } from "./types";

/**
 * Returns the slugs of any guests whose name appears in the title.
 * Empty array means solo episode (or genuinely unknown guest).
 */
export function findGuestsInTitle(title: string, guests: Guest[]): string[] {
  const normalizedTitle = title.toLowerCase();
  const matches: string[] = [];
  for (const guest of guests) {
    const normalizedName = guest.name.toLowerCase();
    if (normalizedTitle.includes(normalizedName)) {
      matches.push(guest.slug);
    }
  }
  return matches;
}

/** Honorifics we strip before name extraction and before slug generation. */
const HONORIFIC_RE = /\b(?:dr|prof|mr|mrs|ms|sir|dame|rev|fr|pastor|coach)\.?\s+/gi;

/**
 * Words that look like proper-noun candidates (capitalized-lowercase) but are
 * common English words or verbs that would produce garbage guest names when
 * matched. Any two-word "name" whose first OR second word appears here is
 * rejected.
 */
const NAME_STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "how", "why", "what", "when", "where",
  "who", "which", "learn", "from", "stay", "feed", "grow", "build", "make",
  "get", "keep", "let", "you", "your", "my", "our", "we", "is", "are", "was",
  "were", "be", "been", "to", "of", "in", "on", "at", "for", "with", "by",
  "as", "this", "that", "these", "those", "here", "there", "now", "then",
  "up", "down", "over", "under", "through", "into", "onto", "off", "against",
  "before", "after", "between", "among", "beyond", "beside", "behind", "above",
  "below", "no", "yes", "not", "never", "always", "just", "only",
]);

/**
 * Generate a URL slug from an episode title.
 * Strips guest names + honorifics (they're metadata, not title content),
 * lowercases, replaces non-alphanumeric with hyphens, collapses repeats.
 *
 * "Learn To Say No | Dr. Rahsaan Lindsey" → "learn-to-say-no"
 * "Ryan Sweeney — There Is an AI in You: The Inner Game" → "there-is-an-ai-in-you-the-inner-game"
 */
export function slugifyTitle(title: string, knownGuestNames: string[] = []): string {
  let cleaned = title;
  for (const name of knownGuestNames) {
    cleaned = cleaned.replace(new RegExp(name, "gi"), "");
  }
  cleaned = cleaned.replace(HONORIFIC_RE, "");
  return cleaned
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .substring(0, 80);
}

/**
 * Heuristic: extract a probable new-guest name from a title when no known
 * guest matches. Prefers segments after a delimiter (guest names typically
 * appear at the end of titles like "Topic | Guest Name"), strips honorifics,
 * and rejects common-word pairs like "Learn To" or "How I".
 *
 * Returns null if no confident extraction — better to stub no guest than
 * the wrong one.
 */
export function extractProbableGuestName(title: string): string | null {
  const segments = title.split(/[—–|:]/).map((s) => s.trim());
  // Guests typically appear after the last delimiter (title | guest, topic — guest).
  // Try segments in reverse so the last one wins.
  for (let i = segments.length - 1; i >= 0; i--) {
    const name = tryExtractName(segments[i]);
    if (name) return name;
  }
  return null;
}

function tryExtractName(segment: string): string | null {
  const stripped = segment.replace(HONORIFIC_RE, "");
  const match = stripped.match(
    /^([A-Z][a-z]+)(?:\s+[A-Z]\.?)?\s+([A-Z][a-z]+(?:-[A-Z][a-z]+)?)/,
  );
  if (!match) return null;
  const first = match[1];
  const last = match[2];
  // Reject if either word is a common English word — avoids "Learn To",
  // "How I", "The Right", "From Undrafted", etc.
  if (NAME_STOP_WORDS.has(first.toLowerCase())) return null;
  if (NAME_STOP_WORDS.has(last.toLowerCase())) return null;
  return `${first} ${last}`;
}

/**
 * Generate a slug for a new guest from their name.
 * "Dan Fleyshman" → "dan-fleyshman"
 */
export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
