"use client";

import { Loader2, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "danger";
type Gradient = "solar" | "energy" | "accent" | "revenue";

const GRADIENTS: Record<Gradient, string> = {
  solar: "linear-gradient(135deg, #fde047 0%, #fbbf24 50%, #f59e0b 100%)",
  energy: "linear-gradient(135deg, #5eead4 0%, #2dd4bf 50%, #10b981 100%)",
  accent: "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #6366f1 100%)",
  revenue: "linear-gradient(135deg, #fde68a 0%, #facc15 50%, #eab308 100%)",
};

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  label: string;
  icon?: LucideIcon;
  variant?: Variant;
  loading?: boolean;
  /** Gradient for the primary variant (default solar). */
  gradient?: Gradient;
  type?: "button" | "submit" | "reset";
}

/**
 * Action button (web port of mobile ui/Button.tsx).
 * - primary: solar (or chosen) gradient fill
 * - ghost: translucent glass
 * - danger: red-tinted glass
 */
export function Button({
  label,
  icon: Icon,
  variant = "primary",
  loading = false,
  gradient = "solar",
  disabled,
  type = "button",
  className,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === "primary";

  return (
    <button
      type={type}
      disabled={isDisabled}
      style={isPrimary ? { backgroundImage: GRADIENTS[gradient] } : undefined}
      className={cn(
        "flex min-h-12 w-full items-center justify-center gap-2.5 rounded-[var(--radius-md)] px-4 text-[15px] font-extrabold tracking-[0.2px] transition",
        isPrimary && "text-text-inverse hover:brightness-105",
        variant === "ghost" &&
          "border border-glass-border-strong bg-glass-fill text-text-primary hover:bg-glass-fill-strong",
        variant === "danger" &&
          "border border-[rgba(251,113,133,0.35)] bg-[rgba(251,113,133,0.10)] text-negative hover:bg-[rgba(251,113,133,0.18)]",
        isDisabled && "cursor-not-allowed opacity-50",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <>
          {Icon ? <Icon size={15} /> : null}
          <span className="truncate">{label}</span>
        </>
      )}
    </button>
  );
}

export default Button;
