import Link from "next/link";
import { ArrowLeft, Tags } from "lucide-react";
import { redirect } from "next/navigation";
import { getSessionOwner } from "@/lib/auth/session";
import { getTags } from "@/features/tags/queries";
import { TagManager } from "@/features/tags/components/tag-manager";

export default async function TagsPage() {
  const owner = await getSessionOwner(); if (!owner) redirect("/login?next=%2Fsettings%2Ftags");
  return <div className="mx-auto max-w-3xl space-y-7"><div><Link href="/settings" className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft size={13} /> Ayarlara dön</Link><div className="flex items-start gap-4"><span className="rounded-xl bg-primary/10 p-3 text-primary"><Tags size={22} /></span><div><p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">Sistem</p><h1 className="text-2xl font-semibold tracking-tight">Etiketler</h1><p className="mt-2 text-sm text-muted-foreground">Film, kitap, kurs ve notlarını renkli etiketlerle grupla.</p></div></div></div><TagManager initialTags={await getTags(owner.id)} /></div>;
}

