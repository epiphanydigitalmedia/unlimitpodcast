/**
 * Spotify episode-ID resolver (embed endpoint)
 * --------------------------------------------
 * Resolves (title → episodeId) pairs for the show by reading the public
 * open.spotify.com *embed* page, which ships its data as a __NEXT_DATA__
 * JSON blob we can parse server-side.
 *
 * Why the embed endpoint: Spotify's Web API requires the developer account
 * to have an active Premium subscription to call /shows/{id}/episodes, and
 * the regular show page (open.spotify.com/show/{id}) is now a captcha-gated
 * JS shell that returns no episode data to a server-side fetch. The embed
 * page (open.spotify.com/embed/show/{id}) still renders server-side and
 * embeds the show's most recent episode as structured JSON — no captcha.
 *
 * Scope: the embed page exposes the show's *latest* episode (the one a fresh
 * visitor would hear first). That's exactly what this pipeline needs — the
 * cron's self-healing backfill (see episode-sync.ts) re-runs each cycle, so a
 * newly published episode that Spotify hadn't indexed yet gets resolved on a
 * later run while it's still the newest. Older episodes are expected to have
 * been resolved when they themselves were newest; if a gap ever remains it can
 * be filled by setting spotifyEpisodeId manually in data/episodes.json.
 *
 * Tradeoffs: Spotify can change the embed page shape at any time, breaking
 * this. The caller treats the resolved ID as best-effort: if missing, the
 * player falls back to native HTML5 audio using the RSS enclosure URL.
 *
 * Required env var:
 *   SPOTIFY_SHOW_ID — the show's open.spotify.com ID (e.g. 033fC9vZNYBsByh1MQrpam)
 */

const EMBED_SHOW_BASE = "https://open.spotify.com/embed/show";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

export type SpotifyEpisodeRef = {
  episodeId: string;
  title: string;
};

/**
 * Returns the (title → episodeId) mapping exposed by the show's embed page.
 * In practice this is the show's most recent episode (see module docs).
 * Empty array if the fetch/parse failed or the show is empty.
 */
export async function fetchSpotifyEpisodeMap(): Promise<SpotifyEpisodeRef[]> {
  const showId = process.env.SPOTIFY_SHOW_ID;
  if (!showId) {
    throw new Error("Missing SPOTIFY_SHOW_ID env var");
  }
  const res = await fetch(`${EMBED_SHOW_BASE}/${showId}`, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `Spotify embed page fetch failed: ${res.status} ${res.statusText}`,
    );
  }
  const html = await res.text();
  return parseEmbedPage(html);
}

/**
 * The embed page ships a <script id="__NEXT_DATA__"> JSON blob. Somewhere
 * inside it, each episode is represented by an object carrying a
 * `spotify:episode:{ID}` uri and a title/name. We parse the JSON and walk it
 * for those objects rather than pinning to one exact path, since Spotify
 * reshuffles the tree between releases but keeps the uri/title shape.
 */
export function parseEmbedPage(html: string): SpotifyEpisodeRef[] {
  const m = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (!m) return [];
  let data: unknown;
  try {
    data = JSON.parse(m[1]);
  } catch {
    return [];
  }
  const found = new Map<string, string>(); // episodeId -> title
  const uriRe = /^spotify:episode:([a-zA-Z0-9]{22})$/;
  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    const obj = node as Record<string, unknown>;
    const uri = typeof obj.uri === "string" ? obj.uri : "";
    const uriMatch = uri.match(uriRe);
    if (uriMatch) {
      const title =
        (typeof obj.title === "string" && obj.title) ||
        (typeof obj.name === "string" && obj.name) ||
        "";
      if (title && !found.has(uriMatch[1])) {
        found.set(uriMatch[1], title.trim());
      }
    }
    for (const key of Object.keys(obj)) walk(obj[key]);
  };
  walk(data);
  return [...found].map(([episodeId, title]) => ({ episodeId, title }));
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
