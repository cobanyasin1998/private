export default function CoursesLoading() {
  return <div className="mx-auto max-w-[1440px] space-y-7" aria-busy="true"><div className="h-24 animate-pulse rounded-xl bg-muted" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div><div className="h-12 animate-pulse rounded-xl bg-muted" /><div className="grid gap-4 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-xl bg-muted" />)}</div></div>;
}
