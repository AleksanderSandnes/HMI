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
      <div className="flex h-dvh w-full flex-col">
        <AppNav />
        <main className="min-h-0 flex-1 overflow-y-auto px-5 pb-24 pt-6 md:px-8 md:pb-8 md:pt-7">
          {children}
        </main>
      </div>
    </NavStatsProvider>
  );
}
