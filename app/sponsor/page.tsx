import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Sponsor",
  description:
    "Sponsorship inquiries for Unlimit Your Potential — reach an audience of high-performers, executives, and athletes.",
};

export default function SponsorPage() {
  return (
    <section className="pt-20 md:pt-28 pb-32">
      <Container width="tight">
        <p className="eyebrow mb-6">Partnership</p>
        <h1 className="display-hero mb-10">
          <span className="italic">Sponsor</span> the show.
        </h1>

        <div className="prose-editorial">
          <p>
            Unlimit Your Potential reaches an audience of professional athletes, business
            executives, sales leaders, and creative leaders — people who make decisions
            and influence others.
          </p>
          <p>
            We work with a limited number of partners per quarter. Slots are reserved for
            brands and services that genuinely serve our audience: training tools,
            recovery products, software, education, and offerings that respect listener
            attention.
          </p>

          <h2>What's available</h2>
          <p>
            Pre-roll, mid-roll, and post-roll host-read placements. Newsletter
            sponsorship. Custom integrations on selected episodes. Detailed
            specifications and pricing on request.
          </p>

          <h2>Inquire</h2>
          <p>
            Email <a href="mailto:partners@unlimitpodcast.com">partners@unlimitpodcast.com</a>{" "}
            with your brand, the campaign you're considering, and timing. We respond
            within two business days.
          </p>
        </div>
      </Container>
    </section>
  );
}
