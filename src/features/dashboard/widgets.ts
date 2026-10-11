import type { LucideIcon } from "lucide-react";
import { Activity, BookOpen, BookPlus, CircleDollarSign, Clapperboard, Clock3, GraduationCap, Target, TrendingDown, TrendingUp } from "lucide-react";

export type DashboardWidgetId =
  | "current-month-income"
  | "current-month-expenses"
  | "net-cash-flow"
  | "active-courses"
  | "active-learning"
  | "weekly-study-time"
  | "upcoming-learning-goals"
  | "reading-progress"
  | "currently-watching"
  | "recently-added-books"
  | "recent-media-activity"
  | "recent-activity";

export type DashboardWidgetDefinition = {
  id: DashboardWidgetId;
  label: { tr: string };
  description: { tr: string };
  icon: LucideIcon;
};

/**
 * The dashboard is intentionally driven by this registry. A widget can be
 * hidden or reordered without changing the data queries in the page.
 */
export const dashboardWidgetRegistry: DashboardWidgetDefinition[] = [
  { id: "current-month-income", label: { tr: "Bu ay gelir" }, description: { tr: "Bu ayki gelir toplamı" }, icon: TrendingUp },
  { id: "current-month-expenses", label: { tr: "Bu ay gider" }, description: { tr: "Bu ayki gider toplamı" }, icon: TrendingDown },
  { id: "net-cash-flow", label: { tr: "Net nakit akışı" }, description: { tr: "Bu ay gelir eksi gider" }, icon: CircleDollarSign },
  { id: "active-courses", label: { tr: "Aktif kurslar" }, description: { tr: "Devam eden öğrenme kayıtları" }, icon: GraduationCap },
  { id: "active-learning", label: { tr: "Aktif öğrenme" }, description: { tr: "Devam eden öğrenme alanları ve ilerleme" }, icon: GraduationCap },
  { id: "weekly-study-time", label: { tr: "Haftalık çalışma" }, description: { tr: "Bu hafta kaydedilen öğrenme süresi" }, icon: Clock3 },
  { id: "upcoming-learning-goals", label: { tr: "Yaklaşan öğrenme hedefleri" }, description: { tr: "Henüz tamamlanmamış yakın hedefler" }, icon: Target },
  { id: "reading-progress", label: { tr: "Okuma ilerlemesi" }, description: { tr: "Okumakta olduğun kitaplar" }, icon: BookOpen },
  { id: "currently-watching", label: { tr: "Şu anda izlenenler" }, description: { tr: "İzleme listendeki aktif kayıtlar" }, icon: Clapperboard },
  { id: "recently-added-books", label: { tr: "Yeni eklenen kitaplar" }, description: { tr: "Kütüphanene son eklenenler" }, icon: BookPlus },
  { id: "recent-media-activity", label: { tr: "Son medya hareketleri" }, description: { tr: "Film ve kitap güncellemeleri" }, icon: Activity },
  { id: "recent-activity", label: { tr: "Son aktiviteler" }, description: { tr: "Uygulamadaki son işlemler" }, icon: Activity },
];

export const dashboardWidgetIds = dashboardWidgetRegistry.map((widget) => widget.id);

export function isDashboardWidgetId(value: string): value is DashboardWidgetId {
  return dashboardWidgetIds.includes(value as DashboardWidgetId);
}
