"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Save } from "lucide-react";
import { TagPicker } from "@/components/tag-picker";
import { englishSkills, learningGroups, learningItemTypes, learningLevels, learningStatuses, learningTodoPriorities, learningTodoStatuses, travelPriorities, travelStatuses } from "../schemas";
import type { LearningAreaListItem, LearningItemListItem, TravelPlaceListItem, LearningEnglishEntryItem, EnglishSkillProgressItem, LearningTodoItem } from "../types";

export const groupLabels = { TECHNOLOGY: "Teknoloji", ACADEMIC: "Akademik", PERSONAL_LIFE: "Kişisel Gelişim ve Yaşam" };
export const levelLabels = { BEGINNER: "Başlangıç", INTERMEDIATE: "Orta", ADVANCED: "İleri" };
export const statusLabels = { PLANNED: "Planlandı", IN_PROGRESS: "Devam ediyor", COMPLETED: "Tamamlandı", PAUSED: "Beklemede" };
export const itemTypeLabels = { TOPIC: "Konu", PRACTICE: "Uygulama", LAB: "Laboratuvar", MINI_PROJECT: "Mini proje", QUIZ: "Quiz", READING: "Okuma", VIDEO: "Video", REVIEW: "Tekrar" };
export const englishLabels = { VOCABULARY: "Kelime listeleri", GRAMMAR: "Dilbilgisi", READING: "Okuma", LISTENING: "Dinleme", SPEAKING: "Konuşma", WRITING: "Yazma" };
export const travelStatusLabels = { WISHLIST: "İstek listesi", VISITED: "Ziyaret edildi" };
export const priorityLabels = { LOW: "Düşük", MEDIUM: "Orta", HIGH: "Yüksek" };
export const todoStatusLabels = { TODO: "Yapılacak", IN_PROGRESS: "Devam ediyor", DONE: "Tamamlandı", CANCELED: "İptal edildi" };
const inputClass = "mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary";
const textareaClass = "mt-1.5 w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";
export type SaveResult = { ok: boolean; error?: string; fieldErrors?: Record<string, string[] | undefined> };
type FormProps = { onSave: (data: Record<string, FormDataEntryValue>) => Promise<SaveResult>; onSuccess: () => void; onCancel: () => void; submitLabel?: string };

function Form({ children, onSave, onSuccess, onCancel, submitLabel = "Kaydet" }: FormProps & { children: ReactNode }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    setError("");
    startTransition(async () => {
      const result = await onSave(values);
      if (!result.ok) { setError([result.error, ...Object.values(result.fieldErrors ?? {}).flat().filter(Boolean)].filter(Boolean).join(" ")); return; }
      onSuccess();
    });
  }
  return <form onSubmit={submit} className="space-y-6"><div className="grid gap-4 sm:grid-cols-2">{children}</div>{error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>}<div className="flex justify-end gap-2 border-t pt-4"><button type="button" disabled={pending} onClick={onCancel} className="h-10 rounded-lg border px-4 text-sm font-medium hover:bg-muted">Vazgeç</button><button type="submit" disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"><Save size={15} />{pending ? "Kaydediliyor…" : submitLabel}</button></div></form>;
}
function Field({ label, children, full = false }: { label: string; children: ReactNode; full?: boolean }) { return <label className={`block text-sm font-medium ${full ? "sm:col-span-2" : ""}`}>{label}{children}</label>; }
function Input({ name, value, type = "text", required, maxLength = 200, min, max, placeholder }: { name: string; value?: string | number | null; type?: string; required?: boolean; maxLength?: number; min?: number; max?: number; placeholder?: string }) { return <input name={name} defaultValue={value ?? ""} type={type} required={required} maxLength={maxLength} min={min} max={max} placeholder={placeholder} className={inputClass} />; }
function TextArea({ name, value, maxLength = 10000, rows = 3, placeholder }: { name: string; value?: string | null; maxLength?: number; rows?: number; placeholder?: string }) { return <textarea name={name} defaultValue={value ?? ""} maxLength={maxLength} rows={rows} placeholder={placeholder} className={textareaClass} />; }
function Select({ name, value, options, labels }: { name: string; value?: string | null; options: readonly string[]; labels: Record<string, string> }) { return <select name={name} defaultValue={value ?? options[0]} className={inputClass}>{options.map((option) => <option key={option} value={option}>{labels[option]}</option>)}</select>; }
const dateValue = (value?: string | null) => value?.slice(0, 10) ?? "";

