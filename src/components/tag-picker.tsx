"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TagItem } from "@/features/tags/types";

export function TagPicker({ initialTagIds = [] }: { initialTagIds?: string[] }) {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [selected, setSelected] = useState<string[]>(initialTagIds);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; fetch("/api/tags", { cache: "no-store" }).then((response) => response.ok ? response.json() : { tags: [] }).then((data: { tags?: TagItem[] }) => { if (active) setTags(data.tags ?? []); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  return <fieldset className="sm:col-span-2"><legend className="text-sm font-medium">Etiketler <span className="font-normal text-muted-foreground">(isteğe bağlı)</span></legend><input type="hidden" name="tagIds" value={JSON.stringify(selected)} />{loading ? <p className="mt-2 text-xs text-muted-foreground">Etiketler yükleniyor…</p> : tags.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">Henüz etiket yok. <Link href="/settings/tags" className="text-primary hover:underline">Ayarlar’dan oluştur</Link>.</p> : <div className="mt-2 flex flex-wrap gap-2">{tags.map((tag) => { const checked = selected.includes(tag.id); return <label key={tag.id} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${checked ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}><input type="checkbox" className="sr-only" checked={checked} onChange={() => setSelected((current) => checked ? current.filter((id) => id !== tag.id) : [...current, tag.id])} /><span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color ?? "#94a3b8" }} />{tag.name}</label>; })}</div>}</fieldset>;
}

