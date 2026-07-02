import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LocaleProvider, useI18n } from "@/lib/i18n";

function Probe() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div>
      <p>{t("settings.title")}</p>
      <button onClick={() => setLocale(locale === "en" ? "nb" : "en")}>toggle</button>
    </div>
  );
}

describe("LocaleProvider", () => {
  it("re-renders translations, <html lang> and the cookie on setLocale", () => {
    render(
      <LocaleProvider initialLocale="en">
        <Probe />
      </LocaleProvider>,
    );

    expect(screen.getByText("Settings")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "toggle" }));

    expect(screen.getByText("Innstillinger")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("nb");
    expect(document.cookie).toContain("hmi.locale=nb");
  });

  it("falls back to English defaults outside the provider", () => {
    render(<Probe />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });
});