export function AreaForm({ area, ...props }: FormProps & { area?: LearningAreaListItem }) {
  const [status, setStatus] = useState(area?.status ?? "PLANNED");
  return <Form {...props}>
    <Field label="Alan adı *" full><Input name="name" value={area?.name} required /></Field>
    <Field label="Grup"><Select name="group" value={area?.group} options={learningGroups} labels={groupLabels} /></Field>
    <Field label="Kategori"><Input name="category" value={area?.category} placeholder="Örn. Teknoloji ve yazılım" maxLength={120} /></Field>
    <Field label="Alt kategori"><Input name="subCategory" value={area?.subCategory} maxLength={120} /></Field>
    <Field label="Seviye"><Select name="level" value={area?.level} options={learningLevels} labels={levelLabels} /></Field>
    <Field label="Durum"><select name="status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={inputClass}>{learningStatuses.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}</select></Field>
    <Field label="İlerleme (%)"><Input key={status} name="progress" value={status === "COMPLETED" ? 100 : area?.progress ?? 0} type="number" min={0} max={100} /></Field>
    <Field label="Tahmini süre (dakika)"><Input name="estimatedMinutes" value={area?.estimatedMinutes} type="number" min={0} max={1000000} /></Field>
    <Field label="İngilizce seviyesi"><select name="englishLevel" defaultValue={area?.englishLevel ?? ""} className={inputClass}><option value="">Belirtilmedi</option>{["A1", "A2", "B1", "B2", "C1", "C2"].map((value) => <option value={value} key={value}>{value}</option>)}</select></Field>
    <Field label="Son çalışma tarihi"><Input name="lastWorkedAt" value={dateValue(area?.lastWorkedAt)} type="date" /></Field>
    <Field label="Tamamlanma tarihi"><Input name="completedAt" value={dateValue(area?.completedAt)} type="date" /></Field>
    <Field label="Açıklama" full><TextArea name="description" value={area?.description} maxLength={5000} /></Field>
    <Field label="Ön koşullar" full><TextArea name="prerequisites" value={area?.prerequisites} maxLength={5000} placeholder="Bu alana başlamadan önce bilmen gerekenler" rows={2} /></Field>
    <Field label="Kaynak bağlantıları" full><TextArea name="resourceUrls" value={area?.resourceUrls.join("\n")} maxLength={100000} rows={3} placeholder="Her satıra bir http(s) bağlantısı" /></Field>
    <Field label="Alan notları" full><TextArea name="notes" value={area?.notes} /></Field>
    <TagPicker initialTagIds={area?.tagIds ?? []} />
  </Form>;
}

