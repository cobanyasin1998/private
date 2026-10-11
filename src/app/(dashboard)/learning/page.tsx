import { redirect } from "next/navigation";
import { getSessionOwner } from "@/lib/auth/session";
import { seedLearningRegistry } from "@/features/learning/actions";
import { getLearningAreas, getLearningStats, getTravelPlaces } from "@/features/learning/queries";
import { LearningCenter } from "@/features/learning/components/learning-center";

type SearchParams = { q?: string; group?: string; status?: string; sort?: string; travel?: string };

export default async function LearningPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const owner = await getSessionOwner();
  if (!owner) redirect("/login?next=%2Flearning");
  await seedLearningRegistry();
  const params = await searchParams;
  const query = typeof params?.q === "string" ? params.q : "";
  const group = params?.group === "TECHNOLOGY" || params?.group === "ACADEMIC" || params?.group === "PERSONAL_LIFE" ? params.group : undefined;
  const status = params?.status === "PLANNED" || params?.status === "IN_PROGRESS" || params?.status === "COMPLETED" || params?.status === "PAUSED" ? params.status : undefined;
  const sort = params?.sort === "name" || params?.sort === "progress" || params?.sort === "lastWorked" ? params.sort : "updated";
  const travel = typeof params?.travel === "string" ? params.travel : "";
  const [areas, stats, travelPlaces] = await Promise.all([getLearningAreas(owner.id, { query, group, status, sort }), getLearningStats(owner.id), getTravelPlaces(owner.id, { query: travel })]);
  return <LearningCenter areas={areas} stats={stats} travelPlaces={travelPlaces} />;
}
