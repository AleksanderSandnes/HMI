import { cn } from "@/lib/utils";

interface AvatarProps {
  /** Fallback initials shown when no image is set. */
  initials: string;
  /** Public URL of the profile picture, or null/undefined for initials. */
  url?: string | null;
  /** Diameter in pixels. */
  size: number;
  className?: string;
}

/**
 * Circular avatar: shows the profile image if `url` is set, else the initials.
 * (Web port of mobile ui/Avatar.tsx.)
 */
export function Avatar({ initials, url, size, className }: AvatarProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-full border border-glass-border-strong bg-glass-fill-strong",
        className,
      )}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span
          style={{ fontSize: Math.round(size * 0.34) }}
          className="font-extrabold text-text-secondary"
        >
          {initials}
        </span>
      )}
    </div>
  );
}

export default Avatar;
