import { Container } from "@/components/ui/Container";
import { LISTEN_PLATFORMS, SHOW } from "@/lib/content";

/**
 * Primary podcast CTA — "start listening" with every platform link.
 * The first platform (Spotify) gets the solid button; the rest are ghost
 * links so the band reads as one clear action with alternatives beside it.
 */
export function ListenCTA() {
  const [primary, ...rest] = LISTEN_PLATFORMS;

  return (
    <section className="py-14 md:py-20 bg-[color:var(--color-surface)] border-y border-[color:var(--color-divider)]">
      <Container width="tight">
        <div className="text-center">
          <p className="eyebrow mb-6">Listen</p>
          <h2 className="display-hero mb-8">
            Start <span className="italic">listening.</span>
          </h2>
          <p className="lede max-w-xl mx-auto mb-12">
            {SHOW.name} publishes a new long-form conversation regularly. Follow
            the show wherever you listen — new episodes land automatically.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {primary && (
              <a
                href={primary.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Listen on {primary.name}
                <span aria-hidden="true">→</span>
              </a>
            )}
            {rest.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                {platform.name}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
