import Link from "next/link";
import { Container } from "./ui/Container";
import { LISTEN_PLATFORMS, SUBSTACK_URL, SHOW, HOST } from "@/lib/content";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-[color:var(--color-divider)]">
      <Container>
        <div className="py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <p className="font-[family-name:var(--font-display)] text-3xl italic mb-4">
              Unlimit Your Potential
            </p>
            <p className="text-[color:var(--color-stone)] max-w-sm text-[15px] leading-relaxed">
              {SHOW.tagline}
            </p>
            <p className="mt-5 text-sm text-[color:var(--color-stone-light)]">
              Hosted by{" "}
              <a
                href={HOST.personalSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[color:var(--color-stone)] hover:text-[color:var(--color-ink)] underline underline-offset-2 transition-colors"
              >
                {HOST.name}
              </a>
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="eyebrow mb-4">Explore</p>
            <ul className="space-y-2.5 text-[15px]">
              <li><Link href="/episodes" className="hover:text-[color:var(--color-accent)] transition-colors">All Episodes</Link></li>
              <li><Link href="/topics" className="hover:text-[color:var(--color-accent)] transition-colors">Topics</Link></li>
              <li><Link href="/guests" className="hover:text-[color:var(--color-accent)] transition-colors">Guests</Link></li>
              <li><Link href="/about" className="hover:text-[color:var(--color-accent)] transition-colors">About</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="eyebrow mb-4">Listen</p>
            <ul className="space-y-2.5 text-[15px]">
              {LISTEN_PLATFORMS.slice(0, 4).map((platform) => (
                <li key={platform.name}>
                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[color:var(--color-accent)] transition-colors"
                  >
                    {platform.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="eyebrow mb-4">Connect</p>
            <ul className="space-y-2.5 text-[15px]">
              <li>
                <a
                  href={SUBSTACK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[color:var(--color-accent)] transition-colors"
                >
                  Newsletter
                </a>
              </li>
              <li><Link href="/sponsor" className="hover:text-[color:var(--color-accent)] transition-colors">Sponsor</Link></li>
              <li><Link href="/press" className="hover:text-[color:var(--color-accent)] transition-colors">Press</Link></li>
              <li><Link href="/contact" className="hover:text-[color:var(--color-accent)] transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[color:var(--color-divider)] py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-sm text-[color:var(--color-stone-light)] tabular-nums">
            © {new Date().getFullYear()} {SHOW.name}. A Cupid Soldiers Studios production.
          </p>
          <p className="text-sm text-[color:var(--color-stone-light)]">
            Produced by Epiphany Digital Media
          </p>
        </div>
      </Container>
    </footer>
  );
}
