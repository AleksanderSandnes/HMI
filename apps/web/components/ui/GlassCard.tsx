import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stronger fill + border for primary surfaces. */
  strong?: boolean;
  /** Adds an elevated glow shadow. */
  elevated?: boolean;
}

/**
 * Frosted-glass surface — the building block of the dashboard.
 * Translucent fill + hairline border, backdrop blur, optional glow.
 * (Web port of mobile ui/GlassCard.tsx.)
 */
export function GlassCard({
  strong = false,
  elevated = false,
  className,
  children,
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={cn(
        strong ? "glass-strong" : "glass",
        "overflow-hidden rounded-[var(--radius-lg)]",
        elevated && "shadow-[0_18px_30px_rgba(2,6,20,0.55)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export default GlassCard;
