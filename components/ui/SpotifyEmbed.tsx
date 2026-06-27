type SpotifyEmbedProps = {
  episodeId?: string;
  /** Compact (152px) or full (352px) player height */
  variant?: "compact" | "full";
};

export function SpotifyEmbed({ episodeId, variant = "compact" }: SpotifyEmbedProps) {
  if (!episodeId) {
    return (
      <div className="w-full bg-[color:var(--color-tag-bg)] rounded-xl p-6 text-center text-[color:var(--color-stone)] text-sm">
        Spotify embed will appear here once the episode ID is added to the content store.
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
