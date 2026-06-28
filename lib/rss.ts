/**
 * Anchor (Spotify for Creators) RSS feed client
 * -----------------------------------------------
 * Server-side only. Fetches and parses the show's RSS feed.
 *
 * Required env var:
 *   RSS_FEED_URL — e.g. https://anchor.fm/s/11288f500/podcast/rss
 *
 * No auth needed — the feed is public. No Spotify Web API, no client secret,
 * no Premium subscription. This is the entire reason we use RSS.
 */

export type RssEpisode = {
  /** Stable unique identifier from <guid>. Used as the diff key. */
  guid: string;
  /** Episode title, stripped of CDATA/whitespace. */
  title: string;
  /** Episode description (HTML, as authored in Spotify for Creators). */
  descriptionHtml: string;
  /** Direct audio URL from <enclosure>. Playable in HTML5 <audio>. */
  audioUrl: string;
  /** Duration in seconds. Parsed from <itunes:duration>. */
  durationSeconds: number;
  /** Publication date as ISO 8601 string (YYYY-MM-DD). */
  releaseDate: string;
  /** Spotify-for-Creators episode link (browser-friendly). */
  link: string;
};

export async function fetchRssEpisodes(): Promise<RssEpisode[]> {
  const url = process.env.RSS_FEED_URL;
  if (!url) {
    throw new Error("Missing RSS_FEED_URL env var");
  }
  const res = await fetch(url, {
    headers: { "User-Agent": "unlimit-podcast-cron/1.0" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`RSS feed request failed: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();
  return parseRss(xml);
}

/**
 * Minimal RSS parser. We only need a fixed set of fields, all of which appear
 * in predictable positions inside each <item>. No XML library needed.
 */
export function parseRss(xml: string): RssEpisode[] {
  const items = xml.split(/<item>/).slice(1).map((s) => s.split("</item>")[0]);
  const out: RssEpisode[] = [];
  for (const it of items) {
    const guid = pickInner(it, /<guid[^>]*>([\s\S]*?)<\/guid>/);
    const title = stripCdata(pickInner(it, /<title>([\s\S]*?)<\/title>/));
    const descHtml = stripCdata(
      pickInner(it, /<description>([\s\S]*?)<\/description>/),
    );
    const audioUrl = pickAttr(it, /<enclosure[^>]*url="([^"]+)"/);
    const durRaw = pickInner(it, /<itunes:duration>([\s\S]*?)<\/itunes:duration>/);
    const pubDate = pickInner(it, /<pubDate>([\s\S]*?)<\/pubDate>/);
    const link = pickInner(it, /<link>([\s\S]*?)<\/link>/);

    if (!guid || !title || !audioUrl) {
      // Skip malformed entries — we won't be able to sync them anyway.
      continue;
    }
    out.push({
      guid,
      title,
      descriptionHtml: descHtml,
      audioUrl,
      durationSeconds: parseDuration(durRaw),
      releaseDate: parseRfc2822ToIsoDate(pubDate),
      link,
    });
  }
  return out;
}

function pickInner(s: string, re: RegExp): string {
  const m = s.match(re);
  return m ? m[1].trim() : "";
}

function pickAttr(s: string, re: RegExp): string {
  const m = s.match(re);
  return m ? m[1] : "";
}

function stripCdata(s: string): string {
  return s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

/**
 * itunes:duration is allowed in three formats: HH:MM:SS, MM:SS, or seconds.
 * Returns seconds (0 on parse failure — caller should still try to use the
 * episode rather than dropping it).
 */
export function parseDuration(s: string): number {
  if (!s) return 0;
  const parts = s.split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

/** "Thu, 25 Jun 2026 00:59:12 GMT" → "2026-06-25". */
function parseRfc2822ToIsoDate(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
