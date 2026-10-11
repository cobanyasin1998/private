import type { LucideIcon } from "lucide-react";
import { BookOpen, BookMarked, CircleDollarSign, Clapperboard, GraduationCap, LayoutDashboard, ListChecks, NotebookPen, Repeat2, Settings, Target, WalletCards } from "lucide-react";
import type { DashboardWidgetId } from "@/features/dashboard/widgets";

export type ModuleSection = "main" | "library" | "productivity" | "lifestyle" | "system";

export type ModuleDefinition = {
  id: string;
  route: string;
  name: { tr: string };
  description: { tr: string };
  icon: LucideIcon;
  section: ModuleSection;
  enabled: boolean;
  dashboardWidget?: DashboardWidgetId;
};

export const moduleRegistry: ModuleDefinition[] = [
  { id: "dashboard", route: "/dashboard", name: { tr: "Panel" }, description: { tr: "Kişisel hayatının özeti" }, icon: LayoutDashboard, section: "main", enabled: true },
  { id: "learning", route: "/learning", name: { tr: "Öğrenme Merkezi" }, description: { tr: "Öğrenme alanları ve yaşam planları" }, icon: GraduationCap, section: "main", enabled: true },
  { id: "movies", route: "/movies", name: { tr: "Film ve TV" }, description: { tr: "İzleme kütüphanen" }, icon: Clapperboard, section: "library", enabled: true, dashboardWidget: "currently-watching" },
  { id: "books", route: "/books", name: { tr: "Kitaplar" }, description: { tr: "Okuma kütüphanen" }, icon: BookOpen, section: "library", enabled: true, dashboardWidget: "reading-progress" },
  { id: "tasks", route: "/tasks", name: { tr: "Görevler" }, description: { tr: "Yapılacak işlerini yönet" }, icon: ListChecks, section: "productivity", enabled: false },
  { id: "projects", route: "/projects", name: { tr: "Projeler" }, description: { tr: "Projelerini ilerlet" }, icon: Target, section: "productivity", enabled: false },
  { id: "courses", route: "/courses", name: { tr: "Kurslar" }, description: { tr: "Öğrenme yolculuğun" }, icon: GraduationCap, section: "productivity", enabled: true, dashboardWidget: "active-courses" },
  { id: "notes", route: "/notes", name: { tr: "Notlar" }, description: { tr: "Bilgilerini düzenle" }, icon: NotebookPen, section: "productivity", enabled: false },
  { id: "finance", route: "/finance", name: { tr: "Finans" }, description: { tr: "Paranı bilinçli yönet" }, icon: CircleDollarSign, section: "lifestyle", enabled: true, dashboardWidget: "net-cash-flow" },
  { id: "habits", route: "/habits", name: { tr: "Alışkanlıklar" }, description: { tr: "Rutinlerini takip et" }, icon: Repeat2, section: "lifestyle", enabled: false },
  { id: "goals", route: "/goals", name: { tr: "Hedefler" }, description: { tr: "Kilometre taşlarını izle" }, icon: Target, section: "lifestyle", enabled: false },
  { id: "subscriptions", route: "/subscriptions", name: { tr: "Abonelikler" }, description: { tr: "Yinelenen ödemelerini izle" }, icon: WalletCards, section: "lifestyle", enabled: false },
  { id: "settings", route: "/settings", name: { tr: "Ayarlar" }, description: { tr: "Uygulama tercihleri" }, icon: Settings, section: "system", enabled: true },
  { id: "backup", route: "/settings/backup", name: { tr: "Yedekleme ve dışa aktarma" }, description: { tr: "Verilerini koru" }, icon: BookMarked, section: "system", enabled: true },
];

export const navigationSections: { id: ModuleSection; label: { tr: string } }[] = [
  { id: "main", label: { tr: "ANA MENÜ" } },
  { id: "library", label: { tr: "KÜTÜPHANE" } },
  { id: "productivity", label: { tr: "ÜRETKENLİK" } },
  { id: "lifestyle", label: { tr: "YAŞAM" } },
  { id: "system", label: { tr: "SİSTEM" } },
];

export function enabledModules() { return moduleRegistry.filter((module) => module.enabled); }
