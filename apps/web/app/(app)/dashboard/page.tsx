import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { WeatherChip } from "@/components/WeatherChip";

/**
 * Overview dashboard — the authenticated landing page combining solar + weather
 * at a glance. Full live widgets are built in a later step; this is the shell so
 * the `/dashboard` route (post-login landing) resolves after Solar moved to
 * `/solar`.
 */
export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
      <PageHeader
        title="Dashboard"
        subtitle="Your home at a glance"
        right={<WeatherChip />}
      />
      <GlassCard strong elevated className="p-6">
        <p className="text-sm font-semibold text-text-muted">
          Live solar &amp; weather overview coming up.
        </p>
      </GlassCard>
    </div>
  );
}
