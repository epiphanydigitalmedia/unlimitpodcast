/**
 * The "unlimit" dictionary entry — the show's thesis as a verb.
 *
 * `compact` is the Hero treatment (single sense, one line of definition).
 * The full treatment (About page) adds a second sense plus a usage note that
 * reframes the word from "misspelling of unlimited" to a verb in its own right.
 */
export function Definition({ compact = false }: { compact?: boolean }) {
  return (
    <div className="border-l border-[color:var(--color-divider)] pl-5 md:pl-6">
      {/* Headword line: syllabified word · pronunciation · part of speech */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={`font-[family-name:var(--font-display)] text-[color:var(--color-ink)] ${
            compact ? "text-xl" : "text-2xl md:text-3xl"
          }`}
        >
          un·lim·it
        </span>
        <span className="text-sm text-[color:var(--color-stone-light)] tracking-wide">
          \ ˌən-ˈli-mət \
        </span>
        <span className="text-sm italic text-[color:var(--color-stone)]">
          verb
        </span>
      </div>

      {compact ? (
        <p className="mt-3 text-[color:var(--color-stone)] leading-snug max-w-xl">
          to remove the limits from; to free from restriction.
        </p>
      ) : (
        <>
          <ol className="mt-4 space-y-2 text-[color:var(--color-stone)] leading-snug max-w-2xl">
            <li className="flex gap-3">
              <span className="text-[color:var(--color-stone-light)] tabular-nums">1.</span>
              <span>to remove the limits from; to free from restriction.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[color:var(--color-stone-light)] tabular-nums">2.</span>
              <span>
                to expand the perceived boundaries of (a person, a belief, a
                possibility); to release from a self-imposed ceiling.
              </span>
            </li>
          </ol>
          <p className="mt-5 text-sm text-[color:var(--color-stone-light)] leading-relaxed max-w-2xl">
            <span className="italic">Usage.</span> Not a misspelling of{" "}
            <span className="italic">unlimited.</span> Where{" "}
            <span className="italic">unlimited</span> describes a thing that has
            no limits, <span className="italic">to unlimit</span> is the act of
            removing them — something you do, not a state you're in.
          </p>
        </>
      )}
    </div>
  );
}
