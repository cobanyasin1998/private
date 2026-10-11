import { NextResponse } from "next/server";
import { getSessionOwner } from "@/lib/auth/session";
import { getDashboardWidgetPreferences, normalizeDashboardWidgetPreferences, saveDashboardWidgetPreferences } from "@/features/dashboard/preferences";

export async function GET() {
  const owner = await getSessionOwner();
  if (!owner) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  return NextResponse.json({ widgets: await getDashboardWidgetPreferences(owner.id) }, { headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: Request) {
  const owner = await getSessionOwner();
  if (!owner) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const preferences = normalizeDashboardWidgetPreferences(body);
  if (!preferences) return NextResponse.json({ error: "Geçersiz panel bileşeni ayarı." }, { status: 400 });
  const widgets = await saveDashboardWidgetPreferences(owner.id, preferences);
  return NextResponse.json({ widgets }, { headers: { "cache-control": "no-store" } });
}
