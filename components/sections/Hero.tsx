import { Container } from "@/components/ui/Container";
import { SHOW, HOST } from "@/lib/content";

export function Hero() {
  return (
    <section className="pt-16 md:pt-24 pb-16 md:pb-20">
      <Container>
        {/* Editorial masthead — small eyebrow above headline */}
        <div className="flex items-center gap-3 mb-10">
          <p className="eyebrow">A Podcast</p>
          <span className="hairline w-12" aria-hidden="true" />
          <p className="eyebrow">Hosted by {HOST.name}</p>
        </div>

        {/* Headline — the entire show identity in display serif */}
        <h1 className="display-hero max-w-5xl">
          <span className="italic">Unlimit</span> Your Potential.
        </h1>

        {/* Lede — magazine-style introduction */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <p className="lede">
              {SHOW.description}
            </p>
          </div>

          {/* Pull-quote-style host signature on the right */}
          <div className="lg:col-span-4 lg:col-start-9 lg:pt-2">
            <p className="text-sm text-[color:var(--color-stone-light)] uppercase tracking-[0.14em] mb-3">
              Conversations with
            </p>
            <p className="font-[family-name:var(--font-display)] text-xl leading-snug text-[color:var(--color-ink)]">
              Olympians.<br />
              World Champions.<br />
              <span className="italic">Executives.</span><br />
              Creative leaders.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
