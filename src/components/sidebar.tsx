"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useState } from "react";
import { moduleRegistry, navigationSections } from "@/config/modules";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const text = { open: "Menüyü aç", close: "Menüyü kapat", expand: "Kenar çubuğunu genişlet", collapse: "Kenar çubuğunu daralt", logout: "Çıkış yap" };
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }
  return (
    <>
      <button type="button" className="fixed left-4 top-4 z-40 rounded-lg border border-border bg-card p-2 text-muted-foreground shadow-sm lg:hidden" onClick={() => setMobileOpen(true)} aria-label={text.open}>☰</button>
      {mobileOpen && <button type="button" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-label={text.close} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar transition-all duration-200 lg:static lg:z-auto", collapsed ? "w-[76px]" : "w-[248px]", mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/dashboard" className={cn("flex items-center gap-2.5 font-semibold tracking-tight", collapsed && "lg:mx-auto")}>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">P</span>
            <span className={cn("text-[15px]", collapsed && "lg:hidden")}>Kişisel Yaşam OS</span>
          </Link>
          <button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }} aria-label={collapsed ? text.expand : text.collapse}>
            <span className="hidden lg:block">{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</span>
            <span className="lg:hidden"><X size={18} /></span>
          </button>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {navigationSections.map((section) => {
            const items = moduleRegistry.filter((item) => item.section === section.id && item.enabled);
            if (!items.length) return null;
            return <div key={section.id}>
              <div className={cn("mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70", collapsed && "lg:hidden")}>{section.label.tr}</div>
              <div className="space-y-0.5">{items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.route || (item.route !== "/dashboard" && pathname.startsWith(item.route));
                return <Link key={item.id} href={item.route} onClick={() => setMobileOpen(false)} title={collapsed ? item.name.tr : undefined} className={cn("group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] transition-colors", active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground", collapsed && "lg:justify-center lg:px-2")}>
                  <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                  <span className={cn(collapsed && "lg:hidden")}>{item.name.tr}</span>
                </Link>;
              })}</div>
            </div>;
          })}
        </nav>
        <div className={cn("border-t border-border p-3 text-xs text-muted-foreground", collapsed && "lg:text-center")}>
          <button type="button" onClick={logout} title={collapsed ? text.logout : undefined} className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted hover:text-foreground", collapsed && "lg:justify-center")}><LogOut size={15} /><span className={cn(collapsed && "lg:hidden")}>{text.logout}</span></button>
        </div>
      </aside>
    </>
  );
}
