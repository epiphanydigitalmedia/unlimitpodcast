import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SpotifyEmbed } from "@/components/ui/SpotifyEmbed";
import { getAllEpisodes, getGuestBySlug, getTopicBySlug } from "@/lib/content";
import { formatAirDate, formatDuration } from "@/lib/types";

export function LatestEpisode() {
  const episodes = getAllEpisodes();
  const latest = episodes[0];
  if (!latest) return null;

  const guests = latest.guests.map(getGuestBySlug).filter(Boolean);
  const topics = latest.topics.map(getTopicBySlug).filter(Boolean);

  return (
    <section className="py-20 md:py-28 border-y border-[color:var(--color-divider)]">
      <Container>
        <div className="flex items-center gap-4 mb-10">
          <span className="tag-latest">
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-canvas)]" />
            Latest
          </span>
          <span className="text-sm text-[color:var(--color-stone)] tabular-nums">
            Episode {String(latest.number).padStart(2, "0")}
          </span>
          <span className="hairline flex-1" aria-hidden="true" />
          <span className="text-sm text-[color:var(--color-stone)] tabular-nums">
            {formatAirDate(latest.airDate)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
          <div className="lg:col-span-8">
            <Link
              href={`/episodes/${latest.slug}`}
              className="block group"
            >
              <h2 className="display-headline group-hover:text-[color:var(--color-accent)] transition-colors">
                {latest.title}
              </h2>
            </Link>

            <p className="mt-6 text-lg md:text-xl leading-relaxed text-[color:var(--color-ink)]/85 max-w-3xl">
              {latest.summary}
            </p>

            {/* Topic + duration metadata */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-sm text-[color:var(--color-stone)] tabular-nums mr-3">
                {formatDuration(latest.durationSeconds)}
              </span>
              {topics.slice(0, 3).map((topic) =>
                topic ? (
                  <Link key={topic.slug} href={`/topics/${topic.slug}`} className="tag-meta">
                    {topic.name}
                  </Link>
                ) : null
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            {/* Guest credit block — editorial byline treatment */}
            <p className="eyebrow mb-3">With</p>
            {guests.map((guest) =>
              guest ? (
                <div key={guest.slug} className="mb-5 last:mb-0">
                  <Link
                    href={`/guests/${guest.slug}`}
                    className="font-[family-name:var(--font-display)] text-2xl font-bold hover:text-[color:var(--color-accent)] transition-colors block leading-tight"
                  >
                    {guest.name}
                  </Link>
                  <p className="mt-1 text-sm text-[color:var(--color-stone)] leading-snug">
                    {guest.title}
                  </p>
                </div>
              ) : null
            )}
          </div>
        </div>

        {/* Player */}
        <SpotifyEmbed
          episodeId={latest.spotifyEpisodeId}
          variant="compact"
          audioUrl={latest.audioUrl}
          title={latest.title}
        />

        {/* Read more link */}
        <div className="mt-10">
          <Link
            href={`/episodes/${latest.slug}`}
            className="btn-ghost"
          >
            Show notes, transcript, and resources
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
