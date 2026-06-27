/**
 * Title parsing
 * --------------
 * Episode titles follow patterns like:
 *   "Ryan Sweeney — There Is an AI in You: ..."
 *   "From Undrafted to the NFL: Chris Streveler on Mindset..."
 *   "Stay Calm in the Chaos: ... | Dan Fleyshman"
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

/**
 * Generate a URL slug from an episode title.
 * Strips guest names if known (since they're metadata, not title-content),
 * lowercases, replaces non-alphanumeric with hyphens, collapses repeats.
 *
 * "Ryan Sweeney — There Is an AI in You: The Inner Game"
 *   → "there-is-an-ai-in-you-the-inner-game"
 */
export function slugifyTitle(title: string, knownGuestNames: string[] = []): string {
  let cleaned = title;
  // Strip known guest names (case-insensitive)
  for (const name of knownGuestNames) {
    cleaned = cleaned.replace(new RegExp(name, "gi"), "");
  }
  return cleaned
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")     // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")          // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, "")              // trim leading/trailing hyphens
    .replace(/-{2,}/g, "-")               // collapse repeats
    .substring(0, 80);                    // cap length
}

/**
 * Heuristic: extract a probable new-guest name from a title when no known
 * guest matches. Looks for "FirstName LastName" patterns near common delimiters
 * (em-dash, colon, pipe).
 *
 * Returns null if no confident extraction.
 * This is intentionally conservative — better to stub-create no guest than
 * the wrong one.
 */
export function extractProbableGuestName(title: string): string | null {
  // Split on common separators, look for capitalized-word pairs
  const segments = title.split(/[—–|:]/).map((s) => s.trim());
  for (const segment of segments) {
    // Match "FirstName LastName" or "FirstName M LastName" at the start of a segment
    const match = segment.match(/^([A-Z][a-z]+)(?:\s+[A-Z]\.?)?\s+([A-Z][a-z]+(?:-[A-Z][a-z]+)?)/);
    if (match) {
      return `${match[1]} ${match[2]}`;
    }
  }
  return null;
}

/**
 * Generate a slug for a new guest from their name.
 * "Dan Fleyshman" → "dan-fleyshman"
 */
export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
