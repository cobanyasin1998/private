import { describe, expect, it } from "vitest";
import { defaultDashboardWidgetPreferences, normalizeDashboardWidgetPreferences } from "./preferences";
import { dashboardWidgetRegistry } from "./widgets";

describe("dashboard widget preferences", () => {
  it("provides every registered widget in a stable default order", () => {
    const defaults = defaultDashboardWidgetPreferences();
    expect(defaults.map((item) => item.id)).toEqual(dashboardWidgetRegistry.map((item) => item.id));
    expect(defaults.every((item) => item.enabled)).toBe(true);
  });

  it("normalizes a partial saved order and appends new registry widgets", () => {
    const result = normalizeDashboardWidgetPreferences({ widgets: [{ id: "recent-activity", enabled: false, sortOrder: 4 }] });
    expect(result?.[0]).toEqual({ id: "recent-activity", enabled: false, sortOrder: 0 });
    expect(result).toHaveLength(dashboardWidgetRegistry.length);
    expect(new Set(result?.map((item) => item.id)).size).toBe(dashboardWidgetRegistry.length);
  });

  it("rejects duplicate or unknown widget ids", () => {
    expect(normalizeDashboardWidgetPreferences({ widgets: [{ id: "recent-activity", enabled: true, sortOrder: 0 }, { id: "recent-activity", enabled: false, sortOrder: 1 }] })).toBeNull();
    expect(normalizeDashboardWidgetPreferences({ widgets: [{ id: "unknown", enabled: true, sortOrder: 0 }] })).toBeNull();
  });
});