export function ItemForm({ item, parentId, topicOnly = false, parentOptions = [], ...props }: FormProps & { item?: LearningItemListItem; parentId?: string; topicOnly?: boolean; parentOptions?: LearningItemListItem[] }) {
  return <Form {...props}>
    <Field label="Konu başlığı *" full><Input name="title" value={item?.title} required maxLength={240} /></Field>
    {topicOnly ? <input type="hidden" name="type" value="TOPIC" /> : <Field label="İçerik türü"><Select name="type" value={item?.type} options={learningItemTypes} labels={itemTypeLabels} /></Field>}
    {parentId ? <input type="hidden" name="parentId" value={parentId} /> : <Field label="Üst konu"><select name="parentId" defaultValue={item?.parentId ?? ""} className={inputClass}><option value="">Ana konu</option>{parentOptions.filter((parent) => parent.id !== item?.id).map((parent) => <option key={parent.id} value={parent.id}>{parent.title}</option>)}</select></Field>}
    <Field label="Tahmini süre (dakika)"><Input name="estimatedMinutes" value={item?.estimatedMinutes} type="number" min={0} max={1000000} /></Field>
    <Field label="Sıra"><Input name="position" value={item?.position} type="number" min={0} max={100000} /></Field>
    <Field label="Kaynak bağlantısı"><Input name="externalUrl" value={item?.externalUrl} type="url" maxLength={2000} placeholder="https://…" /></Field>
    <Field label="Kısa açıklama" full><TextArea name="description" value={item?.description} maxLength={5000} /></Field>
    <Field label="Özet" full><TextArea name="summary" value={item?.summary} maxLength={5000} rows={4} placeholder="Bu konuda ne öğreneceksin?" /></Field>
    <Field label="Detaylı içerik" full><TextArea name="content" value={item?.content} maxLength={30000} rows={8} placeholder="Ders anlatımı, adımlar, örnekler ve uygulama notları" /></Field>
    <Field label="Gereksinimler / ön koşullar" full><TextArea name="requirements" value={item?.requirements} maxLength={10000} rows={4} /></Field>
    <Field label="Hedefler" full><TextArea name="goals" value={item?.goals} maxLength={10000} rows={4} /></Field>
    <Field label="Notlar" full><TextArea name="notes" value={item?.notes} /></Field>
    <TagPicker initialTagIds={item?.tagIds ?? []} />
  </Form>;
}

export function StudyForm(props: FormProps) {
  return <Form {...props}><Field label="Çalışma süresi (dakika) *"><Input name="minutes" type="number" required value={30} min={1} max={1440} /></Field><Field label="Çalışma tarihi"><Input name="startedAt" type="datetime-local" /></Field><Field label="Çalışma notu" full><TextArea name="note" maxLength={3000} placeholder="Bugün ne üzerinde çalıştın?" /></Field></Form>;
}

