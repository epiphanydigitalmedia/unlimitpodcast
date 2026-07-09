import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Container } from "@/components/ui/Container";
import { SpotifyEmbed } from "@/components/ui/SpotifyEmbed";
import {
  EPISODES,
  getEpisodeBySlug,
  getGuestBySlug,
  getTopicBySlug,
} from "@/lib/content";
import { formatAirDate, formatDuration, formatTimestamp } from "@/lib/types";

type Props = {
  params: Promise<{ slug: string }>;
};

// Generate static params for all episodes at build time
export async function generateStaticParams() {
  return EPISODES.map((episode) => ({ slug: episode.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const episode = getEpisodeBySlug(slug);
  if (!episode) return { title: "Episode not found" };

  return {
    title: episode.title,
    description: episode.summary,
    openGraph: {
      title: episode.title,
      description: episode.summary,
      type: "article",
      publishedTime: episode.airDate,
    },
  };
}

export default async function EpisodePage({ params }: Props) {
  const { slug } = await params;
  const episode = getEpisodeBySlug(slug);
  if (!episode) notFound();

  const guests = episode.guests.map(getGuestBySlug).filter(Boolean);
  const topics = episode.topics.map(getTopicBySlug).filter(Boolean);

  return (
    <article>
      {/* Article masthead */}
      <header className="pt-16 md:pt-24 pb-12">
        <Container width="tight">
          {/* Editorial metadata strip */}
          <div className="flex flex-wrap items-center gap-3 mb-10 text-sm text-[color:var(--color-stone)]">
            <span className="tabular-nums">
              Episode {String(episode.number).padStart(2, "0")}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{formatAirDate(episode.airDate)}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{formatDuration(episode.durationSeconds)}</span>
          </div>

          {/* Guest credit — editorial byline */}
          {guests.length > 0 && (
            <p className="eyebrow mb-6">
              With{" "}
              {guests.map((g, i) =>
                g ? (
                  <span key={g.slug}>
                    {i > 0 && " & "}
                    <Link
                      href={`/guests/${g.slug}`}
                      className="text-[color:var(--color-ink)] hover:text-[color:var(--color-accent)] transition-colors normal-case tracking-normal font-bold"
                    >
                      {g.name}
                    </Link>
                  </span>
                ) : null
              )}
            </p>
          )}

          {/* Episode title — full editorial display */}
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl lg:text-5xl font-bold tracking-[-0.02em] leading-[1.1]">
            {episode.title}
          </h1>

          {/* Summary as lede */}
          <p className="lede mt-8 max-w-2xl">{episode.summary}</p>

          {/* Topics */}
          {topics.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {topics.map((t) =>
                t ? (
                  <Link key={t.slug} href={`/topics/${t.slug}`} className="tag-meta">
                    {t.name}
                  </Link>
                ) : null
              )}
            </div>
          )}
        </Container>
      </header>

      {/* Player */}
      <section className="pb-16">
        <Container width="tight">
          <SpotifyEmbed
            episodeId={episode.spotifyEpisodeId}
            variant="full"
            audioUrl={episode.audioUrl}
            title={episode.title}
          />
        </Container>
      </section>

      {/* Chapters / timestamps */}
      {episode.chapters.length > 0 && (
        <section className="py-12 bg-[color:var(--color-surface)] border-y border-[color:var(--color-divider)]">
          <Container width="tight">
            <p className="eyebrow mb-6">Chapters</p>
            <ol className="space-y-3">
              {episode.chapters.map((chapter, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[5rem_1fr] gap-4 items-baseline"
                >
                  <span className="text-sm font-mono tabular-nums text-[color:var(--color-stone)]">
                    {formatTimestamp(chapter.timestamp)}
                  </span>
                  <span className="text-base">{chapter.label}</span>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      )}

      {/* Show notes — the editorial body */}
      <section className="py-16">
        <Container width="tight">
          <p className="eyebrow mb-6">Show Notes</p>
          <div className="prose-editorial">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {episode.showNotes}
            </ReactMarkdown>
          </div>
        </Container>
      </section>

      {/* Resources mentioned */}
      {episode.resources.length > 0 && (
        <section className="py-12 border-t border-[color:var(--color-divider)]">
          <Container width="tight">
            <p className="eyebrow mb-6">Resources & Links Mentioned</p>
            <ul className="space-y-3">
              {episode.resources.map((resource, i) => (
                <li key={i} className="flex items-baseline gap-3">
                  {resource.type && (
                    <span className="text-xs uppercase tracking-[0.12em] text-[color:var(--color-stone-light)] min-w-[3.5rem]">
                      {resource.type}
                    </span>
                  )}
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-[color:var(--color-ink)] underline underline-offset-2 hover:text-[color:var(--color-accent)] transition-colors"
                  >
                    {resource.title}
                  </a>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Transcript */}
      {episode.transcript && (
        <section className="py-16 border-t border-[color:var(--color-divider)]">
          <Container width="tight">
            <details className="group">
              <summary className="cursor-pointer flex items-center gap-3 list-none">
                <p className="eyebrow">Full Transcript</p>
                <span className="text-sm text-[color:var(--color-stone)] group-open:rotate-90 transition-transform">
                  →
                </span>
              </summary>
              <div className="prose-editorial mt-8 whitespace-pre-wrap">
                {episode.transcript}
              </div>
            </details>
          </Container>
        </section>
      )}

      {/* Related episodes */}
      {episode.relatedEpisodes && episode.relatedEpisodes.length > 0 && (
        <section className="py-20 mt-12 border-t border-[color:var(--color-ink)]">
          <Container>
            <h2 className="display-headline mb-12">
              <span className="italic">Related</span> episodes
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {episode.relatedEpisodes.map((relatedSlug) => {
                const related = getEpisodeBySlug(relatedSlug);
                if (!related) return null;
                const guest = getGuestBySlug(related.guests[0]);
                return (
                  <li key={related.slug}>
                    <Link
                      href={`/episodes/${related.slug}`}
                      className="block group"
                    >
                      <p className="eyebrow mb-2">
                        Episode {String(related.number).padStart(2, "0")}
                        {guest && ` · ${guest.name}`}
                      </p>
                      <h3 className="text-2xl font-[family-name:var(--font-display)] font-bold tracking-[-0.015em] leading-tight group-hover:text-[color:var(--color-accent)] transition-colors">
                        {related.title}
                      </h3>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Container>
        </section>
      )}
    </article>
  );
}
