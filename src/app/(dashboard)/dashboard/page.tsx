import { ArrowUpRight, BookOpen, BookPlus, CircleDollarSign, Clapperboard, Clock3, GraduationCap, Plus, Sparkles, Target, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { startOfMonth } from "date-fns";
import { db } from "@/lib/db";
import { getSessionOwner } from "@/lib/auth/session";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getRecentActivity } from "@/lib/activity/events";
import { getDashboardWidgetPreferences } from "@/features/dashboard/preferences";
import type { DashboardWidgetId } from "@/features/dashboard/widgets";
import { formatStudyDuration, getLearningDashboardData } from "@/features/dashboard/learning";

const quickLinks = [{ href: "/learning", label: "Öğrenme alanı ekle", icon: GraduationCap }, { href: "/movies", label: "Film ekle", icon: Clapperboard }, { href: "/books", label: "Kitap ekle", icon: BookOpen }, { href: "/finance", label: "İşlem ekle", icon: CircleDollarSign }];

function formatMap(values: Map<string, Prisma.Decimal>, fallback: string, locale: string) {
  if (!values.size) return formatCurrency("0", fallback, locale);
  return [...values.entries()].map(([currency, value]) => formatCurrency(value.toString(), currency, locale)).join(" · ");
}

export default async function DashboardPage() {
  const owner = await getSessionOwner();
  if (!owner) return null;
  const monthStart = startOfMonth(new Date());
  const [income, expenses, activeCourses, readingBooks, watchingMovies, recentBooks, recentMovies, recentActivity, preferences, learningDashboard] = await Promise.all([
    db.financialTransaction.groupBy({ by: ["currency"], where: { ownerId: owner.id, type: "INCOME", occurredAt: { gte: monthStart } }, _sum: { amount: true } }),
    db.financialTransaction.groupBy({ by: ["currency"], where: { ownerId: owner.id, type: "EXPENSE", occurredAt: { gte: monthStart } }, _sum: { amount: true } }),
    db.course.count({ where: { ownerId: owner.id, status: "IN_PROGRESS" } }),
    db.book.findMany({ where: { ownerId: owner.id, status: "READING" }, select: { id: true, title: true, currentPage: true, pageCount: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 8 }),
    db.movie.findMany({ where: { ownerId: owner.id, status: "WATCHING" }, select: { id: true, title: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 8 }),
    db.book.findMany({ where: { ownerId: owner.id }, select: { id: true, title: true, author: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.movie.findMany({ where: { ownerId: owner.id }, select: { id: true, title: true, status: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 8 }),
    getRecentActivity(owner.id),
    getDashboardWidgetPreferences(owner.id),
    getLearningDashboardData(owner.id, new Date(), owner.weekStartsOn, owner.timezone),
  ]);
  const currencyLocale = "tr-TR";
  const incomeByCurrency = new Map(income.map((row) => [row.currency, row._sum.amount ?? new Prisma.Decimal(0)]));
  const expenseByCurrency = new Map(expenses.map((row) => [row.currency, row._sum.amount ?? new Prisma.Decimal(0)]));
  const netByCurrency = new Map<string, Prisma.Decimal>();
  for (const currency of new Set([...incomeByCurrency.keys(), ...expenseByCurrency.keys()])) netByCurrency.set(currency, (incomeByCurrency.get(currency) ?? new Prisma.Decimal(0)).minus(expenseByCurrency.get(currency) ?? new Prisma.Decimal(0)));
  const readingPageTotal = readingBooks.reduce((sum, book) => sum + book.currentPage, 0);
  const readingPageGoal = readingBooks.reduce((sum, book) => sum + (book.pageCount ?? 0), 0);
  const readingPercent = readingPageGoal ? Math.min(100, Math.round((readingPageTotal / readingPageGoal) * 100)) : null;
  const recentMedia = [...recentMovies.map((item) => ({ id: `movie-${item.id}`, title: item.title, kind: "Film", date: item.updatedAt })), ...recentBooks.map((item) => ({ id: `book-${item.id}`, title: item.title, kind: "Kitap", date: item.createdAt }))].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
  const visibleWidgets = preferences.filter((item) => item.enabled);
  const renderWidget = (id: DashboardWidgetId) => {
    if (id === "current-month-income") return <MetricCard key={id} label="Bu ay gelir" value={formatMap(incomeByCurrency, owner.currency, currencyLocale)} note={income.length ? "Bu ayki toplam" : "İlk gelir kaydını ekle"} icon={TrendingUp} tone="emerald" />;
    if (id === "current-month-expenses") return <MetricCard key={id} label="Bu ay gider" value={formatMap(expenseByCurrency, owner.currency, currencyLocale)} note={expenses.length ? "Bu ayki toplam" : "Henüz gider yok"} icon={TrendingDown} tone="rose" />;
    if (id === "net-cash-flow") return <MetricCard key={id} label="Net nakit akışı" value={formatMap(netByCurrency, owner.currency, currencyLocale)} note={income.length || expenses.length ? "Gelir eksi gider" : "Finans kaydı ekle"} icon={CircleDollarSign} tone="sky" />;
    if (id === "active-courses") return <MetricCard key={id} label="Aktif kurslar" value={String(activeCourses)} note={activeCourses ? "Devam eden öğrenme" : "Öğrenmeye başla"} icon={GraduationCap} tone="violet" />;
    if (id === "active-learning") return <WidgetCard key={id} title="Aktif öğrenme" icon={GraduationCap} href="/learning"><WidgetList items={learningDashboard.activeLearning.slice(0, 5).map((course) => ({ id: course.id, label: course.name, note: `%${course.progress}` }))} empty="Devam eden öğrenme kaydı yok." /></WidgetCard>;
    if (id === "weekly-study-time") return <MetricCard key={id} label="Haftalık çalışma" value={formatStudyDuration(learningDashboard.weeklyStudyMinutes)} note={learningDashboard.weeklyStudyMinutes ? "Bu hafta kaydedilen süre" : "Bu hafta henüz oturum yok"} icon={Clock3} tone="sky" />;
    if (id === "upcoming-learning-goals") return <WidgetCard key={id} title="Yaklaşan öğrenme hedefleri" icon={Target} href="/learning"><WidgetList items={learningDashboard.upcomingGoals.slice(0, 5).map((goal) => ({ id: goal.id, label: goal.title, note: `${goal.course?.name ? `${goal.course.name} · ` : ""}${formatDate(goal.dueDate, currencyLocale)}` }))} empty="Yaklaşan öğrenme hedefi yok." /></WidgetCard>;
    if (id === "reading-progress") return <WidgetCard key={id} title="Okuma ilerlemesi" icon={BookOpen} href="/books"><p className="text-2xl font-semibold">{readingBooks.length} kitap</p><p className="mt-1 text-xs text-muted-foreground">{readingPercent === null ? "Sayfa hedefi eklenmemiş" : `${readingPercent}% toplam sayfa ilerlemesi`}</p>{readingBooks.length > 0 && <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-sky-500" style={{ width: `${readingPercent ?? 0}%` }} /></div>}<WidgetList items={readingBooks.slice(0, 3).map((book) => ({ id: book.id, label: book.title, note: book.pageCount ? `${book.currentPage}/${book.pageCount} sayfa` : "Sayfa hedefi yok" }))} empty="Şu anda okunan kitap yok." /></WidgetCard>;
    if (id === "currently-watching") return <WidgetCard key={id} title="Şu anda izlenenler" icon={Clapperboard} href="/movies"><WidgetList items={watchingMovies.slice(0, 5).map((movie) => ({ id: movie.id, label: movie.title, note: "İzleniyor" }))} empty="Şu anda izlenen film yok." /></WidgetCard>;
    if (id === "recently-added-books") return <WidgetCard key={id} title="Yeni eklenen kitaplar" icon={BookPlus} href="/books"><WidgetList items={recentBooks.slice(0, 5).map((book) => ({ id: book.id, label: book.title, note: book.author ?? "Yazar belirtilmemiş" }))} empty="Henüz kitap eklenmedi." /></WidgetCard>;
    if (id === "recent-media-activity") return <WidgetCard key={id} title="Son medya hareketleri" icon={Sparkles} href="/movies"><WidgetList items={recentMedia.map((item) => ({ id: item.id, label: item.title, note: item.kind }))} empty="Henüz medya hareketi yok." /></WidgetCard>;
    return <WidgetCard key={id} title="Son aktiviteler" icon={Sparkles}><WidgetList items={recentActivity.map((event) => ({ id: event.id, label: event.title, note: formatDate(event.createdAt, currencyLocale) }))} empty="Henüz aktivite yok." /></WidgetCard>;
  };
  return <div className="mx-auto max-w-[1440px] space-y-8"><section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-medium text-primary">{formatDate(new Date(), currencyLocale)}</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Günaydın, {owner.displayName}</h1><p className="mt-2 text-sm text-muted-foreground">Hayatının önemli parçaları tek yerde.</p></div><Link href="/finance" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"><Plus size={16} /> Yeni kayıt</Link></section>{visibleWidgets.length === 0 ? <div className="rounded-xl border border-dashed bg-card p-10 text-center"><p className="font-medium">Panel bileşenleri gizlendi</p><p className="mt-1 text-sm text-muted-foreground">Ayarlar sayfasından en az bir bileşeni görünür yap.</p><Link href="/settings" className="mt-4 inline-flex rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Panel ayarları</Link></div> : <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleWidgets.map((item) => renderWidget(item.id))}</section>}<section><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Hızlı işlemler</h2><span className="text-xs text-muted-foreground">Başlamak için bir alan seç</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{quickLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"><span className="rounded-lg bg-muted p-2.5 text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary"><Icon size={18} /></span><span className="text-sm font-medium">{label}</span><ArrowUpRight size={15} className="ml-auto text-muted-foreground/50 transition group-hover:text-primary" /></Link>)}</div></section></div>;
}

function MetricCard({ label, value, note, icon: Icon, tone }: { label: string; value: string; note: string; icon: typeof TrendingUp; tone: "emerald" | "rose" | "sky" | "violet" }) {
  const colors = { emerald: "text-emerald-600 dark:text-emerald-400", rose: "text-rose-600 dark:text-rose-400", sky: "text-sky-600 dark:text-sky-400", violet: "text-violet-600 dark:text-violet-400" };
  return <div className="rounded-xl border bg-card p-5"><div className="flex items-start justify-between"><span className="text-sm text-muted-foreground">{label}</span><Icon size={18} className={colors[tone]} /></div><p className="mt-4 truncate text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>;
}

function WidgetCard({ title, icon: Icon, href, children }: { title: string; icon: typeof BookOpen; href?: string; children: React.ReactNode }) {
  return <div className="rounded-xl border bg-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 font-semibold"><Icon size={17} className="text-primary" />{title}</h2>{href && <Link href={href} className="text-xs font-medium text-primary hover:underline">Aç <ArrowUpRight size={13} className="inline" /></Link>}</div>{children}</div>;
}

function WidgetList({ items, empty }: { items: { id: string; label: string; note: string }[]; empty: string }) {
  if (!items.length) return <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 text-center text-xs text-muted-foreground">{empty}</div>;
  return <div className="space-y-2.5">{items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3"><p className="min-w-0 truncate text-sm font-medium">{item.label}</p><span className="shrink-0 text-xs text-muted-foreground">{item.note}</span></div>)}</div>;
}
