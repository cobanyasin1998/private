"use client";

export default function BooksError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="mx-auto max-w-2xl rounded-2xl border border-rose-500/20 bg-card p-10 text-center"><h1 className="text-lg font-semibold">Kitaplar yüklenemedi</h1><p className="mt-2 text-sm text-muted-foreground">Kısa bir bağlantı sorunu olmuş olabilir. Tekrar deneyin.</p><button type="button" onClick={() => reset()} className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Tekrar dene</button></div>;
}
