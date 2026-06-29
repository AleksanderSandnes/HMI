"use client";

import { useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  icon?: LucideIcon;
  /** Renders a password field with a show/hide toggle. */
  secure?: boolean;
  hint?: string;
  error?: string;
}

/**
 * Labeled text input (web port of mobile ui/Field.tsx).
 * Glass fill, hairline border, focus glow, optional leading icon + password toggle.
 */
export function Field({
  label,
  icon: Icon,
  secure = false,
  hint,
  error,
  className,
  onFocus,
  onBlur,
  ...inputProps
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);

  return (
    <div className="mb-4">
      <label className="mb-2 block text-[12.5px] font-bold tracking-[0.3px] text-text-secondary">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center rounded-[var(--radius-md)] border px-3.5 transition",
          focused
            ? "border-solar bg-glass-fill"
            : "border-glass-border bg-glass-fill-subtle"
        )}
      >
        {Icon ? (
          <Icon
            size={14}
            className={cn(
              "mr-2.5 shrink-0",
              focused ? "text-solar-light" : "text-text-muted"
            )}
          />
        ) : null}
        <input
          {...inputProps}
          type={secure && !reveal ? "password" : "text"}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className={cn(
            "w-full bg-transparent py-3 text-[15px] font-semibold text-text-primary outline-none placeholder:text-text-muted",
            className
          )}
        />
        {secure ? (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="py-1.5 pl-2.5 text-text-secondary"
            aria-label={reveal ? "Hide password" : "Show password"}
          >
            {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="ml-0.5 mt-1.5 text-xs font-semibold text-negative">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[11.5px] font-medium text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export default Field;
