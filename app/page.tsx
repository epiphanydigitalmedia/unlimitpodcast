import { Hero } from "@/components/sections/Hero";
import { LatestEpisode } from "@/components/sections/LatestEpisode";
import { ListenCTA } from "@/components/sections/ListenCTA";
import { RecentEpisodes } from "@/components/sections/RecentEpisodes";
import { StudioStrip } from "@/components/sections/StudioStrip";
import { HostIntro } from "@/components/sections/HostIntro";
import { NewsletterCTA } from "@/components/sections/NewsletterCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <LatestEpisode />
      <ListenCTA />
      <RecentEpisodes />
      <StudioStrip />
      <HostIntro />
      <NewsletterCTA />
    </>
  );
}
