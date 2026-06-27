import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Unlimit Your Potential team — for guest pitches, partnership inquiries, or press.",
};

export default function ContactPage() {
  return (
    <section className="pt-20 md:pt-28 pb-32">
      <Container width="tight">
        <p className="eyebrow mb-6">Get In Touch</p>
        <h1 className="display-hero mb-10">
          <span className="italic">Contact</span>.
        </h1>

        <div className="prose-editorial">
          <p>
            Different inquiries route to different inboxes. Use the one that matches
            your reason for reaching out.
          </p>
        </div>

        <ul className="mt-12 space-y-8 border-t border-[color:var(--color-divider)] pt-8">
          <li>
            <p className="eyebrow mb-2">Guest Pitches</p>
            <p className="text-2xl font-[family-name:var(--font-display)] mb-2">
              <a
                href="mailto:guests@unlimitpodcast.com"
                className="hover:text-[color:var(--color-accent)] transition-colors underline underline-offset-4"
              >
                guests@unlimitpodcast.com
              </a>
            </p>
            <p className="text-[15px] text-[color:var(--color-stone)] max-w-2xl">
              Pitching yourself or a client? Include a one-paragraph background, the
              angle you'd want to explore, and a link to your most substantive work.
              We read everything; we respond within two weeks to those that fit the
              show.
            </p>
          </li>

          <li>
            <p className="eyebrow mb-2">Partnerships & Sponsorship</p>
            <p className="text-2xl font-[family-name:var(--font-display)] mb-2">
              <a
                href="mailto:partners@unlimitpodcast.com"
                className="hover:text-[color:var(--color-accent)] transition-colors underline underline-offset-4"
              >
                partners@unlimitpodcast.com
              </a>
            </p>
          </li>

          <li>
            <p className="eyebrow mb-2">Press & Media</p>
            <p className="text-2xl font-[family-name:var(--font-display)] mb-2">
              <a
                href="mailto:press@unlimitpodcast.com"
                className="hover:text-[color:var(--color-accent)] transition-colors underline underline-offset-4"
              >
                press@unlimitpodcast.com
              </a>
            </p>
          </li>

          <li>
            <p className="eyebrow mb-2">Everything Else</p>
            <p className="text-2xl font-[family-name:var(--font-display)] mb-2">
              <a
                href="mailto:hello@unlimitpodcast.com"
                className="hover:text-[color:var(--color-accent)] transition-colors underline underline-offset-4"
              >
                hello@unlimitpodcast.com
              </a>
            </p>
          </li>
        </ul>
      </Container>
    </section>
  );
}
