import { redirect } from "next/navigation";
import type { CourseStatus } from "@prisma/client";
import { getSessionOwner } from "@/lib/auth/session";
import { getCourseStats, getCourses } from "@/features/courses/queries";
import { CourseLibrary } from "@/features/courses/components/course-library";

const validStatuses = new Set<CourseStatus>(["PLANNED", "IN_PROGRESS", "COMPLETED", "PAUSED", "DROPPED"]);
type SearchParams = { q?: string; tag?: string; category?: string; status?: string };
export default async function CoursesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) { const owner = await getSessionOwner(); if (!owner) redirect("/login?next=%2Fcourses"); const params = await searchParams; const tagId = typeof params?.tag === "string" ? params.tag : ""; const query = typeof params?.q === "string" ? params.q : ""; const category = typeof params?.category === "string" ? params.category : ""; const rawStatus = typeof params?.status === "string" ? params.status : ""; const status = validStatuses.has(rawStatus as CourseStatus) ? rawStatus as CourseStatus : undefined; const [courses, stats] = await Promise.all([getCourses(owner.id, { query, status, category: category || undefined, tagId }), getCourseStats(owner.id)]); return <CourseLibrary courses={courses} stats={stats} query={query} category={category} tagId={tagId} status={status ?? ""} />; }
