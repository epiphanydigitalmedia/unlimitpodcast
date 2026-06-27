import { Hero } from "@/components/sections/Hero";
import { LatestEpisode } from "@/components/sections/LatestEpisode";
import { RecentEpisodes } from "@/components/sections/RecentEpisodes";
import { HostIntro } from "@/components/sections/HostIntro";
import { NewsletterCTA } from "@/components/sections/NewsletterCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <LatestEpisode />
      <RecentEpisodes />
      <HostIntro />
      <NewsletterCTA />
    </>
  );
}
