import type { Metadata } from "next";

import { CONTROLLER, LegalPage, Mail, Section } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Privacy policy — HMI" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro={
        <p>
          HMI (Home Management Interface) shows your own solar production and local weather on the
          web and in the Android/iOS app. This policy explains what personal data HMI processes,
          why, and the rights you have under the GDPR.
        </p>
      }
    >
      <Section title="Controller">
        <p>
          The data controller is {CONTROLLER}, Norway. Contact: <Mail subject="HMI privacy" />.
        </p>
      </Section>

      <DataWeProcess />

      <Section title="Purposes and legal basis">
        <p>
          We process this data to provide the service you signed up for — authenticating you,
          fetching and displaying your solar and weather data, and sending the alerts you enable
          (GDPR Art. 6(1)(b), performance of a contract). Security logging is based on our
          legitimate interest in keeping the service safe (Art. 6(1)(f)).
        </p>
      </Section>

      <Section title="Processors and recipients">
        <ul className="list-disc pl-6">
          <li>Supabase — database, authentication, file storage and functions (EU region).</li>
          <li>Vercel — hosting of the web application.</li>
          <li>Render — hosting of the Growatt integration service.</li>
          <li>Expo, Google (Firebase Cloud Messaging) and Apple — push notification delivery.</li>
          <li>
            Growatt and Weather.com (The Weather Company) — contacted on your behalf with the
            credentials you provide, to retrieve your own data.
          </li>
        </ul>
        <p>
          Some providers may process data outside the EEA; where they do, transfers rely on the EU
          Standard Contractual Clauses or an adequacy decision. We never sell personal data.
        </p>
      </Section>

      <Section title="Retention">
        <p>
          Your data is kept while your account exists. When you delete your account, your profile,
          settings, encrypted credentials, notifications, avatar and health records are deleted
          immediately. Backups held by our database provider expire within their retention window.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can access, correct, export or delete your data, restrict or object to processing, and
          withdraw consent where consent applies. Delete your account at any time in Settings →
          Delete account or via <a href="/delete-account">the deletion page</a>. For other requests,
          email <Mail subject="HMI privacy request" />; we answer within 30 days.
        </p>
        <p>
          You may also complain to the Norwegian Data Protection Authority (Datatilsynet,
          datatilsynet.no).
        </p>
      </Section>

      <Section title="Children">
        <p>HMI is not directed at children under 13 and does not knowingly collect their data.</p>
      </Section>

      <Section title="Changes">
        <p>
          We will update this page and the date above when this policy changes, and notify you in
          the app about material changes.
        </p>
      </Section>
    </LegalPage>
  );
}

function DataWeProcess() {
  return (
    <Section title="Data we process">
      <ul className="list-disc pl-6">
        <li>Account data: email address, username, password hash (held by Supabase Auth).</li>
        <li>Profile picture, if you upload one.</li>
        <li>
          Integration settings: Growatt account email and plant, Weather.com station ID. Your
          Growatt password and Weather.com API key are stored encrypted in Supabase Vault and are
          never returned to any app.
        </li>
        <li>
          Solar production and weather observations fetched with your credentials, cached to make
          charts fast.
        </li>
        <li>In-app notifications and, on mobile, a push notification token for your device.</li>
        <li>Integration health records (success/failure of data fetches), kept for 30 days.</li>
        <li>Technical data needed to run the service, such as IP addresses in server logs.</li>
      </ul>
      <p>
        HMI does not use advertising, tracking or third-party analytics. It only uses cookies that
        are strictly necessary: the sign-in session and your chosen language.
      </p>
    </Section>
  );
}
