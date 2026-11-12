import { cn } from "@/lib/format";

const SIZES = {
  sm: { tile: "size-8 rounded-xl", glyph: "size-[18px]" },
  md: { tile: "size-9 rounded-xl", glyph: "size-5" },
  lg: { tile: "size-11 rounded-2xl", glyph: "size-[26px]" },
} as const;

/**
 * The CMS mark: a shield with a resolved check, on the brand gradient.
 * Drawn as inline SVG so it stays crisp at every size and needs no asset request.
 */
export function Logo({
  size = "md",
  className,
  title = "Complaint Management System",
}: {
  size?: keyof typeof SIZES;
  className?: string;
  title?: string;
}) {
  const { tile, glyph } = SIZES[size];

  return (
    <span className={cn("brand-mark relative grid shrink-0 place-items-center overflow-hidden", tile, className)}>
      <svg viewBox="0 0 24 24" className={glyph} role="img" aria-label={title} fill="none">
        <path
          d="M12 2.9 19.1 5.6v5.5c0 4.4-2.9 7.9-7.1 9.5-4.2-1.6-7.1-5.1-7.1-9.5V5.6L12 2.9Z"
          fill="rgba(255,255,255,0.22)"
          stroke="white"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="m8.5 11.9 2.4 2.4 4.7-4.8"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="pointer-events-none absolute -left-2 -top-3 size-7 rotate-12 rounded-full bg-white/25 blur-[6px]" aria-hidden="true" />
    </span>
  );
}
