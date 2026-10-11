"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open?: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  closeLabel?: string;
  size?: "sm" | "md" | "lg";
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
};

const openDialogs: HTMLDialogElement[] = [];
let originalOverflow = "";

export function Modal({ open = true, title, onClose, children, closeLabel = "Pencereyi kapat", size = "lg", initialFocusRef, className = "" }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!openDialogs.length) { originalOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
    openDialogs.push(dialog);
    // Native modal dialogs make the background inert and keep keyboard focus inside.
    dialog.showModal();
    const target = initialFocusRef?.current ?? dialog.querySelector<HTMLElement>("[autofocus], input:not([type=hidden]), select, textarea");
    target?.focus();
    function cancel(event: Event) { event.preventDefault(); closeRef.current(); }
    dialog.addEventListener("cancel", cancel);
    return () => {
      dialog.removeEventListener("cancel", cancel);
      dialog.close();
      const index = openDialogs.indexOf(dialog);
      if (index !== -1) openDialogs.splice(index, 1);
      if (!openDialogs.length) document.body.style.overflow = originalOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open, initialFocusRef]);

  if (!open || typeof document === "undefined") return null;
  const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };
  return createPortal(
    <dialog ref={dialogRef} aria-modal="true" aria-labelledby={titleId} className={`fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${sizes[size]} overflow-hidden rounded-2xl border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/50 ${className}`}
      onMouseDown={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}>
      <header className="flex items-center justify-between border-b px-5 py-4 sm:px-7">
        <h2 id={titleId} className="text-lg font-semibold tracking-tight">{title}</h2>
        <button type="button" onClick={onClose} aria-label={closeLabel} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X size={18} /></button>
      </header>
      <div className="max-h-[calc(100dvh-7rem)] overflow-y-auto p-5 sm:p-7">{children}</div>
    </dialog>, document.body,
  );
}
