import { getTranslator, type Locale } from "@hmi/core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DateSelector } from "@/components/ui/DateSelector";

const state = vi.hoisted(() => ({ locale: "en" as Locale }));
vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({ locale: state.locale, t: getTranslator(state.locale) }),
}));
afterEach(() => {
  cleanup();
  state.locale = "en";
});

function mount(disabled = false) {
  const select = vi.fn();
  render(<DateSelector selectedDate="2026-09-30" onDateSelect={select} disabled={disabled} />);
  return select;
}
function open() {
  fireEvent.click(screen.getByRole("button", { expanded: false }));
  return screen.getByRole("dialog");
}
function zoom() {
  fireEvent.click(screen.getByTitle("Switch to month / year view"));
}

describe("date selection", () => {
  it("steps across month boundaries without opening the calendar", () => {
    const select = mount();
    fireEvent.click(screen.getByRole("button", { name: "Next day" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
    expect(select.mock.calls).toEqual([["2026-10-01"], ["2026-09-29"]]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("selects a day and closes the dialog", () => {
    const select = mount();
    const calendar = open();
    expect(within(calendar).getByRole("button", { name: "2026-09-30" })).toHaveAttribute(
      "aria-current",
      "date",
    );
    fireEvent.click(within(calendar).getByRole("button", { name: "2026-10-01" }));
    expect(select).toHaveBeenCalledWith("2026-10-01");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("navigates months before selecting a date", () => {
    const select = mount();
    const calendar = open();
    fireEvent.click(within(calendar).getByRole("button", { name: "Next" }));
    expect(within(calendar).getByText("October 2026")).toBeTruthy();
    fireEvent.click(within(calendar).getByRole("button", { name: "Previous" }));
    fireEvent.click(within(calendar).getByRole("button", { name: "2026-09-15" }));
    expect(select).toHaveBeenCalledWith("2026-09-15");
  });

  it("chooses a month in another year", () => {
    const select = mount();
    const calendar = open();
    zoom();
    fireEvent.click(within(calendar).getByRole("button", { name: "Next" }));
    expect(within(calendar).getByRole("button", { name: "2027" })).toBeTruthy();
    fireEvent.click(within(calendar).getByRole("button", { name: "Previous" }));
    fireEvent.click(within(calendar).getByRole("button", { name: "Feb" }));
    fireEvent.click(within(calendar).getByRole("button", { name: "2026-02-28" }));
    expect(select).toHaveBeenCalledWith("2026-02-28");
  });

  it("navigates year blocks and drills down to a day", () => {
    const select = mount();
    const calendar = open();
    zoom();
    zoom();
    fireEvent.click(within(calendar).getByRole("button", { name: "Next" }));
    fireEvent.click(within(calendar).getByRole("button", { name: "Previous" }));
    fireEvent.click(within(calendar).getByRole("button", { name: "2025" }));
    fireEvent.click(within(calendar).getByRole("button", { name: "Dec" }));
    fireEvent.click(within(calendar).getByRole("button", { name: "2025-12-31" }));
    expect(select).toHaveBeenCalledWith("2025-12-31");
  });

  it.each(["escape", "outside", "scroll", "resize", "toggle"])("closes on %s", (action) => {
    mount();
    const calendar = open();
    fireEvent.mouseDown(calendar);
    fireEvent.keyDown(document, { key: "Enter" });
    expect(screen.getByRole("dialog")).toBeTruthy();
    if (action === "escape") fireEvent.keyDown(document, { key: "Escape" });
    if (action === "outside") fireEvent.mouseDown(document.body);
    if (action === "scroll") fireEvent.scroll(window);
    if (action === "resize") fireEvent.resize(window);
    if (action === "toggle") fireEvent.click(screen.getByRole("button", { expanded: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("disables all date actions while loading", () => {
    const select = mount(true);
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
      fireEvent.click(button);
    }
    expect(select).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("uses Norwegian labels for the calendar", () => {
    state.locale = "nb";
    mount();
    const calendar = open();
    expect(within(calendar).getByText("september 2026")).toBeTruthy();
    expect(calendar).toHaveAttribute("aria-label", "Velg dato");
  });
});
