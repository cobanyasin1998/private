import { notFound, redirect } from "next/navigation";
import { getSessionOwner } from "@/lib/auth/session";
import { getSeriesDetail } from "@/features/series/queries";
import { SeriesDetail } from "@/features/series/components/series-detail";

export default async function TVDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const owner = await getSessionOwner();
  if (!owner) redirect("/login?next=%2Fmovies%2Ftv");
  const { id } = await params;
  const series = await getSeriesDetail(owner.id, id);
  if (!series) notFound();
  return <SeriesDetail series={series} />;
}
