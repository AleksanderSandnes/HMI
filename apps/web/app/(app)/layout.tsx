import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";

/**
 * Authenticated app shell. The proxy guard already redirects unauthenticated
 * users; this is a defence-in-depth check (Server Functions can bypass proxy).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh w-full">
      <AppNav />
      <main className="flex-1 px-5 pb-24 pt-6 md:px-8 md:pb-8">{children}</main>
    </div>
  );
}
