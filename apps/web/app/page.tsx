import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing page. Redirects authenticated users straight to the dashboard.
 * (Video background + full hero treatment land in Phase 4.)
 */
export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="glass-strong w-full max-w-xl rounded-[var(--radius-xl)] p-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-solar-light">
          HMI
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-text-primary">
          Your energy, at a glance
        </h1>
        <p className="mt-4 text-text-secondary">
          Monitor solar production and weather in one sleek dashboard.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-[var(--radius-pill)] bg-solar px-6 py-3 font-bold text-text-inverse transition hover:bg-solar-light"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-[var(--radius-pill)] border border-glass-border-strong px-6 py-3 font-bold text-text-primary transition hover:bg-glass-fill"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
