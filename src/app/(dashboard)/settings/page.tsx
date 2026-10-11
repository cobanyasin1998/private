import { Settings2 } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSessionOwner } from "@/lib/auth/session";
import { SettingsPreferences } from "@/components/settings-preferences";
import { AttachmentManager } from "@/components/attachment-manager";
import { getAttachments } from "@/lib/attachments/queries";
import { PasswordForm } from "@/components/password-form";
import { getDashboardWidgetPreferences } from "@/features/dashboard/preferences";
import { DashboardPreferences } from "@/features/dashboard/components/dashboard-preferences";

export default async function SettingsPage() {
  const owner = await getSessionOwner();
  if (!owner) return null;
  const attachments = await getAttachments(owner.id);
  const dashboardPreferences = await getDashboardWidgetPreferences(owner.id);
  return <div className="mx-auto max-w-3xl space-y-8"><div><p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">Sistem</p><h1 className="text-2xl font-semibold tracking-tight">Ayarlar</h1><p className="mt-2 text-sm text-muted-foreground">Kişisel Yaşam OS deneyimini ve varsayılanlarını düzenle.</p></div><div className="space-y-4"><section className="rounded-xl border bg-card p-5"><div className="flex items-start gap-3"><Settings2 className="mt-0.5 text-primary" size={18} /><div className="flex-1"><h2 className="font-medium">Görünüm</h2><p className="mt-1 text-sm text-muted-foreground">Açık, koyu veya sistem temasını seç.</p><div className="mt-4"><ThemeToggle /></div></div></div></section><SettingsPreferences initial={{ currency: owner.currency, timezone: owner.timezone, weekStartsOn: owner.weekStartsOn }} /><PasswordForm /><DashboardPreferences initial={dashboardPreferences} /><section className="rounded-xl border bg-card p-5"><h2 className="font-medium">Etiketler</h2><p className="mt-1 text-sm text-muted-foreground">Film, kitap, kurs ve notlarını ortak etiketlerle grupla.</p><Link href="/settings/tags" className="mt-4 inline-flex rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted">Etiketleri yönet</Link></section><AttachmentManager locale="tr" initial={attachments.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))} /><section className="rounded-xl border bg-card p-5"><h2 className="font-medium">Veri</h2><p className="mt-1 text-sm text-muted-foreground">Uygulama verilerini JSON formatında dışa aktar ve yedekten geri yükle.</p><Link href="/settings/backup" className="mt-4 inline-flex rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted">Yedekleme ve dışa aktarma</Link></section></div></div>;
}
