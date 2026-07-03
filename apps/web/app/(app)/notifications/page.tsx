"use client";

import { timeAgo, type NotificationItem, type NotificationLevel } from "@hmi/core";
import { AlertCircle, Bell, CheckCircle2, Info, Trash2, X, type LucideIcon } from "lucide-react";

import { GlassCard } from "@/components/ui/GlassCard";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useI18n } from "@/lib/i18n";

const LEVEL: Record<NotificationLevel, { icon: LucideIcon; className: string }> = {
  success: { icon: CheckCircle2, className: "text-positive" },
  error: { icon: AlertCircle, className: "text-negative" },
  warning: { icon: AlertCircle, className: "text-solar-light" },
  info: { icon: Info, className: "text-accent-light" },
};

function EmptyState() {
  const { t } = useI18n();
  return (
    <GlassCard className="flex flex-col items-center gap-3 p-12 text-center">
      <Bell size={32} className="size-[2rem] text-text-muted" />
      <p className="text-sm font-semibold text-text-secondary">{t("notifications.allCaughtUp")}</p>
      <p className="text-sm text-text-muted">{t("notifications.emptyHint")}</p>
    </GlassCard>
  );
}

function NotificationRow({ item, onDismiss }: { item: NotificationItem; onDismiss: () => void }) {
  const { locale, t } = useI18n();
  const { icon: Icon, className } = LEVEL[item.level] ?? LEVEL.info;
  return (
    <GlassCard className="flex items-start gap-3.5 p-4">
      <Icon size={18} className={`mt-0.5 size-[1.125rem] shrink-0 ${className}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-bold text-text-primary">{item.title}</p>
          <span className="shrink-0 text-xs font-medium text-text-muted">
            {timeAgo(item.createdAt, locale)}
          </span>
        </div>
        {item.message ? <p className="mt-1 text-sm text-text-secondary">{item.message}</p> : null}
      </div>
      <button
        onClick={onDismiss}
        aria-label={t("a11y.dismiss")}
        className="shrink-0 rounded-md p-1 text-text-muted transition hover:text-text-primary"
      >
        <X size={16} className="size-[1rem]" />
      </button>
    </GlassCard>
  );
}

export default function NotificationsPage() {
  const { t, tp } = useI18n();
  const { items, isLoading, dismiss, clearAll } = useNotifications();

  return (
    <div className="mx-auto flex w-full max-w-[51.25rem] flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.875rem] font-extrabold tracking-[-0.8px] text-text-primary">
            {t("notifications.title")}
          </h1>
          <p className="mt-1 text-[0.90625rem] font-medium text-text-muted">
            {tp("notifications.count", items.length)}
          </p>
        </div>
        {items.length > 0 ? (
          <button
            onClick={() => void clearAll()}
            className="flex items-center gap-2 rounded-[var(--radius-md)] border border-glass-border bg-glass-fill px-3.5 py-2 text-sm font-bold text-text-muted transition hover:text-negative"
          >
            <Trash2 size={15} className="size-[0.9375rem]" />
            {t("notifications.clearAll")}
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <GlassCard className="p-8 text-center text-sm text-text-muted">
          {t("common.loading")}
        </GlassCard>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <NotificationRow key={item.id} item={item} onDismiss={() => void dismiss(item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
