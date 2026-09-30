import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import DeleteAccountPage from "@/app/(legal)/delete-account/page";
import PrivacyPage from "@/app/(legal)/privacy/page";
import SupportPage from "@/app/(legal)/support/page";
import TermsPage from "@/app/(legal)/terms/page";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

describe("public legal pages", () => {
  it.each([
    ["privacy", PrivacyPage, "Privacy policy"],
    ["terms", TermsPage, "Terms of service"],
    ["support", SupportPage, "Support"],
    ["delete-account", DeleteAccountPage, "Delete your HMI account"],
  ])("renders the %s page with contact details and cross-links", (_, Page, heading) => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeTruthy();
    expect(screen.getAllByText("aleksandersandnes78@gmail.com").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Delete your account" }).getAttribute("href")).toBe(
      "/delete-account",
    );
  });

  it("names the controller, processors and the Datatilsynet complaint right", () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/The data controller is Aleksander Sandnes/)).toBeTruthy();
    expect(screen.getByText(/Supabase — database/)).toBeTruthy();
    expect(screen.getByText(/Datatilsynet/)).toBeTruthy();
  });
});
