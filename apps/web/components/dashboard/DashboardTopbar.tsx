"use client";

import { deriveInitials } from "@hmi/core";
import { Bell } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { useI18n } from "@/lib/i18n";

/**
 * Hero-dashboard chrome row (mirror of mobile DashboardTopbar): brand,
 * notifications bell with unread badge, avatar with inverter-online dot.
 */
export function DashboardTopbar({
  username,
  avatarUrl,
  notifCount,
  online,
  onBellClick,
}: {
  username?: string | null;
  avatarUrl?: string | null;
  notifCount: number;
  online?: boolean | null;
  onBellClick: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-[1.3125rem] font-black tracking-[-0.5px] text-text-primary">HMI</h1>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBellClick}
          aria-label={t("nav.notifications")}
          className="relative flex h-[2.375rem] w-[2.375rem] items-center justify-center rounded-[12px] border border-glass-border bg-glass-fill text-text-secondary transition hover:bg-glass-fill-strong"
        >
          <Bell size={18} className="size-[1.125rem]" />
          {notifCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-[1.0625rem] min-w-[1.0625rem] items-center justify-center rounded-full bg-solar px-1 text-[0.625rem] font-black text-text-inverse">
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          ) : null}
        </button>
        <span className="relative">
          <Avatar initials={deriveInitials(username)} url={avatarUrl} size={38} />
          {online ? (
            <span className="absolute -bottom-0.5 -right-0.5 h-[0.6875rem] w-[0.6875rem] rounded-full border-2 border-bg-base bg-positive" />
          ) : null}
        </span>
      </div>
    </div>
  );
}
