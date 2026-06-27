import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { NewsletterCTA } from "@/components/sections/NewsletterCTA";
import { SHOW, HOST } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description: `About ${SHOW.name} — the podcast hosted by ${HOST.name}.`,
};

export default function AboutPage() {
  return (
    <>
      <section className="pt-20 md:pt-28 pb-16 md:pb-24">
        <Container width="tight">
          <p className="eyebrow mb-6">About the Show</p>
          <h1 className="display-hero mb-10">
            <span className="italic">Unlimit</span> Your Potential.
          </h1>
          <p className="lede mb-10">{SHOW.description}</p>

          <div className="prose-editorial mt-12">
            <p>
              The podcast was conceived as a long-form conversation series: the kind of
              show where the conversation has the space to reach the parts of performance
              that don't fit in a clip. Each episode runs an hour or longer, and the
              guests are people who have actually done the work — not pundits about it.
            </p>
            <p>
              The questions Seth returns to across guests: How do you think when the
              pressure is on? What do you tell yourself? What does the work actually look
              like, day to day? What did you get wrong on the way up? And — what would
              you tell the version of yourself who hadn't done it yet?
            </p>
          </div>
        </Container>
      </section>

      <section className="py-20 md:py-28 bg-[color:var(--color-surface)] border-y border-[color:var(--color-divider)]">
        <Container width="tight">
          <p className="eyebrow mb-6">The Host</p>
          <h2 className="display-headline mb-10">
            <span className="italic">{HOST.name}.</span>
          </h2>

          <div className="prose-editorial">
            <p>{HOST.shortBio}</p>
            <p>{HOST.longBio}</p>
            <p>
              Seth's framework — Mind, Words, Action — is the connective tissue across
              the conversations on this show. The guests apply it in different domains,
              under different pressures, with different stakes. The framework itself is
              consistent.
            </p>
            <p>
              For more on Seth's coaching practice, visit{" "}
              <a
                href={HOST.personalSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                sethpepper.com
              </a>
              .
            </p>
          </div>
        </Container>
      </section>

      <NewsletterCTA />
    </>
  );
}
