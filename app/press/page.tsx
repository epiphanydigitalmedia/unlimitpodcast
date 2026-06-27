import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SHOW, HOST } from "@/lib/content";

export const metadata: Metadata = {
  title: "Press",
  description: `Press kit and media inquiries for ${SHOW.name}.`,
};

export default function PressPage() {
  return (
    <section className="pt-20 md:pt-28 pb-32">
      <Container width="tight">
        <p className="eyebrow mb-6">Press</p>
        <h1 className="display-hero mb-10">
          Press <span className="italic">kit.</span>
        </h1>

        <div className="prose-editorial">
          <h2>About the show</h2>
          <p>{SHOW.description}</p>

          <h2>About the host</h2>
          <p>{HOST.longBio}</p>

          <h2>Assets</h2>
          <p>
            High-resolution host headshots, podcast cover art, logos, and the show
            one-sheet are available on request. Email{" "}
            <a href="mailto:press@unlimitpodcast.com">press@unlimitpodcast.com</a> with
            your outlet and request.
          </p>

          <h2>Booking & interviews</h2>
          <p>
            Seth is available for select interviews on mental performance, athletic
            transitions, and high-stakes leadership. Booking inquiries to{" "}
            <a href="mailto:press@unlimitpodcast.com">press@unlimitpodcast.com</a>.
          </p>
        </div>
      </Container>
    </section>
  );
}
