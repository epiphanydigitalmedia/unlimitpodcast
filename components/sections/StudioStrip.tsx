import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { STUDIO_PHOTOS } from "@/lib/content";

/**
 * "From the studio" — behind-the-scenes band that adds human presence to an
 * otherwise text-forward site. Renders nothing until STUDIO_PHOTOS has entries,
 * so it can ship ahead of the actual photos. Layout adapts to the count:
 * a single photo goes wide; multiple tile into a responsive grid.
 */
export function StudioStrip() {
  const photos = STUDIO_PHOTOS;
  if (photos.length === 0) return null;

  const single = photos.length === 1;

  return (
    <section className="py-14 md:py-20">
      <Container>
        <p className="eyebrow mb-8">From the studio</p>
        <div
          className={
            single
              ? "relative aspect-video overflow-hidden bg-[color:var(--color-tag-bg)]"
              : "grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"
          }
        >
          {photos.map((photo) => (
            <div
              key={photo.src}
              className={
                single
                  ? "absolute inset-0"
                  : "relative aspect-video overflow-hidden bg-[color:var(--color-tag-bg)]"
              }
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
