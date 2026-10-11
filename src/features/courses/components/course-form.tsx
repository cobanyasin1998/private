"use client";

import { TagPicker } from "@/components/tag-picker";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Save } from "lucide-react";
import { createCourse, updateCourse, type CourseActionResult } from "../actions";
import { courseStatuses } from "../schemas";
import type { CourseListItem } from "../types";

const statusLabels: Record<(typeof courseStatuses)[number], string> = { PLANNED: "Planlandı", IN_PROGRESS: "Devam ediyor", COMPLETED: "Tamamlandı", PAUSED: "Duraklatıldı", DROPPED: "Bırakıldı" };
type Props = { mode: "create" | "edit"; course?: CourseListItem; onSuccess?: () => void; onCancel?: () => void; embedded?: boolean; initialCategory?: string; initialName?: string };
export function CourseForm({ mode, course, onSuccess, onCancel, embedded = false, initialCategory, initialName }: Props) {
  const router = useRouter(); const [pending, startTransition] = useTransition(); const [error, setError] = useState(""); const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); setFieldErrors({}); const values = Object.fromEntries(new FormData(event.currentTarget).entries()); startTransition(async () => { const result: CourseActionResult = mode === "create" ? await createCourse(values) : await updateCourse(course?.id ?? "", values); if (!result.ok) { setError(result.error); setFieldErrors(result.fieldErrors ?? {}); return; } if (onSuccess) onSuccess(); else { router.push("/courses"); router.refresh(); } }); }
  const inputClass = "mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary";
  const title = mode === "create" ? "Yeni kurs ekle" : "Kursu düzenle";
  const content = <form onSubmit={submit} className={embedded ? "space-y-6" : "space-y-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-7"}><div className="grid gap-5 sm:grid-cols-2">
      <label className="block text-sm font-medium sm:col-span-2">Kurs adı *<input required name="name" autoFocus maxLength={200} defaultValue={course?.name ?? initialName ?? ""} className={inputClass} />{fieldErrors.name?.[0] && <span className="mt-1 block text-xs text-rose-600">{fieldErrors.name[0]}</span>}</label>
      <label className="block text-sm font-medium">Kategori<input name="category" maxLength={100} defaultValue={course?.category ?? initialCategory ?? ""} placeholder="Örn. Teknoloji" className={inputClass} />{fieldErrors.category?.[0] && <span className="mt-1 block text-xs text-rose-600">{fieldErrors.category[0]}</span>}</label>
      <label className="block text-sm font-medium">Eğitmen / sağlayıcı<input name="provider" maxLength={200} defaultValue={course?.provider ?? ""} placeholder="Örn. Udemy" className={inputClass} /></label>
      <label className="block text-sm font-medium">Durum<select name="status" defaultValue={course?.status ?? "PLANNED"} className={inputClass}>{courseStatuses.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}</select></label>
      <label className="block text-sm font-medium">İlerleme (%)<input name="progress" type="number" min="0" max="100" defaultValue={course?.progress ?? 0} className={inputClass} />{fieldErrors.progress?.[0] && <span className="mt-1 block text-xs text-rose-600">{fieldErrors.progress[0]}</span>}</label>
      <label className="block text-sm font-medium sm:col-span-2">Kurs adresi <span className="font-normal text-muted-foreground">(isteğe bağlı)</span><input name="externalUrl" type="url" maxLength={1000} defaultValue={course?.externalUrl ?? ""} placeholder="https://…" className={inputClass} />{fieldErrors.externalUrl?.[0] && <span className="mt-1 block text-xs text-rose-600">{fieldErrors.externalUrl[0]}</span>}</label>
      <label className="block text-sm font-medium sm:col-span-2">Açıklama <span className="font-normal text-muted-foreground">(isteğe bağlı)</span><textarea name="description" rows={5} maxLength={5000} defaultValue={course?.description ?? ""} className="mt-1.5 w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary" placeholder="Bu kurstan ne öğrenmek istiyorsun?" /></label>
      <TagPicker initialTagIds={course?.tagIds ?? []} />{fieldErrors.tagIds?.[0] && <p className="text-xs text-rose-600 sm:col-span-2">{fieldErrors.tagIds[0]}</p>}
    </div>{error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-300">{error}</p>}<div className="flex flex-col-reverse justify-end gap-2 border-t pt-5 sm:flex-row">{(onCancel || embedded) && <button type="button" onClick={onCancel} className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium hover:bg-muted">Vazgeç</button>}<button disabled={pending} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"><Save size={15} />{pending ? "Kaydediliyor…" : mode === "create" ? "Kursu kaydet" : "Değişiklikleri kaydet"}</button></div></form>;
  if (embedded) return content;
  return <div className="mx-auto max-w-3xl space-y-7"><div className="flex items-start gap-4"><span className="rounded-xl bg-primary/10 p-3 text-primary"><GraduationCap size={23} /></span><div><p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">Öğrenme</p><h1 className="text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-1 text-sm text-muted-foreground">Kurs bilgilerini ve öğrenme durumunu takip et.</p></div></div>{content}</div>;
}
