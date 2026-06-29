import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Zap } from "lucide-react";
import { StatTile } from "@/components/ui/StatTile";

describe("StatTile", () => {
  it("renders label, value, unit and a positive delta", () => {
    render(
      <StatTile
        icon={Zap}
        gradient="energy"
        label="Generation"
        value="12.3"
        unit="kWh"
        delta={50}
      />
    );
    expect(screen.getByText("Generation")).toBeInTheDocument();
    expect(screen.getByText("12.3")).toBeInTheDocument();
    expect(screen.getByText("kWh")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("hides the value and renders a skeleton while loading", () => {
    const { container } = render(
      <StatTile icon={Zap} gradient="solar" label="Peak" value="9.9" loading />
    );
    // The label still shows, but the value is replaced by a pulsing skeleton.
    expect(screen.getByText("Peak")).toBeInTheDocument();
    expect(screen.queryByText("9.9")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("omits the delta chip when delta is null", () => {
    const { container } = render(
      <StatTile icon={Zap} gradient="energy" label="Generation" value="12.3" delta={null} />
    );
    expect(container.textContent).not.toContain("%");
  });
});
