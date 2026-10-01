import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Mail } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AppLayout from "@/app/(app)/layout";
import AuthLayout from "@/app/(auth)/layout";
import Loading from "@/app/loading";
import LandingPage from "@/app/page";
import { Field } from "@/components/ui/Field";

const fixture = vi.hoisted(() => ({
  user: null as { id: string } | null,
  locale: undefined as string | undefined,
  redirect: vi.fn((to: string) => {
    throw new Error(`redirect:${to}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (to: string) => fixture.redirect(to),
  usePathname: () => "/dashboard",
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (fixture.locale ? { value: fixture.locale } : undefined) }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: fixture.user } }) },
  }),
}));
vi.mock("@/components/AppNav", () => ({ AppNav: () => <nav data-testid="nav" /> }));

beforeEach(() => {
  fixture.user = null;
  fixture.locale = undefined;
  fixture.redirect.mockClear();
});
afterEach(cleanup);

describe("Field", () => {
  it("renders label, hint and icon, forwarding focus and blur", () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <Field
        label="Email"
        icon={Mail}
        hint="We never share it"
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
    expect(screen.getByText("We never share it")).toBeInTheDocument();
  });

  it("prefers the error over the hint", () => {
    render(<Field label="Email" hint="hint" error="Required" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.queryByText("hint")).not.toBeInTheDocument();
  });

  it("toggles password visibility", () => {
    const { container } = render(<Field label="Password" secure />);
    const input = container.querySelector("input")!;
    expect(input).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });
});

describe("layouts and landing", () => {
  it("renders the auth layout around its children", () => {
    const html = renderToStaticMarkup(<AuthLayout>child</AuthLayout>);
    expect(html).toContain("child");
    expect(html).toContain("<main");
  });

  it("redirects signed-out visitors away from the app shell", async () => {
    await expect(AppLayout({ children: "x" })).rejects.toThrow("redirect:/login");
  });

  it("renders the nav and content for a signed-in user", async () => {
    fixture.user = { id: "u1" };
    const ui = await AppLayout({ children: <p>inside</p> });
    render(ui);
    expect(screen.getByTestId("nav")).toBeInTheDocument();
    expect(screen.getByText("inside")).toBeInTheDocument();
  });

  it("sends signed-in users from the landing page to the dashboard", async () => {
    fixture.user = { id: "u1" };
    await expect(LandingPage()).rejects.toThrow("redirect:/dashboard");
  });

  it("shows the landing page with login and register links", async () => {
    render(await LandingPage());
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(expect.arrayContaining(["/login", "/register"]));
  });

  it("honours a stored Norwegian locale and ignores an invalid one", async () => {
    fixture.locale = "nb";
    const nb = renderToStaticMarkup(await LandingPage());
    fixture.locale = "zz";
    const fallback = renderToStaticMarkup(await LandingPage());
    expect(nb).not.toEqual(fallback);
  });

  it("renders the splash loading screen", () => {
    const { container } = render(<Loading />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
