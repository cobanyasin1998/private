import type { ReactNode } from "react";
import { Bell } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppShell({ children }: { children: ReactNode }) {
  const text = { panel: "Panel", notifications: "Bildirimler" };
  return <div className="flex min-h-screen bg-background text-foreground"><Sidebar /><div className="flex min-w-0 flex-1 flex-col">
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-background/90 px-5 backdrop-blur-md lg:px-8">
      <div className="ml-10 flex min-w-0 items-center gap-2 text-sm text-muted-foreground lg:ml-0"><span className="hidden sm:inline">Kişisel Yaşam OS</span><span className="text-border">/</span><span className="truncate text-foreground">{text.panel}</span></div>
      <div className="flex items-center gap-2"><button type="button" className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label={text.notifications}><Bell size={17} /></button><ThemeToggle /></div>
    </header><main className="flex-1 px-5 py-7 lg:px-8">{children}</main>
  </div></div>;
}
