"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical } from "lucide-react";
import { useState } from "react";
import type { DashboardWidgetPreference } from "../preferences";
import { dashboardWidgetRegistry } from "../widgets";

export function DashboardPreferences({ initial }: { initial: DashboardWidgetPreference[] }) {
  const [widgets, setWidgets] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const text = { title: "Panel tercihleri", body: "Gösterilecek bileşenleri ve sıralarını seç.", up: "Yukarı taşı", down: "Aşağı taşı", hide: "Bileşeni gizle", show: "Bileşeni göster", save: "Tercihleri kaydet", saving: "Kaydediliyor…", saved: "Kaydedildi", error: "Tercihler kaydedilemedi." };

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= widgets.length) return;
    setSaved(false);
    setWidgets((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next.map((item, order) => ({ ...item, sortOrder: order }));
    });
  }

  function toggle(index: number) {
    setSaved(false);
    setWidgets((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: !item.enabled } : item));
  }

  async function save() {
    setSaving(true); setSaved(false); setError("");
    try {
      const response = await fetch("/api/dashboard/preferences", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ widgets }) });
      if (!response.ok) throw new Error("save failed");
      const data = await response.json() as { widgets: DashboardWidgetPreference[] };
      setWidgets(data.widgets); setSaved(true);
    } catch { setError(text.error); } finally { setSaving(false); }
  }

  return <section className="rounded-xl border bg-card p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-medium">{text.title}</h2><p className="mt-1 text-sm text-muted-foreground">{text.body}</p></div><GripVertical size={18} className="mt-0.5 text-muted-foreground" /></div><div className="mt-4 divide-y rounded-lg border">{widgets.map((preference, index) => { const definition = dashboardWidgetRegistry.find((widget) => widget.id === preference.id); if (!definition) return null; const Icon = definition.icon; return <div key={preference.id} className="flex items-center gap-3 p-3"><Icon size={16} className={preference.enabled ? "text-primary" : "text-muted-foreground"} /><div className="min-w-0 flex-1"><p className={`truncate text-sm font-medium ${preference.enabled ? "" : "text-muted-foreground"}`}>{definition.label.tr}</p><p className="truncate text-xs text-muted-foreground">{definition.description.tr}</p></div><button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label={`${definition.label.tr} ${text.up}`}><ArrowUp size={15} /></button><button type="button" onClick={() => move(index, 1)} disabled={index === widgets.length - 1} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label={`${definition.label.tr} ${text.down}`}><ArrowDown size={15} /></button><button type="button" onClick={() => toggle(index)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label={preference.enabled ? `${definition.label.tr} ${text.hide}` : `${definition.label.tr} ${text.show}`} aria-pressed={preference.enabled}>{preference.enabled ? <Eye size={16} /> : <EyeOff size={16} />}</button></div>; })}</div><div className="mt-4 flex items-center gap-3"><button type="button" onClick={save} disabled={saving} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60">{saving ? text.saving : text.save}</button>{saved && <span className="text-xs text-emerald-600">{text.saved}</span>}{error && <span role="alert" className="text-xs text-rose-600">{text.error}</span>}</div></section>;
}
