/**
 * Spotify Web API client
 * -----------------------
 * Server-side only. Uses OAuth 2.0 client credentials flow.
 * Required env vars:
 *   SPOTIFY_CLIENT_ID
 *   SPOTIFY_CLIENT_SECRET
 *   SPOTIFY_SHOW_ID
 *
 * Tokens are cached in-memory for the lifetime of the serverless invocation.
 * Spotify tokens are valid for 1 hour; a fresh token is fetched on each
 * cron run, which is fine since cron runs are infrequent.
 */

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export type SpotifyEpisode = {
  id: string;                    // The Spotify episode ID we need for embeds
  name: string;                  // Episode title
  description: string;           // HTML-stripped episode description
  html_description: string;      // Original HTML description (for show notes)
  duration_ms: number;           // Duration in milliseconds
  release_date: string;          // ISO date "YYYY-MM-DD"
  external_urls: { spotify: string };
  audio_preview_url: string | null;
  images: Array<{ url: string; height: number; width: number }>;
};

type TokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
};

type EpisodesResponse = {
  items: SpotifyEpisode[];
  total: number;
  next: string | null;
};

/** Get an access token via client credentials flow */
async function getAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET env vars");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify token request failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as TokenResponse;
  return data.access_token;
}

/**
 * Fetch all episodes for the configured show.
 * Handles pagination automatically.
 * Returns episodes in Spotify's default order (newest first).
 */
export async function fetchAllShowEpisodes(): Promise<SpotifyEpisode[]> {
  const showId = process.env.SPOTIFY_SHOW_ID;
  if (!showId) {
    throw new Error("Missing SPOTIFY_SHOW_ID env var");
  }

  const token = await getAccessToken();
  const episodes: SpotifyEpisode[] = [];
  let url: string | null = `${SPOTIFY_API_BASE}/shows/${showId}/episodes?market=US&limit=50`;

  while (url) {
    const response: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Spotify episodes request failed: ${response.status} ${text}`);
    }
    const data = (await response.json()) as EpisodesResponse;
    episodes.push(...data.items.filter(Boolean));
    url = data.next;
  }

  return episodes;
}
