import type { Metadata } from "next";

import { LegalPage, Mail, Section } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Delete your account — HMI" };

export default function DeleteAccountPage() {
  return (
    <LegalPage
      title="Delete your HMI account"
      intro={<p>You can permanently delete your HMI account and its data at any time.</p>}
    >
      <Section title="In the app or on the web">
        <ol className="list-decimal pl-6">
          <li>Sign in to HMI.</li>
          <li>Open Settings → Delete account.</li>
          <li>Choose “Delete account”, then confirm with “Delete permanently”.</li>
        </ol>
      </Section>

      <Section title="Without access to the app">
        <p>
          Email <Mail subject="HMI account deletion request" /> from the address registered on your
          account and ask for deletion. We verify the request and complete it within 30 days.
        </p>
      </Section>

      <Section title="What is deleted">
        <p>
          Your sign-in account, profile and avatar, integration settings, the encrypted Growatt
          password and Weather.com API key, notifications, push tokens and integration health
          records. Deletion is immediate and cannot be undone. Shared weather and solar caches that
          are not linked to your account are not personal data and may remain; database backups
          expire within the provider’s retention window.
        </p>
      </Section>
    </LegalPage>
  );
}
