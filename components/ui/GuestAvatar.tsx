import Image from "next/image";

/**
 * Guest avatar with graceful fallback. When a guest has an `imageUrl`
 * (a Seth-with-guest or headshot photo), it's shown; otherwise we render an
 * editorial initials monogram so the layout never looks broken or empty while
 * photos are still being gathered.
 */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function GuestAvatar({
  name,
  imageUrl,
  className = "",
  monogramClass = "text-2xl",
  rounded = false,
}: {
  name: string;
  imageUrl?: string;
  className?: string;
  /** Tailwind text-size for the fallback monogram, tuned per placement. */
  monogramClass?: string;
  rounded?: boolean;
}) {
  const shape = rounded ? "rounded-full" : "";
  return (
    <div
      className={`relative overflow-hidden bg-[color:var(--color-tag-bg)] ${shape} ${className}`}
      aria-hidden={imageUrl ? undefined : true}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt={name} fill className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-[family-name:var(--font-display)] text-[color:var(--color-stone)] leading-none select-none ${monogramClass}`}
          >
            {initials(name)}
          </span>
        </div>
      )}
    </div>
  );
}
