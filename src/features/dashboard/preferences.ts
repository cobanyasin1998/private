import { z } from "zod";
import { db } from "@/lib/db";
import { dashboardWidgetRegistry, type DashboardWidgetId } from "./widgets";

const WIDGET_PREFIX = "dashboard.widget.";

export type DashboardWidgetPreference = {
  id: DashboardWidgetId;
  enabled: boolean;
  sortOrder: number;
};

const preferenceSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  sortOrder: z.number().int().min(0).max(100),
});

export const dashboardPreferencesSchema = z.object({
  widgets: z.array(preferenceSchema).min(1).max(dashboardWidgetRegistry.length),
}).superRefine((value, context) => {
  const ids = value.widgets.map((widget) => widget.id);
  const known = new Set(dashboardWidgetRegistry.map((widget) => widget.id));
  if (new Set(ids).size !== ids.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ["widgets"], message: "Widget sıralaması tekrar içeriyor." });
  if (ids.some((id) => !known.has(id as DashboardWidgetId))) context.addIssue({ code: z.ZodIssueCode.custom, path: ["widgets"], message: "Geçersiz panel bileşeni." });
});

export function defaultDashboardWidgetPreferences(): DashboardWidgetPreference[] {
  return dashboardWidgetRegistry.map((widget, sortOrder) => ({ id: widget.id, enabled: true, sortOrder }));
}

/** Returns defaults for new accounts and merges only known persisted values. */
export async function getDashboardWidgetPreferences(ownerId: string): Promise<DashboardWidgetPreference[]> {
  const persisted = await db.modulePreference.findMany({ where: { ownerId, moduleId: { startsWith: WIDGET_PREFIX } }, select: { moduleId: true, enabled: true, sortOrder: true } });
  const byId = new Map(persisted.map((item) => [item.moduleId.slice(WIDGET_PREFIX.length), item]));
  return dashboardWidgetRegistry.map((widget, index) => {
    const saved = byId.get(widget.id);
    return { id: widget.id, enabled: saved?.enabled ?? true, sortOrder: saved?.sortOrder ?? index };
  }).sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

export async function saveDashboardWidgetPreferences(ownerId: string, preferences: DashboardWidgetPreference[]) {
  await db.$transaction(preferences.map((preference) => db.modulePreference.upsert({
    where: { ownerId_moduleId: { ownerId, moduleId: `${WIDGET_PREFIX}${preference.id}` } },
    create: { ownerId, moduleId: `${WIDGET_PREFIX}${preference.id}`, enabled: preference.enabled, sortOrder: preference.sortOrder, view: "dashboard" },
    update: { enabled: preference.enabled, sortOrder: preference.sortOrder, view: "dashboard" },
  })));
  return getDashboardWidgetPreferences(ownerId);
}

export function normalizeDashboardWidgetPreferences(input: unknown): DashboardWidgetPreference[] | null {
  const parsed = dashboardPreferencesSchema.safeParse(input);
  if (!parsed.success) return null;
  const known = new Set(dashboardWidgetRegistry.map((widget) => widget.id));
  const incoming = new Map(parsed.data.widgets.map((widget) => [widget.id, widget]));
  const ordered = parsed.data.widgets.map((widget, index) => ({ id: widget.id as DashboardWidgetId, enabled: widget.enabled, sortOrder: index }));
  for (const widget of dashboardWidgetRegistry) {
    if (!known.has(widget.id) || incoming.has(widget.id)) continue;
    ordered.push({ id: widget.id, enabled: true, sortOrder: ordered.length });
  }
  return ordered;
}

export const dashboardWidgetPrefix = WIDGET_PREFIX;
