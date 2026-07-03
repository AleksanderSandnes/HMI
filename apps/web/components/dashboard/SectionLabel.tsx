import { type LucideIcon } from "lucide-react";

/** Uppercase section label with a hairline divider (dashboard sections). */
export function SectionLabel({
  icon: Icon,
  text,
  right,
}: {
  icon: LucideIcon;
  text: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={15} className="size-[0.9375rem] text-solar-light" />
      <span className="text-[0.71875rem] font-bold uppercase tracking-[0.6px] text-text-secondary">
        {text}
      </span>
      <div className="h-px flex-1 bg-glass-border" />
      {right}
    </div>
  );
}
