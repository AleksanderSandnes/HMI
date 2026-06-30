import { cn } from "@/lib/utils";

/** Pulsing placeholder block for loading states. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--radius-sm)] bg-glass-fill-strong", className)}
    />
  );
}

export default Skeleton;
