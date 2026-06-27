import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import {
  TOPICS,
  getTopicBySlug,
  getEpisodesByTopic,
  getGuestBySlug,
} from "@/lib/content";
import { formatAirDate, formatDuration } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return TOPICS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) return { title: "Topic not found" };
  return {
    title: topic.name,
    description: topic.description ?? `Episodes on ${topic.name}.`,
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();
  const episodes = getEpisodesByTopic(slug);

  return (
    <>
      <section className="pt-20 md:pt-28 pb-12">
        <Container>
          <Link href="/topics" className="eyebrow text-[color:var(--color-stone)] hover:text-[color:var(--color-ink)] transition-colors inline-block mb-6">
            ← All Topics
          </Link>
          <p className="eyebrow mb-4">Topic</p>
          <h1 className="display-hero">{topic.name}</h1>
          {topic.description && (
            <p className="lede mt-8 max-w-2xl">{topic.description}</p>
          )}
          <p className="mt-6 text-sm text-[color:var(--color-stone)] tabular-nums">
            {episodes.length} {episodes.length === 1 ? "episode" : "episodes"}
          </p>
        </Container>
      </section>

      <section className="pb-32">
        <Container>
          <ul className="border-t border-[color:var(--color-ink)]">
            {episodes.map((episode) => {
              const guest = getGuestBySlug(episode.guests[0]);
              return (
                <li
                  key={episode.slug}
                  className="border-b border-[color:var(--color-divider)] py-10"
                >
                  <Link href={`/episodes/${episode.slug}`} className="block group grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8">
                    <div className="md:col-span-2">
                      <p className="text-sm font-mono tabular-nums text-[color:var(--color-stone-light)]">
                        No. {String(episode.number).padStart(2, "0")}
                      </p>
                      <p className="text-sm text-[color:var(--color-stone)] tabular-nums mt-1">
                        {formatAirDate(episode.airDate)}
                      </p>
                    </div>
                    <div className="md:col-span-7">
                      {guest && <p className="eyebrow mb-2">{guest.name}</p>}
                      <h2 className="text-2xl md:text-3xl font-[family-name:var(--font-display)] font-bold tracking-[-0.015em] leading-tight group-hover:text-[color:var(--color-accent)] transition-colors">
                        {episode.title}
                      </h2>
                      <p className="mt-3 text-[15px] text-[color:var(--color-ink)]/75 leading-relaxed max-w-2xl">
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
    </>
  );
}
