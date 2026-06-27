import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SUBSTACK_URL } from "@/lib/content";

export const metadata: Metadata = {
  title: "Newsletter",
  description:
    "Subscribe to the Unlimit Your Potential newsletter — the most important ideas from each podcast episode, distilled.",
};

const SUBSTACK_HANDLE = process.env.NEXT_PUBLIC_SUBSTACK_HANDLE || "unlimitpodcast";

export default function NewsletterPage() {
  return (
    <section className="pt-20 md:pt-28 pb-32">
      <Container width="tight">
        <p className="eyebrow mb-6">The Newsletter</p>
        <h1 className="display-hero mb-10">
          Notes from <span className="italic">the work.</span>
        </h1>

        <div className="prose-editorial mb-12">
          <p>
            A newsletter that lands when there's something worth saying — not on a
            schedule, not for the sake of sending.
          </p>
          <p>
            What to expect: the most important ideas from each podcast episode,
            distilled. Notes on what's emerging across conversations with elite athletes,
            executives, and creative leaders. Occasional resources. Never spam.
          </p>
        </div>

        {/*
          Substack embed iframe.
          Once you've configured the embed in Substack settings, replace the
          src URL with the actual one from Settings → Sharing → Embed sign-up form.
          The pattern is typically: https://<handle>.substack.com/embed
        */}
        <div className="border border-[color:var(--color-divider)] rounded-xl overflow-hidden bg-[color:var(--color-surface)]">
          <iframe
            src={`https://${SUBSTACK_HANDLE}.substack.com/embed`}
            width="100%"
            height="320"
            style={{ border: "none", background: "transparent" }}
            frameBorder={0}
            scrolling="no"
            title="Subscribe to the Unlimit Your Potential newsletter"
          />
        </div>

        <p className="mt-8 text-sm text-[color:var(--color-stone)]">
          Trouble with the form?{" "}
          <a
            href={SUBSTACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[color:var(--color-ink)] underline underline-offset-2 hover:text-[color:var(--color-accent)] transition-colors"
          >
            Subscribe directly on Substack
          </a>
          .
        </p>
      </Container>
    </section>
  );
}
