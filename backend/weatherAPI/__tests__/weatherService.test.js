const { getOptimalEndpointForTimeRange } = require("../services/weatherService");

describe("getOptimalEndpointForTimeRange", () => {
  it('maps "hourly" to the hourly endpoint and forwards the date', () => {
    const result = getOptimalEndpointForTimeRange("hourly", "20230619");
    expect(result.params).toEqual({ date: "20230619" });
    expect(result.description).toMatch(/hourly/i);
    expect(typeof result.endpoint).toBe("string");
  });

  it('maps "weekly" to the daily-summary endpoint with no params', () => {
    const result = getOptimalEndpointForTimeRange("weekly");
    expect(result.params).toEqual({});
    expect(result.description).toMatch(/weekly|summary/i);
  });

  it('maps "current" to the current endpoint with no params', () => {
    const result = getOptimalEndpointForTimeRange("current");
    expect(result.params).toEqual({});
    expect(result.description).toMatch(/current/i);
  });

  it('maps "recent" to the recent-day endpoint', () => {
    const result = getOptimalEndpointForTimeRange("recent");
    expect(result.params).toEqual({});
    expect(result.description).toMatch(/recent/i);
  });

  it("is case-insensitive on the time range", () => {
    expect(getOptimalEndpointForTimeRange("HOURLY", "20230619").params).toEqual({
      date: "20230619",
    });
    expect(getOptimalEndpointForTimeRange("Current").params).toEqual({});
  });

  it("falls back to the all-observations endpoint for an unknown range", () => {
    const result = getOptimalEndpointForTimeRange("something-else", "20230619");
    expect(result.params).toEqual({ date: "20230619" });
    expect(result.description).toMatch(/all observations|default/i);
  });
});
