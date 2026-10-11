import Link from "next/link";
import { ArrowLeft, CircleDashed, Construction } from "lucide-react";
import { moduleRegistry } from "@/config/modules";

export default async function ModulePlaceholder({ params }: { params: Promise<{ module: string }> }) {
  const { module: moduleId } = await params;
  const definition = moduleRegistry.find((item) => item.id === moduleId);
  if (!definition) return <div className="mx-auto max-w-3xl py-16 text-center"><CircleDashed className="mx-auto mb-4 text-muted-foreground" /><h1 className="text-xl font-semibold">Sayfa bulunamadı</h1><Link href="/dashboard" className="mt-4 inline-flex text-sm text-primary hover:underline">Panele dön</Link></div>;
  const Icon = definition.icon;
  return <div className="mx-auto max-w-4xl space-y-8"><div><Link href="/dashboard" className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft size={13} /> Panele dön</Link><div className="flex items-start gap-4"><span className="rounded-xl bg-primary/10 p-3 text-primary"><Icon size={23} /></span><div><p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">{definition.section === "library" ? "Kütüphane" : "Yaşam alanı"}</p><h1 className="text-2xl font-semibold tracking-tight">{definition.name.tr}</h1><p className="mt-1 text-sm text-muted-foreground">{definition.description.tr}</p></div></div></div><div className="rounded-2xl border bg-card p-8 text-center shadow-sm sm:p-14"><span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"><Construction size={22} /></span><h2 className="text-lg font-semibold">Bu modül hazırlanıyor</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Bu alanın veri modeli hazırlanıyor. CRUD ekranları bir sonraki geliştirme adımında eklenecek.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/dashboard" className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">Panele dön</Link></div></div></div>;
}
