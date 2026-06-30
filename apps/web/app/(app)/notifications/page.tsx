"use client";

import type { NotificationItem, NotificationLevel } from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Bell, CheckCircle2, Info, Trash2, X, type LucideIcon } from "lucide-react";
import { useEffect } from "react";

import { GlassCard } from "@/components/ui/GlassCard";
import { useCore } from "@/lib/hooks/useCore";

const LEVEL: Record<NotificationLevel, { icon: LucideIcon; className: string }> = {
  success: { icon: CheckCircle2, className: "text-positive" },
  error: { icon: AlertCircle, className: "text-negative" },
  warning: { icon: AlertCircle, className: "text-solar-light" },
  info: { icon: Info, className: "text-accent-light" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage() {
  const { notifications } = useCore();

  const { data, refetch, isLoading } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: () => notifications.fetchNotifications(),
  });

  // Live updates: refetch on any insert/delete for this user.
  useEffect(() => {
    const unsub = notifications.subscribeNotifications(() => void refetch());
    return unsub;
  }, [notifications, refetch]);

  const items = data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-extrabold tracking-[-0.8px] text-text-primary">
            Notifications
          </h1>
          <p className="mt-1 text-[14.5px] font-medium text-text-muted">
            {items.length} {items.length === 1 ? "notification" : "notifications"}
          </p>
        </div>
        {items.length > 0 ? (
          <button
            onClick={async () => {
              await notifications.clearNotifications();
              void refetch();
            }}
            className="flex items-center gap-2 rounded-[var(--radius-md)] border border-glass-border bg-glass-fill px-3.5 py-2 text-sm font-bold text-text-muted transition hover:text-negative"
          >
            <Trash2 size={15} />
            Clear all
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <GlassCard className="p-8 text-center text-sm text-text-muted">Loading…</GlassCard>
      ) : items.length === 0 ? (
        <GlassCard className="flex flex-col items-center gap-3 p-12 text-center">
          <Bell size={32} className="text-text-muted" />
          <p className="text-sm font-semibold text-text-secondary">You&apos;re all caught up</p>
          <p className="text-sm text-text-muted">
            Solar &amp; weather sync alerts will appear here.
          </p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const { icon: Icon, className } = LEVEL[item.level] ?? LEVEL.info;
            return (
              <GlassCard key={item.id} className="flex items-start gap-3.5 p-4">
                <Icon size={18} className={`mt-0.5 shrink-0 ${className}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-bold text-text-primary">{item.title}</p>
                    <span className="shrink-0 text-xs font-medium text-text-muted">
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                  {item.message ? (
                    <p className="mt-1 text-sm text-text-secondary">{item.message}</p>
                  ) : null}
                </div>
                <button
                  onClick={async () => {
                    await notifications.dismissNotification(item.id);
                    void refetch();
                  }}
                  aria-label="Dismiss"
                  className="shrink-0 rounded-md p-1 text-text-muted transition hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
