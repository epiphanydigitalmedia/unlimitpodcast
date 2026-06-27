import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { TOPICS, getEpisodesByTopic } from "@/lib/content";

export const metadata: Metadata = {
  title: "Topics",
  description:
    "Browse Unlimit Your Potential episodes by topic — mental performance, leadership, mindset, athletic performance, and more.",
};

export default function TopicsPage() {
  const topicsWithCounts = TOPICS.map((topic) => ({
    ...topic,
    count: getEpisodesByTopic(topic.slug).length,
  }));

  return (
    <>
      <section className="pt-20 md:pt-28 pb-16">
        <Container>
          <p className="eyebrow mb-6">Browse the Library</p>
          <h1 className="display-hero">
            By <span className="italic">topic.</span>
          </h1>
          <p className="lede mt-8 max-w-2xl">
            The conversations on this show return to a set of themes. Browse them here.
          </p>
        </Container>
      </section>

      <section className="pb-32">
        <Container>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 border-t border-[color:var(--color-ink)] pt-10">
            {topicsWithCounts.map((topic) => (
              <li key={topic.slug} className="border-b border-[color:var(--color-divider)] pb-8">
                <Link href={`/topics/${topic.slug}`} className="block group">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="text-2xl md:text-3xl font-[family-name:var(--font-display)] font-bold tracking-[-0.015em] group-hover:text-[color:var(--color-accent)] transition-colors">
                      {topic.name}
                    </h2>
                    <span className="text-sm font-mono tabular-nums text-[color:var(--color-stone-light)] whitespace-nowrap">
                      {String(topic.count).padStart(2, "0")} {topic.count === 1 ? "ep" : "eps"}
                    </span>
                  </div>
                  {topic.description && (
                    <p className="mt-3 text-[15px] text-[color:var(--color-ink)]/75 leading-relaxed">
                      {topic.description}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
