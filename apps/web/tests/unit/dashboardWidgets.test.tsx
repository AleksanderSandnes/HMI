import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NotificationsOverlay } from "@/components/dashboard/NotificationsOverlay";
import { DualBaro } from "@/components/ui/DualBaro";
import { WindDial, WindDialFace } from "@/components/ui/WindDial";
import { LocaleProvider } from "@/lib/i18n";

afterEach(cleanup);

describe("WindDialFace / WindDial", () => {
  it("localises the compass rim and wind caption in Norwegian", () => {
    render(
      <LocaleProvider initialLocale="nb">
        <WindDialFace degrees={225} speed={12} />
      </LocaleProvider>,
    );
    expect(screen.getByText("Ø")).toBeInTheDocument();
    expect(screen.getByText("V")).toBeInTheDocument();
    expect(screen.getByText("fra SV")).toBeInTheDocument();
  });

  it("shows rounded speed, compass direction and gust", () => {
    render(<WindDialFace degrees={90} speed={12.4} gust={20.6} unit="m/s" />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("m/s")).toBeInTheDocument();
    expect(screen.getByText(/from E/)).toBeInTheDocument();
    expect(screen.getByText(/gust 21/)).toBeInTheDocument();
  });

  it("falls back when direction and speed are missing", () => {
    render(<WindDialFace degrees={null} speed={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Direction n/a")).toBeInTheDocument();
    expect(screen.getByText("km/h")).toBeInTheDocument();
  });

  it("uses a responsive size class instead of a fixed size when given", () => {
    const { container } = render(<WindDialFace degrees={10} speed={1} sizeClassName="w-20" />);
    const box = container.querySelector(".relative");
    expect(box).toHaveClass("w-20");
    expect(box).not.toHaveAttribute("style");
  });

  it("wraps the face in a card", () => {
    render(<WindDial degrees={180} speed={3} />);
    expect(screen.getByText(/from S/)).toBeInTheDocument();
  });
});

describe("DualBaro", () => {
  it("renders both pressure values", () => {
    render(<DualBaro now={1013.26} avg={1002} />);
    expect(screen.getByText("1013.3")).toBeInTheDocument();
    expect(screen.getByText("1002")).toBeInTheDocument();
    expect(screen.getAllByText("hPa")).toHaveLength(2);
  });

  it("clamps out-of-range readings and shows a dash when missing", () => {
    const { container } = render(<DualBaro now={900} avg={null} unit="mb" />);
    expect(screen.getByText("900")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    // Missing value draws no needle group.
    expect(container.querySelectorAll("g[transform]")).toHaveLength(1);
    const high = render(<DualBaro now={1200} avg={1200} />);
    expect(high.container.querySelectorAll("g[transform]").length).toBeGreaterThan(0);
  });

  it("swaps values for skeletons while loading", () => {
    render(<DualBaro now={1000} avg={1000} loading />);
    expect(screen.queryByText("1000")).not.toBeInTheDocument();
  });
});

describe("NotificationsOverlay", () => {
  const items = [
    {
      id: "a",
      level: "success",
      title: "Peak reached",
      message: "4.1 kW",
      createdAt: new Date().toISOString(),
    },
    { id: "b", level: "error", title: "Offline", message: "", createdAt: new Date().toISOString() },
    {
      id: "c",
      level: "unknown-level",
      title: "Mystery",
      message: "x",
      createdAt: new Date().toISOString(),
    },
  ] as never;

  const props = () => ({
    open: true,
    onClose: vi.fn(),
    onClear: vi.fn(),
    onDismiss: vi.fn(),
    items,
  });

  it("renders nothing while closed", () => {
    render(<NotificationsOverlay {...props()} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lists items, dismisses one and clears all", () => {
    const p = props();
    render(<NotificationsOverlay {...p} />);
    expect(screen.getByText("Peak reached")).toBeInTheDocument();
    expect(screen.getByText("Mystery")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /dismiss/i })[0]);
    expect(p.onDismiss).toHaveBeenCalledWith("a");
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(p.onClear).toHaveBeenCalled();
  });

  it("shows the empty state without a clear button", () => {
    render(<NotificationsOverlay {...props()} items={[]} />);
    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on Escape and backdrop click but not on inner click", () => {
    const p = props();
    render(<NotificationsOverlay {...p} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(p.onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(p.onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: "Enter" });
    expect(p.onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("presentation"));
    expect(p.onClose).toHaveBeenCalledTimes(2);
  });
});
