"use client";

export default function CoursesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center"><h1 className="text-lg font-semibold">Kurslar yüklenemedi</h1><p className="mt-2 text-sm text-muted-foreground">Verileri alırken bir sorun oluştu. Tekrar deneyebilirsin.</p><button type="button" onClick={reset} className="mt-5 inline-flex h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Tekrar dene</button></div>;
}
