// 3-step register wizard (account → Growatt → Weather) lands in Phase 4.
export default function RegisterPage() {
  return (
    <div className="glass-strong w-full max-w-md rounded-[var(--radius-xl)] p-9">
      <h1 className="text-2xl font-extrabold text-text-primary">
        Create account
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Join your energy monitoring dashboard.
      </p>
      <p className="mt-6 text-sm text-text-secondary">
        Register wizard — Phase 4.
      </p>
    </div>
  );
}
