import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { getSessionOwner } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const owner = await getSessionOwner();
  if (!owner) redirect("/login?next=%2Fdashboard");
  return <AppShell>{children}</AppShell>;
}
