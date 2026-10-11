"use client";

import { useState } from "react";
import { attachmentMessages } from "@/lib/attachments/messages";

type Attachment = { id: string; fileName: string; mimeType: string; sizeBytes: number; createdAt: string };

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentManager({ initial, locale }: { initial: Attachment[]; locale: string }) {
  const text = attachmentMessages(locale);
  const [attachments, setAttachments] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file");
    if (!(fileInput instanceof HTMLInputElement) || !fileInput.files?.[0]) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/attachments", { method: "POST", body: new FormData(form) });
      const result = await response.json();
      if (!response.ok) { setMessage(result?.error || text.uploadFailed); return; }
      setAttachments((current) => [result as Attachment, ...current]); form.reset(); setMessage(text.uploaded);
    } catch { setMessage(text.uploadFailed); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!window.confirm(text.confirmDelete)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
      if (response.ok) setAttachments((current) => current.filter((item) => item.id !== id));
      else setMessage(text.deleteFailed);
    } catch { setMessage(text.deleteFailed); }
    finally { setBusy(false); }
  }

  return <section className="rounded-xl border bg-card p-5"><h2 className="font-medium">{text.title}</h2><p className="mt-1 text-sm text-muted-foreground">{text.description}</p><form onSubmit={upload} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><input aria-label={text.file} required name="file" type="file" accept="application/pdf,text/plain,text/markdown,text/csv,image/jpeg,image/png,image/webp,image/gif" className="min-w-0 flex-1 text-sm" /><button type="submit" disabled={busy} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60">{busy ? text.busy : text.upload}</button></form>{message && <p className="mt-2 text-xs text-muted-foreground" role="status">{message}</p>}<div className="mt-4 divide-y rounded-lg border">{attachments.map((attachment) => <div key={attachment.id} className="flex items-center justify-between gap-3 px-3 py-2.5"><div className="min-w-0"><a href={`/api/attachments/${attachment.id}`} className="block truncate text-sm font-medium hover:text-primary">{attachment.fileName}</a><p className="text-xs text-muted-foreground">{attachment.mimeType} · {formatSize(attachment.sizeBytes)}</p></div><button type="button" disabled={busy} onClick={() => remove(attachment.id)} aria-label={`${text.delete}: ${attachment.fileName}`} className="shrink-0 rounded-md border px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-500/10 disabled:opacity-50">{text.delete}</button></div>)}{attachments.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">{text.empty}</p>}</div></section>;
}
