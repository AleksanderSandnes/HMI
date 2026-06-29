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

  it("shows an em dash while loading", () => {
    render(
      <StatTile icon={Zap} gradient="solar" label="Peak" value="9.9" loading />
    );
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("9.9")).not.toBeInTheDocument();
  });
});
