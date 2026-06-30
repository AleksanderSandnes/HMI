import { GRADIENTS, BUTTON_GRADIENTS } from "../lib/gradients";

describe("gradient palettes", () => {
  it("every stat gradient is a 3-stop hex tuple", () => {
    for (const key of Object.keys(GRADIENTS) as (keyof typeof GRADIENTS)[]) {
      const stops = GRADIENTS[key];
      expect(stops).toHaveLength(3);
      stops.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/i));
    }
  });

  it("button gradients reuse the matching stat palettes verbatim", () => {
    expect(BUTTON_GRADIENTS.solar).toEqual(GRADIENTS.solar);
    expect(BUTTON_GRADIENTS.energy).toEqual(GRADIENTS.energy);
    expect(BUTTON_GRADIENTS.accent).toEqual(GRADIENTS.accent);
    expect(BUTTON_GRADIENTS.revenue).toEqual(GRADIENTS.revenue);
  });
});
