import { DEFAULT_LOCALE, getTranslator, isLocale } from "@hmi/core";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LOCALE_COOKIE } from "@/lib/locale-cookie";
import { createClient } from "@/lib/supabase/server";

const BACKGROUND_VIDEO_URI = "https://cdn.pixabay.com/video/2023/11/13/188912-884171167_large.mp4";

/** Landing page. Authenticated users go straight to the dashboard. */
export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const raw = (await cookies()).get(LOCALE_COOKIE)?.value;
  const t = getTranslator(isLocale(raw) ? raw : DEFAULT_LOCALE);

  return (
    <main className="relative flex min-h-dvh w-full flex-1 items-center justify-center overflow-hidden">
      {/* Looping background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={BACKGROUND_VIDEO_URI}
        autoPlay
        loop
        muted
        playsInline
      />
      {/* Darkening overlay (parity with RN 0.3/0.6/0.3 gradient) */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.3),rgba(0,0,0,0.6),rgba(0,0,0,0.3))]" />

      <div className="animate-fade-in-up relative z-10 flex flex-col items-center px-6 text-center">
        <h1 className="text-[2.625rem] font-extrabold leading-tight tracking-tight text-white drop-shadow-lg md:text-[4.25rem]">
          {t("landing.title")}
        </h1>
        <p className="mt-2 text-lg font-medium text-white/80 md:text-2xl">
          {t("landing.createdBy")}
        </p>
        <p className="text-lg font-semibold text-white md:text-2xl">Aleksander Sandnes</p>
        <p className="mt-4 max-w-xl text-base text-white/75 md:text-lg">{t("landing.tagline")}</p>

        <div className="mt-8 flex items-center gap-6 text-white/85">
          <Feature icon="⚡" label={t("landing.realTime")} />
          <Feature icon="📊" label={t("landing.analytics")} />
          <Feature icon="🌱" label={t("landing.sustainable")} />
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-7">
          <Link
            href="/login"
            className="min-w-[12.5rem] rounded-[var(--radius-md)] bg-[linear-gradient(135deg,#fde047,#fbbf24,#f59e0b)] px-10 py-4 text-center text-base font-extrabold text-text-inverse transition hover:brightness-105 sm:min-w-[11.25rem]"
          >
            {t("landing.login")}
          </Link>
          <Link
            href="/register"
            className="min-w-[12.5rem] rounded-[var(--radius-md)] border border-white/40 bg-white/5 px-10 py-4 text-center text-base font-extrabold text-white backdrop-blur transition hover:bg-white/15 sm:min-w-[11.25rem]"
          >
            {t("landing.register")}
          </Link>
        </div>
      </div>
    </main>
  );
}

function Feature({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}
