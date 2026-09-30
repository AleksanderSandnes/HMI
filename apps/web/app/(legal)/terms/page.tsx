import type { Metadata } from "next";

import { CONTROLLER, LegalPage, Mail, Section } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Terms of service — HMI" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      intro={
        <p>
          These terms apply to the HMI website and mobile apps provided by {CONTROLLER} (“we”). By
          creating an account you accept them.
        </p>
      }
    >
      <Section title="The service">
        <p>
          HMI displays solar production and weather data retrieved from third-party services with
          credentials you provide. Data comes from Growatt and Weather.com and may be delayed,
          incomplete or unavailable. HMI is for information only and must not be relied on for
          safety-critical, billing or electrical decisions.
        </p>
      </Section>

      <Section title="Your account">
        <p>
          Keep your password secret and provide only credentials for accounts you are entitled to
          use. You are responsible for activity under your account. You may delete your account at
          any time from Settings or the <a href="/delete-account">deletion page</a>.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>
          Do not attempt to access other users’ data, probe or disrupt the service, circumvent
          security or rate limits, or use HMI in breach of the Growatt or Weather.com terms. We may
          suspend accounts that do.
        </p>
      </Section>

      <Section title="Availability and changes">
        <p>
          The service is provided free of charge, “as is”, without warranties. We may change,
          suspend or discontinue features, and will update these terms with notice in the app for
          material changes.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          To the extent permitted by law we are not liable for indirect losses or for losses caused
          by third-party data sources. Nothing in these terms limits rights you have as a consumer
          under Norwegian law.
        </p>
      </Section>

      <Section title="Law and contact">
        <p>
          These terms are governed by Norwegian law. Questions: <Mail subject="HMI terms" />.
        </p>
      </Section>
    </LegalPage>
  );
}
