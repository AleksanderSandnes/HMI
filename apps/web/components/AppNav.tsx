"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CloudSun,
  LayoutDashboard,
  LogOut,
  Settings,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCore } from "@/lib/hooks/useCore";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/solar", label: "Solar", icon: Sun },
  { href: "/weather", label: "Weather", icon: CloudSun },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

/**
 * Responsive app navigation: a horizontal top bar (brand + links + sign out) on
 * desktop/web, and the bottom tab bar on mobile (parity with the RN tab bar).
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
      {/* Desktop / web top bar. Inner content is constrained to the same
          max-width + padding as the page content so the brand aligns with the
          page title (left) and Sign out aligns with the content's right edge. */}
      <header className="glass sticky top-0 z-30 hidden border-b border-glass-border px-5 md:block md:px-8">
        <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between py-2.5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5"
          aria-label="HMI home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.png"
            alt=""
            className="h-8 w-8 rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
          />
          <span className="text-lg font-extrabold tracking-tight text-text-primary">
            HMI
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-[var(--radius-md)] px-3.5 py-2 text-sm font-semibold transition",
                  active
                    ? "bg-solar-soft text-solar-light"
                    : "text-text-secondary hover:bg-glass-fill hover:text-text-primary"
                )}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="ml-1 flex items-center gap-2 rounded-[var(--radius-md)] px-3.5 py-2 text-sm font-semibold text-text-muted transition hover:bg-glass-fill hover:text-negative"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </nav>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="glass fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-glass-border px-2 py-2 md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[var(--radius-md)] px-2 py-1.5 text-[10px] font-semibold transition",
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
