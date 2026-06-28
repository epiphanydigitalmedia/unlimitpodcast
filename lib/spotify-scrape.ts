/**
 * Spotify show page scraper
 * --------------------------
 * Fetches the public open.spotify.com show page and extracts
 * (title → episodeId) pairs from the rendered HTML.
 *
 * Why scrape: Spotify's Web API now requires the developer account to have
 * an active Premium subscription to call /shows/{id}/episodes, so we can't
 * use it. The public show page exposes episode IDs in href=/episode/{id}
 * links right next to data-testid="episodeTitle" elements — parseable.
 *
 * Tradeoffs: Spotify can change their HTML at any time, breaking this. The
 * caller treats the resolved ID as best-effort: if missing, the player falls
 * back to native HTML5 audio using the RSS enclosure URL.
 *
 * Required env var:
 *   SPOTIFY_SHOW_ID — the show's open.spotify.com ID (e.g. 033fC9vZNYBsByh1MQrpam)
 */

const SHOW_PAGE_BASE = "https://open.spotify.com/show";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

export type SpotifyEpisodeRef = {
  episodeId: string;
  title: string;
};

/**
 * Returns the (title → episodeId) mapping for every episode currently visible
 * on the show page. Empty array if scraping failed or the show is empty.
 */
export async function fetchSpotifyEpisodeMap(): Promise<SpotifyEpisodeRef[]> {
  const showId = process.env.SPOTIFY_SHOW_ID;
  if (!showId) {
    throw new Error("Missing SPOTIFY_SHOW_ID env var");
  }
  const res = await fetch(`${SHOW_PAGE_BASE}/${showId}`, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `Spotify show page fetch failed: ${res.status} ${res.statusText}`,
    );
  }
  const html = await res.text();
  return parseShowPage(html);
}

/**
 * The show page's episode list renders each episode roughly like:
 *   <a href="/episode/{ID}"><h4 ... data-testid="episodeTitle">
 *     <span ...></span>{TITLE}</h4></a>
 * We extract (ID, TITLE) pairs by regex. Order matches the page order
 * (newest first) but the caller matches by title so order doesn't matter.
 */
export function parseShowPage(html: string): SpotifyEpisodeRef[] {
  const out: SpotifyEpisodeRef[] = [];
  const re =
    /<a[^>]*href="\/episode\/([a-zA-Z0-9]{22})"[^>]*>[\s\S]{0,400}?data-testid="episodeTitle"[^>]*>([\s\S]*?)<\/h4>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const episodeId = m[1];
    const titleHtml = m[2];
    // Strip inner tags like <span aria-label="New episode"></span>
    const title = decodeEntities(titleHtml.replace(/<[^>]*>/g, "")).trim();
    if (title) out.push({ episodeId, title });
  }
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
}

/**
 * Resolve a Spotify episode ID for a given episode title. Returns undefined
 * if no good match found — the caller falls back to native audio.
 *
 * Matching is case-insensitive on a normalized form (lowercase, collapse
 * whitespace, strip a few common punctuation differences). We require a
 * fairly tight match because RSS titles and Spotify titles are usually
 * identical (both come from the same Spotify-for-Creators upload).
 */
export function resolveSpotifyIdByTitle(
  rssTitle: string,
  refs: SpotifyEpisodeRef[],
): string | undefined {
  const target = normalizeTitle(rssTitle);
  // Exact normalized match
  const exact = refs.find((r) => normalizeTitle(r.title) === target);
  if (exact) return exact.episodeId;
  // Prefix match (Spotify sometimes truncates long titles with ellipsis)
  const prefix = refs.find(
    (r) =>
      target.startsWith(normalizeTitle(r.title).replace(/…$/, "")) ||
      normalizeTitle(r.title).startsWith(target.replace(/…$/, "")),
  );
  return prefix?.episodeId;
}

function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}
