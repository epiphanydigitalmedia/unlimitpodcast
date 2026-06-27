import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { NewsletterCTA } from "@/components/sections/NewsletterCTA";
import { LISTEN_PLATFORMS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Listen",
  description:
    "Subscribe to Unlimit Your Potential on Spotify, Apple Podcasts, YouTube, Amazon Music, or via RSS.",
};

export default function ListenPage() {
  return (
    <>
      <section className="pt-20 md:pt-28 pb-16">
        <Container width="tight">
          <p className="eyebrow mb-6">Subscribe</p>
          <h1 className="display-hero">
            Where to <span className="italic">listen.</span>
          </h1>
          <p className="lede mt-8">
            The show publishes wherever you get podcasts. Pick your platform.
          </p>
        </Container>
      </section>

      <section className="pb-24">
        <Container width="tight">
          <ul className="border-t border-[color:var(--color-ink)]">
            {LISTEN_PLATFORMS.map((platform) => (
              <li
                key={platform.name}
                className="border-b border-[color:var(--color-divider)]"
              >
                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-8 group"
                >
                  <span className="text-2xl md:text-3xl font-[family-name:var(--font-display)] font-bold tracking-[-0.015em] group-hover:text-[color:var(--color-accent)] transition-colors">
                    {platform.name}
                  </span>
                  <span className="text-sm text-[color:var(--color-stone)] group-hover:text-[color:var(--color-accent)] transition-colors">
                    Open in {platform.handle} →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <NewsletterCTA />
    </>
  );
}
