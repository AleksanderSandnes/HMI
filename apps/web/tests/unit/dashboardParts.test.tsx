import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Sun, Zap } from "lucide-react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { Frame } from "@/components/charts/chartFrame";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { SectionLabel } from "@/components/dashboard/SectionLabel";
import { SolarHeroCard } from "@/components/dashboard/SolarHeroCard";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { PageHeader } from "@/components/PageHeader";
import { DualStat } from "@/components/ui/DualStat";
import { Toggle } from "@/components/ui/Toggle";
import type { DashboardModel } from "@/lib/hooks/useDashboardData";

beforeAll(() => {
  // jsdom has no ResizeObserver; Recharts' ResponsiveContainer needs one.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(cleanup);

describe("Toggle", () => {
  it("reports the inverted value on click and exposes switch state", () => {
    const onChange = vi.fn();
    render(<Toggle value={false} onChange={onChange} />);
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "false");
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("renders the on state and ignores clicks while disabled", () => {
    const onChange = vi.fn();
    render(<Toggle value disabled onChange={onChange} />);
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "true");
    expect(sw).toBeDisabled();
    fireEvent.click(sw);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("PageHeader / SectionLabel / Frame", () => {
  it("renders title, subtitle and the right slot", () => {
    render(<PageHeader title="Solar" subtitle="Today" right={<b>slot</b>} />);
    expect(screen.getByRole("heading", { name: "Solar" })).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("slot")).toBeInTheDocument();
  });

  it("renders a section label with an optional right slot", () => {
    render(<SectionLabel icon={Sun} text="Now" right={<i>r</i>} />);
    expect(screen.getByText("Now")).toBeInTheDocument();
    expect(screen.getByText("r")).toBeInTheDocument();
  });

  it("uses the class when provided, otherwise a fixed pixel height", () => {
    const { container, rerender } = render(
      <Frame heightClass="h-64" height={100}>
        <span>c</span>
      </Frame>,
    );
    expect(container.firstElementChild).toHaveClass("h-64");
    rerender(
      <Frame height={120}>
        <span>c</span>
      </Frame>,
    );
    expect(container.firstElementChild).toHaveStyle({ height: "120px" });
  });
});

describe("DashboardTopbar", () => {
  it("shows initials, the unread badge and fires the bell handler", () => {
    const onBell = vi.fn();
    render(<DashboardTopbar username="Ada Lovelace" notifCount={3} online onBellClick={onBell} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(onBell).toHaveBeenCalledTimes(1);
  });

  it("caps the badge at 9+ and hides it when there are none", () => {
    const { rerender } = render(<DashboardTopbar notifCount={25} onBellClick={() => {}} />);
    expect(screen.getByText("9+")).toBeInTheDocument();
    rerender(<DashboardTopbar notifCount={0} onBellClick={() => {}} />);
    expect(screen.queryByText("9+")).not.toBeInTheDocument();
  });
});

describe("DualStat", () => {
  const base = {
    icon: Zap,
    gradient: "energy" as const,
    label: "Energy",
    aLabel: "Today",
    aValue: "1.2",
    aUnit: "kWh",
    bLabel: "Week",
    bValue: "8.4",
  };

  it("renders both modules with units", () => {
    render(<DualStat {...base} />);
    expect(screen.getByText("Energy")).toBeInTheDocument();
    expect(screen.getByText("1.2")).toBeInTheDocument();
    expect(screen.getByText("kWh")).toBeInTheDocument();
    expect(screen.getByText("8.4")).toBeInTheDocument();
  });

  it("replaces values with skeletons while loading", () => {
    render(<DualStat {...base} loading />);
    expect(screen.queryByText("1.2")).not.toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
  });
});

describe("Sparkline", () => {
  it("renders for empty, short and full series without throwing", () => {
    for (const values of [[], [5], [1, 4, 2, 9]]) {
      const { unmount } = render(
        <div style={{ width: 200, height: 80 }}>
          <Sparkline values={values} />
        </div>,
      );
      unmount();
    }
  });
});

describe("SolarHeroCard", () => {
  const model = (over: Partial<DashboardModel>) =>
    ({
      currentPower: 3.2,
      peak: { value: 4100 },
      utilisation: 64,
      capacityKw: 5,
      todayGen: 12.34,
      sparkline: [0, 1, 3],
      ...over,
    }) as unknown as DashboardModel;

  it("shows the producing state, peak badge and subline", () => {
    render(<SolarHeroCard model={model({})} />);
    expect(screen.getByText("kW")).toBeInTheDocument();
    expect(screen.getByText(/12\.3/)).toBeInTheDocument();
  });

  it("renders idle with no peak and no subline", () => {
    const { container } = render(
      <SolarHeroCard
        model={model({
          currentPower: 0,
          peak: null,
          utilisation: null,
          capacityKw: null,
          todayGen: null,
        } as Partial<DashboardModel>)}
      />,
    );
    expect(container.querySelector("p")).toBeNull();
  });
});
