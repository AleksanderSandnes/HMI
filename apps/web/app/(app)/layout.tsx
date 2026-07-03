import { redirect } from "next/navigation";

import { AppNav } from "@/components/AppNav";
import { NavStatsProvider } from "@/lib/nav-stats";
import { createClient } from "@/lib/supabase/server";

/**
 * Authenticated app shell. The proxy guard already redirects unauthenticated
 * users; this is a defence-in-depth check (Server Functions can bypass proxy).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <NavStatsProvider>
      {/* Column on phones (bottom bar) and desktop (top bar); row on tablets,
          where AppNav renders the left rail. min-w-0 keeps charts from forcing
          horizontal overflow when main is a row flex child. */}
      <div className="flex h-dvh w-full flex-col md:flex-row lg:flex-col">
        <AppNav />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-5 pb-24 pt-6 md:px-6 md:py-6 lg:px-8 lg:pb-8 lg:pt-7">
          {children}
        </main>
      </div>
    </NavStatsProvider>
  );
}
