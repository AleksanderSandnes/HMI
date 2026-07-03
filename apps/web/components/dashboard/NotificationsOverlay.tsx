"use client";

import { timeAgo, type NotificationItem, type NotificationLevel } from "@hmi/core";
import {
  AlertCircle,
  AlertTriangle,
  BellOff,
  Info,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { GRADIENTS } from "@/components/ui/DualStat";
import { useI18n } from "@/lib/i18n";

const LEVEL: Record<NotificationLevel, { gradient: string; icon: LucideIcon }> = {
  success: { gradient: GRADIENTS.energy, icon: TrendingUp },
  info: { gradient: GRADIENTS.accent, icon: Info },
  warning: { gradient: GRADIENTS.revenue, icon: AlertTriangle },
  error: { gradient: "linear-gradient(135deg,#fda4af,#fb7185,#f43f5e)", icon: AlertCircle },
};

function Row({ item, onDismiss }: { item: NotificationItem; onDismiss: () => void }) {
  const { locale, t } = useI18n();
  const { gradient, icon: Icon } = LEVEL[item.level] ?? LEVEL.info;
  return (
    <div>
      <div className="flex items-center gap-3 px-3.5 py-3">
        <span
          className="flex h-[2.375rem] w-[2.375rem] shrink-0 items-center justify-center rounded-[11px]"
          style={{ backgroundImage: gradient }}
        >
          <Icon size={18} className="size-[1.125rem] text-text-inverse" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.84375rem] font-bold text-text-primary">{item.title}</p>
          {item.message ? (
            <p className="mt-0.5 line-clamp-2 text-[0.71875rem] text-text-secondary">
              {item.message}
            </p>
          ) : null}
          <p className="mt-0.5 text-[0.65625rem] text-text-muted">
            {timeAgo(item.createdAt, locale)}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("a11y.dismiss")}
          className="flex h-[1.875rem] w-[1.875rem] shrink-0 items-center justify-center rounded-[9px] bg-glass-fill text-text-muted transition hover:text-text-primary"
        >
          <X size={15} className="size-[0.9375rem]" />
        </button>
      </div>
      <div className="ml-16 h-px bg-glass-border" />
    </div>
  );
}

/** Bell-triggered notifications panel (mirror of mobile NotificationsOverlay). */
export function NotificationsOverlay({
  open,
  onClose,
  items,
  onClear,
  onDismiss,
}: {
  open: boolean;
  onClose: () => void;
  items: NotificationItem[];
  onClear: () => void;
  onDismiss: (id: string) => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] bg-[rgba(2,6,20,0.55)] px-3.5 pt-2"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-label={t("notifications.title")}
        onClick={(e) => e.stopPropagation()}
        className="mx-auto max-h-[35rem] w-full max-w-[26rem] overflow-hidden rounded-[20px] border border-glass-border-strong bg-[var(--color-panel-bg)] shadow-[0_20px_30px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between border-b border-glass-border px-4 py-3">
          <p className="text-[0.96875rem] font-extrabold text-text-primary">
            {t("notifications.title")}
          </p>
          {items.length > 0 ? (
            <button
              type="button"
              onClick={onClear}
              className="text-[0.75rem] font-extrabold text-solar-light"
            >
              {t("notifications.clearAll")}
            </button>
          ) : null}
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 px-5 py-12">
            <BellOff size={26} className="size-[1.625rem] text-text-muted" />
            <p className="text-[0.8125rem] font-semibold text-text-secondary">
              {t("notifications.allCaughtUp")}
            </p>
          </div>
        ) : (
          <div className="max-h-[30rem] overflow-y-auto">
            {items.map((item) => (
              <Row key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
