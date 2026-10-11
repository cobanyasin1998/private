export default function FinanceLoading() {
  return <div className="mx-auto max-w-[1440px] space-y-6" aria-busy="true"><div className="h-24 animate-pulse rounded-xl bg-muted" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div><div className="grid gap-6 lg:grid-cols-2"><div className="h-96 animate-pulse rounded-xl bg-muted" /><div className="h-96 animate-pulse rounded-xl bg-muted" /></div></div>;
}
