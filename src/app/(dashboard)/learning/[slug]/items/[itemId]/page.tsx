import { notFound, redirect } from "next/navigation";
import { getSessionOwner } from "@/lib/auth/session";
import { seedLearningRegistry } from "@/features/learning/actions";
import { getLearningAreaBySlug, getLearningItem } from "@/features/learning/queries";
import { LearningItemDetail } from "@/features/learning/components/learning-item-detail";

export default async function LearningItemPage({ params }: { params: Promise<{ slug: string; itemId: string }> }) {
  const owner = await getSessionOwner();
  const { slug, itemId } = await params;
  if (!owner) redirect("/login?next=" + encodeURIComponent("/learning/" + slug + "/items/" + itemId));
  await seedLearningRegistry();
  const area = await getLearningAreaBySlug(owner.id, slug);
  if (!area) notFound();
  const item = await getLearningItem(owner.id, itemId, area.id);
  if (!item) notFound();
  return <LearningItemDetail area={area} item={item} />;
}

