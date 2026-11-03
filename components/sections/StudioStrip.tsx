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
              ? "relative aspect-[16/9] overflow-hidden bg-[color:var(--color-tag-bg)]"
              : "grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
          }
        >
          {photos.map((photo, i) => (
            <div
              key={photo.src}
              className={
                single
                  ? "absolute inset-0"
                  : `relative aspect-[4/5] overflow-hidden bg-[color:var(--color-tag-bg)] ${
                      i === 0 ? "col-span-2 lg:col-span-1 aspect-[4/5]" : ""
                    }`
              }
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
