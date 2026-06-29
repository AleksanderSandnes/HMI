"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CloudSun,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCore } from "@/lib/hooks/useCore";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/weather", label: "Weather", icon: CloudSun },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

/**
 * Responsive app navigation: a left sidebar rail on desktop, a bottom tab bar on
 * mobile (parity with the RN PremiumTabBar + desktop rail).
 */
export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { auth } = useCore();

  async function handleLogout() {
    await auth.logout();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar rail */}
      <aside className="glass hidden w-60 shrink-0 flex-col gap-1 p-4 md:flex">
        <div className="mb-6 px-3 py-2">
          <span className="text-lg font-extrabold tracking-tight text-solar-light">
            HMI
          </span>
        </div>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-semibold transition",
                active
                  ? "bg-solar-soft text-solar-light"
                  : "text-text-secondary hover:bg-glass-fill hover:text-text-primary"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-semibold text-text-muted transition hover:bg-glass-fill hover:text-negative"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="glass fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-glass-border px-2 py-2 md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[var(--radius-md)] px-3 py-1.5 text-[11px] font-semibold transition",
                active ? "text-solar-light" : "text-text-muted"
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
