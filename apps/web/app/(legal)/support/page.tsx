import type { Metadata } from "next";

import { LegalPage, Mail, Section } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Support — HMI" };

export default function SupportPage() {
  return (
    <LegalPage
      title="Support"
      intro={
        <p>
          Need help with HMI? Email <Mail subject="HMI support" /> — we usually reply within a few
          working days.
        </p>
      }
    >
      <Section title="Common questions">
        <p>
          <strong>No solar data?</strong> Check Settings → Growatt solar: the account email and
          password must match your Growatt login. Growatt sometimes rate-limits logins; wait a few
          minutes and refresh.
        </p>
        <p>
          <strong>No weather data?</strong> Check Settings → Weather.com station: you need your
          personal weather station ID and a Weather.com API key.
        </p>
        <p>
          <strong>Not getting notifications?</strong> Enable push notifications in Settings and
          allow notifications for HMI in your phone’s system settings.
        </p>
      </Section>

      <Section title="Include in your email">
        <p>
          The device (web, Android, iOS), app version, and what you expected versus what happened.
          Never send your passwords or API keys.
        </p>
      </Section>

      <Section title="Security issues">
        <p>
          Report vulnerabilities privately to <Mail subject="HMI security" />.
        </p>
      </Section>
    </LegalPage>
  );
}
