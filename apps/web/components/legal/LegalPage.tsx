import Link from "next/link";
import type { ReactNode } from "react";

export const CONTROLLER = "Aleksander Sandnes";
export const CONTACT_EMAIL = "aleksandersandnes78@gmail.com";
export const LAST_UPDATED = "30 September 2026";

/** Static, public, unauthenticated page shell for legal and support content. */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 text-text-primary sm:px-6">
      <Link href="/" className="text-sm font-bold text-text-secondary hover:text-text-primary">
        ← HMI
      </Link>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-text-muted">Last updated {LAST_UPDATED}</p>
      {intro ? <div className="mt-6 text-base leading-7 text-text-secondary">{intro}</div> : null}
      <div className="mt-8 flex flex-col gap-8">{children}</div>
      <nav className="mt-12 flex flex-wrap gap-4 border-t border-glass-border pt-6 text-sm font-bold text-text-secondary">
        <Link href="/privacy">Privacy policy</Link>
        <Link href="/terms">Terms of service</Link>
        <Link href="/support">Support</Link>
        <Link href="/delete-account">Delete your account</Link>
      </nav>
    </main>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-extrabold">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-base leading-7 text-text-secondary">
        {children}
      </div>
    </section>
  );
}

export function Mail({ subject }: { subject?: string }) {
  const href = subject
    ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`
    : `mailto:${CONTACT_EMAIL}`;
  return (
    <a href={href} className="font-bold text-text-primary underline">
      {CONTACT_EMAIL}
    </a>
  );
}
