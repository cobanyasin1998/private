"use client";

export default function FinanceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="mx-auto max-w-xl rounded-2xl border border-dashed bg-card p-10 text-center"><h1 className="text-lg font-semibold">Finans verileri yüklenemedi</h1><p className="mt-2 text-sm text-muted-foreground">Bağlantıyı kontrol edip tekrar deneyebilirsin.</p><button type="button" onClick={reset} className="mt-5 inline-flex h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Tekrar dene</button></div>;
}