export function NoteForm({ note, itemId, itemOptions = [], ...props }: FormProps & { note?: { title: string; content: string; learningItemId?: string | null }; itemId?: string; itemOptions?: LearningItemListItem[] }) {
  return <Form {...props}><Field label="Not başlığı *" full><Input name="title" value={note?.title} required /></Field>{itemId ? <input type="hidden" name="itemId" value={itemId} /> : <Field label="Bağlı konu"><select name="itemId" defaultValue={note?.learningItemId ?? ""} className={inputClass}><option value="">Alan geneli</option>{itemOptions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>}<Field label="Not içeriği *" full><textarea name="content" required defaultValue={note?.content ?? ""} maxLength={10000} rows={8} className={textareaClass} /></Field></Form>;
}

export function GoalForm({ goal, itemId, itemOptions = [], ...props }: FormProps & { goal?: { title: string; description: string | null; dueDate: string | null; learningItemId?: string | null }; itemId?: string; itemOptions?: LearningItemListItem[] }) {
  return <Form {...props}><Field label="Hedef başlığı *" full><Input name="title" value={goal?.title} required /></Field>{itemId ? <input type="hidden" name="itemId" value={itemId} /> : <Field label="Bağlı konu"><select name="itemId" defaultValue={goal?.learningItemId ?? ""} className={inputClass}><option value="">Alan geneli</option>{itemOptions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>}<Field label="Hedef tarihi"><Input name="dueDate" value={dateValue(goal?.dueDate)} type="date" /></Field><Field label="Açıklama" full><TextArea name="description" value={goal?.description} maxLength={5000} /></Field></Form>;
}

export function LearningTodoForm({ todo, itemId, itemOptions = [], ...props }: FormProps & { todo?: LearningTodoItem; itemId?: string; itemOptions?: LearningItemListItem[] }) {
  return <Form {...props}><Field label="Yapılacak başlığı *" full><Input name="title" value={todo?.title} required maxLength={240} /></Field>{itemId ? <input type="hidden" name="itemId" value={itemId} /> : <Field label="Bağlı konu"><select name="itemId" defaultValue={todo?.itemId ?? ""} className={inputClass}><option value="">Alan geneli</option>{itemOptions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>}<Field label="Durum"><Select name="status" value={todo?.status} options={learningTodoStatuses} labels={todoStatusLabels} /></Field><Field label="Öncelik"><Select name="priority" value={todo?.priority} options={learningTodoPriorities} labels={priorityLabels} /></Field><Field label="Son tarih"><Input name="dueDate" value={dateValue(todo?.dueDate)} type="date" /></Field><Field label="Açıklama" full><TextArea name="description" value={todo?.description} maxLength={5000} /></Field></Form>;
}

export function TravelForm({ place, ...props }: FormProps & { place?: TravelPlaceListItem }) {
  return <Form {...props}><Field label="Yer adı *" full><Input name="placeName" value={place?.placeName} required /></Field><Field label="Şehir"><Input name="city" value={place?.city} maxLength={120} /></Field><Field label="Ülke"><Input name="country" value={place?.country} maxLength={120} /></Field><Field label="Durum"><Select name="status" value={place?.status} options={travelStatuses} labels={travelStatusLabels} /></Field><Field label="Öncelik"><Select name="priority" value={place?.priority} options={travelPriorities} labels={priorityLabels} /></Field><Field label="Tahmini bütçe"><input type="number" name="estimatedBudget" defaultValue={place?.estimatedBudget ?? ""} min={0} max={100000000} step="0.01" className={inputClass} /></Field><Field label="Para birimi"><select name="currency" defaultValue={place?.currency ?? "TRY"} className={inputClass}>{["TRY", "EUR", "USD", "GBP"].map((value) => <option key={value} value={value}>{value === "TRY" ? "Türk lirası (₺)" : value}</option>)}</select></Field><Field label="Fotoğraf bağlantısı"><Input name="photoUrl" value={place?.photoUrl} type="url" maxLength={2000} /></Field><Field label="Kaynak bağlantısı"><Input name="externalUrl" value={place?.externalUrl} type="url" maxLength={2000} /></Field><Field label="Ziyaret tarihi"><Input name="visitedAt" value={dateValue(place?.visitedAt)} type="date" /></Field><Field label="Notlar" full><TextArea name="notes" value={place?.notes} /></Field><TagPicker initialTagIds={place?.tagIds ?? []} /></Form>;
}

export function EnglishEntryForm({ entry, ...props }: FormProps & { entry?: LearningEnglishEntryItem }) {
  return <Form {...props}><Field label="Çalışma başlığı *" full><Input name="title" value={entry?.title} required maxLength={240} /></Field><Field label="Beceri"><Select name="type" value={entry?.type} options={englishSkills} labels={englishLabels} /></Field><Field label="İlerleme (%)"><Input name="progress" value={entry?.progress ?? 0} type="number" min={0} max={100} /></Field><Field label="Kelimeler veya çalışma içeriği" full><TextArea name="content" value={entry?.content} rows={7} maxLength={20000} placeholder="Kelime ve anlamları, dilbilgisi konuları veya çalışma planını yaz." /></Field><Field label="Notlar" full><TextArea name="notes" value={entry?.notes} /></Field><Field label="Tamamlanma tarihi"><Input name="completedAt" value={dateValue(entry?.completedAt)} type="date" /></Field></Form>;
}

export function EnglishSkillForm({ skill, ...props }: FormProps & { skill?: EnglishSkillProgressItem }) {
  return <Form {...props}><Field label="Beceri"><Select name="skill" value={skill?.skill} options={englishSkills} labels={englishLabels} /></Field><Field label="Seviye"><select name="level" defaultValue={skill?.level ?? "A1"} className={inputClass}>{["A1", "A2", "B1", "B2", "C1", "C2"].map((value) => <option key={value} value={value}>{value}</option>)}</select></Field><Field label="İlerleme (%)"><Input name="progress" value={skill?.progress ?? 0} type="number" min={0} max={100} /></Field><Field label="Değerlendirme tarihi"><Input name="assessedAt" value={dateValue(skill?.assessedAt)} type="date" /></Field></Form>;
}
