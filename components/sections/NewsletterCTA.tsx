import { Container } from "@/components/ui/Container";
import { SUBSTACK_URL } from "@/lib/content";

export function NewsletterCTA() {
  return (
    <section className="py-24 md:py-32">
      <Container width="tight">
        <div className="text-center">
          <p className="eyebrow mb-6">The Newsletter</p>
          <h2 className="display-hero mb-8">
            Notes from <span className="italic">the work.</span>
          </h2>
          <p className="lede max-w-xl mx-auto mb-12">
            The most important ideas from each episode, distilled and sent when there's
            something worth saying. Not on a schedule. Not for the sake of sending.
          </p>
          <a
            href={SUBSTACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Subscribe on Substack
            <span aria-hidden="true">→</span>
          </a>
          <p className="mt-6 text-sm text-[color:var(--color-stone-light)]">
            Free. Unsubscribe anytime.
          </p>
        </div>
      </Container>
    </section>
  );
}
