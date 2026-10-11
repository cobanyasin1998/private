"use client";

import { useEffect, useState } from "react";
import type { TagItem } from "@/features/tags/types";

export function TagFilter({ value = "" }: { value?: string }) {
  const [tags, setTags] = useState<TagItem[]>([]);
  useEffect(() => { let active = true; fetch("/api/tags", { cache: "no-store" }).then((response) => response.ok ? response.json() : { tags: [] }).then((data: { tags?: TagItem[] }) => { if (active) setTags(data.tags ?? []); }); return () => { active = false; }; }, []);
  return <select name="tag" aria-label="Etikete göre filtrele" defaultValue={value} className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"><option value="">Tüm etiketler</option>{tags.map((tag) => <option value={tag.id} key={tag.id}>{tag.name}</option>)}</select>;
}

