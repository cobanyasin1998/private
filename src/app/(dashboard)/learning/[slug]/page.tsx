import { notFound, redirect } from "next/navigation";
import { getSessionOwner } from "@/lib/auth/session";
import { seedLearningRegistry } from "@/features/learning/actions";
import { getLearningAreaBySlug } from "@/features/learning/queries";
import { LearningAreaDetail } from "@/features/learning/components/learning-area-detail";

export default async function LearningAreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const owner = await getSessionOwner();
  const { slug } = await params;
  if (!owner) redirect(`/login?next=${encodeURIComponent(`/learning/${slug}`)}`);
  await seedLearningRegistry();
  const area = await getLearningAreaBySlug(owner.id, slug);
  if (!area) notFound();
  return <LearningAreaDetail area={area} />;
}
