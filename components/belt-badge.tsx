import { BELT_COLORS, isBelt } from "@/lib/constants";

/** Colored pill for a belt rank, with optional stripe pips. Unknown ranks render neutral. */
export function BeltBadge({
  belt,
  stripes = 0,
  label,
}: {
  belt: string;
  stripes?: number;
  label?: string;
}) {
  const colors = isBelt(belt)
    ? BELT_COLORS[belt]
    : { bg: "transparent", fg: "inherit", border: "currentColor" };

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize"
      style={{ backgroundColor: colors.bg, color: colors.fg, borderColor: colors.border }}
    >
      {label ?? belt}
      {stripes > 0 && (
        <span
          className="flex gap-0.5"
          role="img"
          aria-label={`${stripes} ${stripes === 1 ? "stripe" : "stripes"}`}
        >
          {Array.from({ length: Math.min(stripes, 10) }).map((_, i) => (
            <span
              key={i}
              className="h-3 w-0.5 rounded-sm"
              style={{ backgroundColor: colors.fg, opacity: 0.85 }}
            />
          ))}
        </span>
      )}
    </span>
  );
}
