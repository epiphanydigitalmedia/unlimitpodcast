type SpotifyEmbedProps = {
  episodeId?: string;
  /** Compact (152px) or full (352px) player height */
  variant?: "compact" | "full";
  /** Native audio URL — used as a fallback when episodeId is missing
   *  (e.g. the Spotify scraper hasn't resolved this episode's ID yet). */
  audioUrl?: string;
  /** Optional title for accessibility on the fallback <audio>. */
  title?: string;
};

export function SpotifyEmbed({
  episodeId,
  variant = "compact",
  audioUrl,
  title,
}: SpotifyEmbedProps) {
  if (!episodeId) {
    if (audioUrl) {
      return (
        <div className="w-full rounded-xl bg-[color:var(--color-surface)] border border-[color:var(--color-divider)] p-4">
          <audio
            controls
            preload="metadata"
            src={audioUrl}
            aria-label={title ?? "Episode audio"}
            className="w-full"
          />
        </div>
      );
    }
    return (
      <div className="w-full bg-[color:var(--color-tag-bg)] rounded-xl p-6 text-center text-[color:var(--color-stone)] text-sm">
        Audio for this episode isn&rsquo;t available yet.
      </div>
    );
  }

  const height = variant === "full" ? 352 : 152;

  return (
    <iframe
      src={`https://open.spotify.com/embed/episode/${episodeId}?utm_source=generator`}
      width="100%"
      height={height}
      frameBorder="0"
      allowFullScreen
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      className="rounded-xl"
      title="Episode player"
    />
  );
}
