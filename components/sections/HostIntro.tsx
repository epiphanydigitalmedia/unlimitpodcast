import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { HOST } from "@/lib/content";

export function HostIntro() {
  return (
    <section className="py-20 md:py-28 bg-[color:var(--color-surface)] border-y border-[color:var(--color-divider)]">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="eyebrow mb-6">The Host</p>
            <h2 className="display-headline">
              <span className="italic">{HOST.name}.</span>
            </h2>
            <div className="relative aspect-[4/5] bg-[color:var(--color-tag-bg)] mt-8 max-w-sm overflow-hidden">
              <Image src="/seth-headshot.jpg" alt={HOST.name} fill className="object-cover" />
            </div>
          </div>

          <div className="lg:col-span-7 lg:pt-10">
            <p className="text-xl md:text-2xl leading-relaxed font-[family-name:var(--font-display)] mb-8">
              {HOST.shortBio}
            </p>
            <p className="text-base md:text-lg leading-relaxed text-[color:var(--color-ink)]/85 max-w-2xl mb-6">
              {HOST.longBio}
            </p>
            <a
              href={HOST.personalSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              More about Seth's coaching practice
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
