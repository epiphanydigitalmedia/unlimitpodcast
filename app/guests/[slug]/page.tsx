import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import {
  GUESTS,
  getGuestBySlug,
  getEpisodesByGuest,
  getTopicBySlug,
} from "@/lib/content";
import { formatAirDate, formatDuration } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return GUESTS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guest = getGuestBySlug(slug);
  if (!guest) return { title: "Guest not found" };
  return {
    title: guest.name,
    description: `${guest.title}. ${guest.bio.slice(0, 160)}`,
  };
}

export default async function GuestPage({ params }: Props) {
  const { slug } = await params;
  const guest = getGuestBySlug(slug);
  if (!guest) notFound();
  const episodes = getEpisodesByGuest(slug);

  return (
    <>
      <section className="pt-20 md:pt-28 pb-16">
        <Container width="tight">
          <Link href="/guests" className="eyebrow text-[color:var(--color-stone)] hover:text-[color:var(--color-ink)] transition-colors inline-block mb-6">
            ← All Guests
          </Link>
          <p className="eyebrow mb-4">Guest</p>
          <h1 className="display-hero mb-6">{guest.name}</h1>
          <p className="text-xl md:text-2xl font-[family-name:var(--font-display)] italic text-[color:var(--color-stone)] mb-10">
            {guest.title}
          </p>

          <div className="prose-editorial">
            <p>{guest.bio}</p>
          </div>

          {guest.links?.website && (
            <div className="mt-8">
              <a
                href={guest.links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                {guest.links.website.replace(/^https?:\/\/(www\.)?/, "")}
                <span aria-hidden="true">→</span>
              </a>
            </div>
          )}
        </Container>
      </section>

      <section className="py-20 border-t border-[color:var(--color-ink)]">
        <Container>
          <h2 className="display-headline mb-12">
            <span className="italic">Episodes</span> with {guest.name}
          </h2>
          <ul className="border-t border-[color:var(--color-divider)]">
            {episodes.map((episode) => (
              <li
                key={episode.slug}
                className="border-b border-[color:var(--color-divider)] py-10"
              >
                <Link href={`/episodes/${episode.slug}`} className="block group">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-baseline">
                    <div className="md:col-span-2">
                      <p className="text-sm font-mono tabular-nums text-[color:var(--color-stone-light)]">
                        No. {String(episode.number).padStart(2, "0")}
                      </p>
                    </div>
                    <div className="md:col-span-7">
                      <h3 className="text-2xl md:text-3xl font-[family-name:var(--font-display)] font-bold tracking-[-0.015em] leading-tight group-hover:text-[color:var(--color-accent)] transition-colors">
                        {episode.title}
                      </h3>
                      <p className="mt-3 text-[15px] text-[color:var(--color-ink)]/75 leading-relaxed max-w-2xl">
                        {episode.summary}
                      </p>
                    </div>
                    <div className="md:col-span-3 md:text-right">
                      <p className="text-sm text-[color:var(--color-stone)] tabular-nums">
                        {formatAirDate(episode.airDate)}
                      </p>
                      <p className="text-sm text-[color:var(--color-stone)] tabular-nums mt-1">
                        {formatDuration(episode.durationSeconds)}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
