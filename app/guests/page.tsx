import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { GUESTS, getEpisodesByGuest } from "@/lib/content";

export const metadata: Metadata = {
  title: "Guests",
  description:
    "Every guest who has appeared on Unlimit Your Potential — Olympians, World Champions, executives, and creative leaders.",
};

export default function GuestsPage() {
  const guestsWithCounts = GUESTS.map((guest) => ({
    ...guest,
    count: getEpisodesByGuest(guest.slug).length,
  }));

  return (
    <>
      <section className="pt-20 md:pt-28 pb-16">
        <Container>
          <p className="eyebrow mb-6">The People</p>
          <h1 className="display-hero">
            The <span className="italic">guests.</span>
          </h1>
          <p className="lede mt-8 max-w-2xl">
            Olympians, World Champions, business leaders, coaches, and creators — the
            people who have done the work the show is about.
          </p>
        </Container>
      </section>

      <section className="pb-32">
        <Container>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 border-t border-[color:var(--color-ink)] pt-12">
            {guestsWithCounts.map((guest) => (
              <li key={guest.slug} className="border-b border-[color:var(--color-divider)] pb-10">
                <Link href={`/guests/${guest.slug}`} className="block group">
                  <div className="flex items-baseline justify-between gap-4 mb-3">
                    <h2 className="text-3xl font-[family-name:var(--font-display)] font-bold tracking-[-0.015em] group-hover:text-[color:var(--color-accent)] transition-colors">
                      {guest.name}
                    </h2>
                    <span className="text-sm font-mono tabular-nums text-[color:var(--color-stone-light)] whitespace-nowrap">
                      {String(guest.count).padStart(2, "0")} {guest.count === 1 ? "ep" : "eps"}
                    </span>
                  </div>
                  <p className="text-sm text-[color:var(--color-stone)] mb-3">
                    {guest.title}
                  </p>
                  <p className="text-[15px] text-[color:var(--color-ink)]/75 leading-relaxed line-clamp-3">
                    {guest.bio}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
