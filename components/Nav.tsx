import Link from "next/link";
import { Container } from "./ui/Container";
import { SUBSTACK_URL } from "@/lib/content";

const navLinks = [
  { href: "/episodes", label: "Episodes" },
  { href: "/topics", label: "Topics" },
  { href: "/guests", label: "Guests" },
  { href: "/about", label: "About" },
  { href: "/listen", label: "Listen" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[color:var(--color-canvas)]/85 border-b border-[color:var(--color-divider)]">
      <Container>
        <div className="flex items-center justify-between py-5">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-2xl italic font-normal tracking-tight text-[color:var(--color-ink)] hover:text-[color:var(--color-accent)] transition-colors"
            aria-label="Unlimit Your Potential — home"
          >
            Unlimit
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-normal text-[color:var(--color-stone)] hover:text-[color:var(--color-ink)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={SUBSTACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm"
            >
              Subscribe
            </a>
          </nav>

          {/* Mobile — single CTA */}
          <a
            href={SUBSTACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden btn-primary text-sm"
          >
            Subscribe
          </a>
        </div>
      </Container>
    </header>
  );
}
