import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getAllEpisodes, getGuestBySlug, getTopicBySlug } from "@/lib/content";
import { formatAirDate, formatDuration } from "@/lib/types";

export const metadata: Metadata = {
  title: "Episodes",
  description:
    "Every episode of Unlimit Your Potential — conversations with Olympians, World Champions, executives, and creative leaders on mental performance, mindset, and the work behind elite execution.",
};

export default function EpisodesPage() {
  const episodes = getAllEpisodes();

  return (
    <>
      <section className="pt-20 md:pt-28 pb-12">
        <Container>
          <p className="eyebrow mb-6">The Archive</p>
          <h1 className="display-hero">
            All <span className="italic">Episodes</span>
          </h1>
          <p className="lede mt-8 max-w-2xl">
            {episodes.length} {episodes.length === 1 ? "conversation" : "conversations"} on
            mental performance, mindset, and the work behind elite execution.
          </p>
        </Container>
      </section>

      <section className="pb-32">
        <Container>
          <ul className="border-t border-[color:var(--color-ink)]">
            {episodes.map((episode) => {
              const primaryGuest = getGuestBySlug(episode.guests[0]);
              const topics = episode.topics.map(getTopicBySlug).filter(Boolean);

              return (
                <li
                  key={episode.slug}
                  className="border-b border-[color:var(--color-divider)] py-10 md:py-14"
                >
                  <article className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8">
                    <div className="md:col-span-2">
                      <p className="text-sm font-mono tabular-nums text-[color:var(--color-stone-light)]">
                        No. {String(episode.number).padStart(2, "0")}
                      </p>
                      <p className="text-sm text-[color:var(--color-stone)] tabular-nums mt-1">
                        {formatAirDate(episode.airDate)}
                      </p>
                      <p className="text-sm text-[color:var(--color-stone)] tabular-nums mt-1">
                        {formatDuration(episode.durationSeconds)}
                      </p>
                    </div>

                    <div className="md:col-span-7">
                      {primaryGuest && (
                        <p className="eyebrow mb-2">
                          {primaryGuest.name}
                        </p>
                      )}
                      <Link
                        href={`/episodes/${episode.slug}`}
                        className="block group"
                      >
                        <h2 className="text-2xl md:text-3xl font-[family-name:var(--font-display)] font-bold tracking-[-0.015em] leading-tight group-hover:text-[color:var(--color-accent)] transition-colors">
                          {episode.title}
                        </h2>
                      </Link>
                      <p className="mt-4 text-[15px] text-[color:var(--color-ink)]/75 leading-relaxed max-w-2xl">
                        {episode.summary}
                      </p>
                      {topics.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {topics.slice(0, 4).map((topic) =>
                            topic ? (
                              <Link
                                key={topic.slug}
                                href={`/topics/${topic.slug}`}
                                className="tag-meta"
                              >
                                {topic.name}
                              </Link>
                            ) : null
                          )}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-3 md:text-right md:pt-1">
                      <Link
                        href={`/episodes/${episode.slug}`}
                        className="btn-ghost"
                      >
                        Read & listen
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>
    </>
  );
}
