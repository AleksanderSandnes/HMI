import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

describe("SegmentedControl", () => {
  it("marks the active option and fires onChange on click", () => {
    const onChange = vi.fn();
    render(<SegmentedControl value="hourly" onChange={onChange} />);

    const hourly = screen.getByRole("button", { name: "Hourly" });
    expect(hourly).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Weekly" }));
    expect(onChange).toHaveBeenCalledWith("weekly");
  });
});
