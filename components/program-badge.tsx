import { COMBINED_STRIKING } from "@/lib/constants";

/** Small coloured pill for a class program: blue for grappling, red for striking. */
export function ProgramBadge({ program }: { program: string }) {
  const striking = program === COMBINED_STRIKING || program === "Muay Thai" || program === "Kickboxing";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        striking ? "bg-brand/15 text-brand-text" : "bg-accent/15 text-accent"
      }`}
    >
      {program}
    </span>
  );
}
