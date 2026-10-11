"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Check, ChevronRight, Edit3, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/modal";
import { createLearningItem, deleteLearningItem, setLearningItemCompleted, updateLearningItem } from "../actions";
import type { LearningAreaListItem, LearningItemListItem } from "../types";
import { ItemForm, itemTypeLabels } from "./learning-forms";

type ModalState = { kind: "item"; itemId?: string } | null;

/** An area is deliberately kept as a topic index. Details live on the topic screen. */
export function LearningAreaDetail({ area }: { area: LearningAreaListItem }) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const close = () => setModal(null);
  const saved = () => { close(); router.refresh(); };
  const run = (action: () => Promise<{ ok: boolean; error?: string }>) => {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "İşlem gerçekleştirilemedi.");
      else router.refresh();
    });
  };
  const editingItem = modal?.itemId ? area.items.find((item) => item.id === modal.itemId) : undefined;
  // The area index only exposes learning topics. Labs, exercises and projects
  // are nested under a topic and are opened from that topic's detail screen.
  const topicItems = area.items.filter((item) => item.type === "TOPIC");
  const roots = topicItems.filter((item) => !item.parentId);
  const children = (parentId: string) => topicItems.filter((item) => item.parentId === parentId);
  const completedTopics = topicItems.filter((item) => item.completedAt).length;
  const title = editingItem ? "Konuyu düzenle" : "Konu veya alt konu ekle";

  return (
    <div className="mx-auto max-w-[980px] space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => router.push("/learning")} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Öğrenme merkezine dön
        </button>
        <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground" onClick={() => setModal({ kind: "item" })}>
          <Plus size={14} /> Konu ekle
        </button>
      </div>

      <header className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">{area.category ?? "Öğrenme alanı"}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{area.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Konular ve alt konular</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold text-primary">{completedTopics}/{topicItems.length}</p>
            <p className="text-xs text-muted-foreground">tamamlanan konu</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${topicItems.length ? Math.round(completedTopics / topicItems.length * 100) : 0}%` }} /></div>
      </header>

      <section className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div><h2 className="flex items-center gap-2 text-lg font-semibold"><BookOpen size={18} className="text-primary" /> Ders planı</h2><p className="mt-1 text-sm text-muted-foreground">Bir konuya tıklayarak içerik, gereksinimler, hedefler, notlar ve yapılacakları aç.</p></div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{topicItems.length} konu</span>
        </div>
        {roots.length ? <div className="space-y-2">{roots.map((item) => <TopicRow key={item.id} item={item} nested={children(item.id)} pending={pending} areaSlug={area.slug} getChildren={children} onEdit={(id) => setModal({ kind: "item", itemId: id })} onToggle={(id, completed) => run(() => setLearningItemCompleted({ id, completed }))} onDelete={(id) => run(() => deleteLearningItem({ id }))} />)}</div> : <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Henüz konu eklenmedi. İlk konuyu ekleyerek başlayabilirsin.</div>}
      </section>

      {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <Modal open={Boolean(modal)} title={title} onClose={close}>
        <ItemForm item={editingItem} topicOnly parentOptions={area.items} onSave={(values) => editingItem ? updateLearningItem({ ...values, id: editingItem.id, areaId: area.id }) : createLearningItem({ ...values, areaId: area.id })} onSuccess={saved} onCancel={close} submitLabel={editingItem ? "Konuyu kaydet" : "Konuyu ekle"} />
      </Modal>
    </div>
  );
}

function TopicRow({ item, nested, pending, areaSlug, getChildren, onEdit, onToggle, onDelete }: { item: LearningItemListItem; nested: LearningItemListItem[]; pending: boolean; areaSlug: string; getChildren: (parentId: string) => LearningItemListItem[]; onEdit: (id: string) => void; onToggle: (id: string, completed: boolean) => void; onDelete: (id: string) => void }) {
  // Reflect the click immediately while the server action revalidates the route.
  // Without this small optimistic state, a slow seed/revalidation keeps the
  // controlled checkbox unchecked and makes the accessible click appear lost.
  const [checked, setChecked] = useState(Boolean(item.completedAt));
  useEffect(() => { setChecked(Boolean(item.completedAt)); }, [item.completedAt]);
  return <div className="space-y-1">
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-3 transition-colors hover:border-primary/50 ${checked ? "bg-muted/30" : "bg-background"}`}>
      <input type="checkbox" aria-label={`${item.title} tamamlandı`} checked={checked} disabled={pending} onChange={(event) => { setChecked(event.target.checked); onToggle(item.id, event.target.checked); }} className="accent-primary" />
      <Link href={`/learning/${areaSlug}/items/${item.id}`} className={`group flex min-w-0 flex-1 items-center gap-2 text-left ${checked ? "text-muted-foreground" : ""}`}>
        <span className={`min-w-0 flex-1 truncate text-sm font-medium ${checked ? "line-through" : ""}`}>{item.title}</span>
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px]">{itemTypeLabels[item.type]}</span>
        <ChevronRight size={15} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
      {checked && <Check size={15} className="shrink-0 text-emerald-600" aria-label="Tamamlandı" />}
      <button type="button" aria-label={`${item.title} düzenle`} className="shrink-0 text-muted-foreground hover:text-foreground" onClick={() => onEdit(item.id)}><Edit3 size={14} /></button>
      <button type="button" aria-label={`${item.title} sil`} className="shrink-0 text-muted-foreground hover:text-rose-600" onClick={() => onDelete(item.id)}><Trash2 size={14} /></button>
    </div>
    {nested.length > 0 && <div className="ml-7 space-y-1 border-l-2 border-primary/15 pl-3">{nested.map((child) => <TopicRow key={child.id} item={child} nested={getChildren(child.id)} pending={pending} areaSlug={areaSlug} getChildren={getChildren} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />)}</div>}
  </div>;
}

