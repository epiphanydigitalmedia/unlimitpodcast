import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getAllEpisodes, getGuestBySlug } from "@/lib/content";
import { formatAirDate, formatDuration } from "@/lib/types";

export function RecentEpisodes() {
  const episodes = getAllEpisodes().slice(1, 4); // skip the latest, show the next 3
  if (episodes.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <Container>
        <div className="flex items-end justify-between mb-12">
          <h2 className="display-headline">
            <span className="italic">Earlier</span> episodes
          </h2>
          <Link href="/episodes" className="btn-ghost">
            All episodes
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <ul className="border-t border-[color:var(--color-ink)]">
          {episodes.map((episode) => {
            const primaryGuest = getGuestBySlug(episode.guests[0]);
            return (
              <li
                key={episode.slug}
                className="border-b border-[color:var(--color-divider)] py-8 md:py-10"
              >
                <Link
                  href={`/episodes/${episode.slug}`}
                  className="block group grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8"
                >
                  <div className="md:col-span-2">
                    <p className="text-sm font-mono tabular-nums text-[color:var(--color-stone-light)]">
                      No. {String(episode.number).padStart(2, "0")}
                    </p>
                    <p className="text-sm text-[color:var(--color-stone)] tabular-nums mt-1">
                      {formatAirDate(episode.airDate)}
                    </p>
                  </div>

                  <div className="md:col-span-7">
                    {primaryGuest && (
                      <p className="eyebrow mb-2">
                        {primaryGuest.name}
                      </p>
                    )}
                    <h3 className="text-2xl md:text-[1.875rem] font-[family-name:var(--font-display)] font-bold tracking-[-0.015em] leading-tight group-hover:text-[color:var(--color-accent)] transition-colors">
                      {episode.title}
                    </h3>
                    <p className="mt-3 text-[15px] text-[color:var(--color-ink)]/75 leading-relaxed line-clamp-2 max-w-2xl">
                      {episode.summary}
                    </p>
                  </div>

                  <div className="md:col-span-3 md:text-right md:pt-1">
                    <p className="text-sm text-[color:var(--color-stone)] tabular-nums">
                      {formatDuration(episode.durationSeconds)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
