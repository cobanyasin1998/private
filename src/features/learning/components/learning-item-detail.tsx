"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Edit3, ExternalLink, Goal, ListChecks, NotebookPen, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/modal";
import {
  createLearningGoal, createLearningItem, createLearningNote, createLearningTodo,
  deleteLearningGoal, deleteLearningNote, deleteLearningTodo,
  setLearningGoalCompleted, setLearningItemCompleted, setLearningTodoCompleted,
  updateLearningGoal, updateLearningItem, updateLearningNote, updateLearningTodo,
} from "../actions";
import type { LearningAreaListItem, LearningGoalItem, LearningItemListItem, LearningNoteItem, LearningTodoItem } from "../types";
import { GoalForm, ItemForm, LearningTodoForm, NoteForm, itemTypeLabels, todoStatusLabels } from "./learning-forms";

type ModalState = { kind: "item" | "todo" | "note" | "goal"; id?: string } | null;
const cardClass = "rounded-xl border bg-card p-5 shadow-sm";
const buttonClass = "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium hover:bg-muted";

export function LearningItemDetail({ area, item }: { area: LearningAreaListItem; item: LearningItemListItem }) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(Boolean(item.completedAt));
  useEffect(() => { setCompleted(Boolean(item.completedAt)); }, [item.completedAt]);
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
  const editingTodo = modal?.kind === "todo" && modal.id ? item.todos.find((todo) => todo.id === modal.id) : undefined;
  const editingNote = modal?.kind === "note" && modal.id ? item.learningNotes.find((note) => note.id === modal.id) : undefined;
  const editingGoal = modal?.kind === "goal" && modal.id ? item.learningGoals.find((goal) => goal.id === modal.id) : undefined;
  const editingItem = modal?.kind === "item" && modal.id ? area.items.find((entry) => entry.id === modal.id) : undefined;
  const modalTitle = modal?.kind === "item" ? (editingItem ? "Konuyu düzenle" : "Alt konu ekle") : modal?.kind === "todo" ? (editingTodo ? "Yapılacağı düzenle" : "Yapılacak ekle") : modal?.kind === "note" ? (editingNote ? "Notu düzenle" : "Not ekle") : editingGoal ? "Hedefi düzenle" : "Hedef ekle";
  const childItems = area.items.filter((entry) => entry.parentId === item.id);
  const childTopics = childItems.filter((entry) => entry.type === "TOPIC");
  const childLessons = childItems.filter((entry) => entry.type !== "TOPIC");

  return (
    <div className="mx-auto max-w-[1060px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => router.push("/learning/" + area.slug)} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> {area.name} konularına dön</button>
        <div className="flex gap-2"><button type="button" className={buttonClass} onClick={() => setModal({ kind: "item", id: item.id })}><Edit3 size={14} /> Konuyu düzenle</button><button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground" onClick={() => setModal({ kind: "item" })}><Plus size={14} /> Alt konu ekle</button></div>
      </div>
      <header className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-medium uppercase tracking-wider text-primary">{itemTypeLabels[item.type]}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{item.title}</h1>{item.description && <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{item.description}</p>}</div>
          <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><input type="checkbox" aria-label="Konu tamamlandı" checked={completed} disabled={pending} onChange={(event) => { setCompleted(event.target.checked); run(() => setLearningItemCompleted({ id: item.id, completed: event.target.checked })); }} className="accent-primary" /> {completed ? "Tamamlandı" : "Tamamlanmadı"}</label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-4 text-xs text-muted-foreground">
          {item.estimatedMinutes !== null && <span>Tahmini süre: {item.estimatedMinutes.toLocaleString("tr-TR")} dakika</span>}
          {completed && item.completedAt && <span>Tamamlanma tarihi: {new Date(item.completedAt).toLocaleDateString("tr-TR")}</span>}
          {item.externalUrl && <a href={item.externalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink size={13} /> Kaynak bağlantısını aç</a>}
        </div>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailPanel title="Özet" value={item.summary} fallback="Bu konu için henüz özet eklenmedi." />
        <DetailPanel title="Gereksinimler ve ön koşullar" value={item.requirements} fallback="Bu konu için ön koşul belirtilmedi." />
        <DetailPanel title="Detaylı içerik" value={item.content} fallback="Bu konu için henüz içerik eklenmedi." wide />
        <DetailPanel title="Öğrenme kazanımları" value={item.goals} fallback="Bu konu için henüz kazanım eklenmedi." />
        <DetailPanel title="Konu notları" value={item.notes} fallback="Bu konu için henüz not eklenmedi." />
      </div>
      {childTopics.length > 0 && <ChildSection title="Alt konular" items={childTopics} areaSlug={area.slug} pending={pending} onToggle={(id, completed) => run(() => setLearningItemCompleted({ id, completed }))} />}
      {childLessons.length > 0 && <ChildSection title="Laboratuvar ve uygulama dersleri" items={childLessons} areaSlug={area.slug} pending={pending} onToggle={(id, completed) => run(() => setLearningItemCompleted({ id, completed }))} />}
      <div className="grid gap-4 lg:grid-cols-2">
        <ItemPanel title="Yapılacaklar" icon={ListChecks} action={() => setModal({ kind: "todo" })} actionLabel="Yapılacak ekle">{item.todos.length ? item.todos.map((todo) => <TodoRow key={todo.id} todo={todo} pending={pending} onEdit={() => setModal({ kind: "todo", id: todo.id })} onToggle={(completed) => run(() => setLearningTodoCompleted({ id: todo.id, completed }))} onDelete={() => run(() => deleteLearningTodo({ id: todo.id }))} />) : <Empty text="Bu konuya bağlı yapılacak yok." />}</ItemPanel>
        <ItemPanel title="Hedefler" icon={Goal} action={() => setModal({ kind: "goal" })} actionLabel="Hedef ekle">{item.learningGoals.length ? item.learningGoals.map((goal) => <GoalRow key={goal.id} goal={goal} pending={pending} onEdit={() => setModal({ kind: "goal", id: goal.id })} onToggle={(completed) => run(() => setLearningGoalCompleted({ id: goal.id, completed }))} onDelete={() => run(() => deleteLearningGoal({ id: goal.id }))} />) : <Empty text="Bu konuya bağlı hedef yok." />}</ItemPanel>
      </div>
      <section className={cardClass}><div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-lg font-semibold"><NotebookPen size={18} className="text-primary" /> Notlar</h2><button type="button" onClick={() => setModal({ kind: "note" })} className="text-xs font-medium text-primary"><Plus size={13} className="mr-1 inline" /> Not ekle</button></div><div className="mt-4">{item.learningNotes.length ? <div className="grid gap-2 sm:grid-cols-2">{item.learningNotes.map((note) => <NoteRow key={note.id} note={note} onEdit={() => setModal({ kind: "note", id: note.id })} onDelete={() => run(() => deleteLearningNote({ id: note.id }))} />)}</div> : <Empty text="Bu konuya bağlı not yok." />}</div></section>
      {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <Modal open={Boolean(modal)} title={modalTitle} onClose={close}>
        {modal?.kind === "item" && <ItemForm item={editingItem} parentId={editingItem ? undefined : item.id} parentOptions={area.items} onSave={(values) => editingItem ? updateLearningItem({ ...values, id: item.id, areaId: area.id }) : createLearningItem({ ...values, areaId: area.id, parentId: item.id })} onSuccess={saved} onCancel={close} submitLabel={editingItem ? "Konuyu kaydet" : "Alt konuyu ekle"} />}
        {modal?.kind === "todo" && <LearningTodoForm todo={editingTodo} itemId={item.id} itemOptions={area.items} onSave={(values) => editingTodo ? updateLearningTodo({ ...values, id: editingTodo.id, areaId: area.id, itemId: item.id }) : createLearningTodo({ ...values, areaId: area.id, itemId: item.id })} onSuccess={saved} onCancel={close} submitLabel="Yapılacak kaydını kaydet" />}
        {modal?.kind === "note" && <NoteForm note={editingNote} itemId={item.id} itemOptions={area.items} onSave={(values) => editingNote ? updateLearningNote({ ...values, id: editingNote.id, areaId: area.id, itemId: item.id }) : createLearningNote({ ...values, areaId: area.id, itemId: item.id })} onSuccess={saved} onCancel={close} submitLabel="Notu kaydet" />}
        {modal?.kind === "goal" && <GoalForm goal={editingGoal} itemId={item.id} itemOptions={area.items} onSave={(values) => editingGoal ? updateLearningGoal({ ...values, id: editingGoal.id, areaId: area.id, itemId: item.id }) : createLearningGoal({ ...values, areaId: area.id, itemId: item.id })} onSuccess={saved} onCancel={close} submitLabel="Hedefi kaydet" />}
      </Modal>
    </div>
  );
}

function ChildSection({ title, items, areaSlug, pending, onToggle }: { title: string; items: LearningItemListItem[]; areaSlug: string; pending: boolean; onToggle: (id: string, completed: boolean) => void }) {
  return <section className={cardClass}><h2 className="flex items-center gap-2 text-lg font-semibold"><BookOpen size={18} className="text-primary" /> {title}</h2><div className="mt-4 space-y-2">{items.map((child) => <div key={child.id} className="flex items-center gap-2 rounded-lg border px-3 py-3 text-sm hover:border-primary/50"><input type="checkbox" aria-label={child.title + " tamamlandı"} checked={Boolean(child.completedAt)} disabled={pending} onChange={(event) => onToggle(child.id, event.target.checked)} className="accent-primary" /><Link href={"/learning/" + areaSlug + "/items/" + child.id} className={"min-w-0 flex-1 " + (child.completedAt ? "text-muted-foreground line-through" : "")}>{child.title}</Link><span className="text-xs text-muted-foreground">{itemTypeLabels[child.type]}</span></div>)}</div></section>;
}

function DetailPanel({ title, value, fallback, wide = false }: { title: string; value: string | null; fallback: string; wide?: boolean }) { return <section className={"rounded-xl border bg-card p-5 shadow-sm " + (wide ? "lg:col-span-2" : "")}><h2 className="text-lg font-semibold">{title}</h2><p className={"mt-3 whitespace-pre-wrap text-sm leading-7 " + (value ? "text-foreground" : "text-muted-foreground")}>{value || fallback}</p></section>; }
function ItemPanel({ title, icon: Icon, action, actionLabel, children }: { title: string; icon: typeof Goal; action: () => void; actionLabel: string; children: React.ReactNode }) { return <section className={cardClass}><div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-lg font-semibold"><Icon size={18} className="text-primary" /> {title}</h2><button type="button" onClick={action} className="text-xs font-medium text-primary"><Plus size={13} className="mr-1 inline" /> {actionLabel}</button></div><div className="mt-4 space-y-2">{children}</div></section>; }
function TodoRow({ todo, pending, onEdit, onToggle, onDelete }: { todo: LearningTodoItem; pending: boolean; onEdit: () => void; onToggle: (completed: boolean) => void; onDelete: () => void }) { return <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><input type="checkbox" aria-label={todo.title + " tamamlandı"} checked={todo.status === "DONE"} disabled={pending} onChange={(event) => onToggle(event.target.checked)} className="accent-primary" /><button type="button" onClick={onEdit} className={"min-w-0 flex-1 truncate text-left " + (todo.status === "DONE" ? "line-through text-muted-foreground" : "")}>{todo.title}</button><span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{todoStatusLabels[todo.status]}</span><button type="button" aria-label={todo.title + " sil"} onClick={onDelete} className="text-muted-foreground hover:text-rose-600"><Trash2 size={13} /></button></div>; }
function GoalRow({ goal, pending, onEdit, onToggle, onDelete }: { goal: LearningGoalItem; pending: boolean; onEdit: () => void; onToggle: (completed: boolean) => void; onDelete: () => void }) { return <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><input type="checkbox" aria-label={goal.title + " tamamlandı"} checked={Boolean(goal.completedAt)} disabled={pending} onChange={(event) => onToggle(event.target.checked)} className="accent-primary" /><button type="button" onClick={onEdit} className={"min-w-0 flex-1 truncate text-left " + (goal.completedAt ? "line-through text-muted-foreground" : "")}>{goal.title}</button><button type="button" aria-label={goal.title + " sil"} onClick={onDelete} className="text-muted-foreground hover:text-rose-600"><Trash2 size={13} /></button></div>; }
function NoteRow({ note, onEdit, onDelete }: { note: LearningNoteItem; onEdit: () => void; onDelete: () => void }) { return <div className="rounded-lg border px-3 py-2"><div className="flex items-center gap-2"><button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left text-sm font-medium">{note.title}</button><button type="button" aria-label={note.title + " sil"} onClick={onDelete} className="text-muted-foreground hover:text-rose-600"><Trash2 size={13} /></button></div><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{note.content}</p></div>; }
function Empty({ text }: { text: string }) { return <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">{text}</p>; }

