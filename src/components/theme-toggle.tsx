"use client";

import { useTheme } from "next-themes";
import { Laptop, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-28 rounded-lg bg-muted/50" aria-hidden />;
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-card p-1" aria-label="Theme">
      {([["light", Sun, "Light"], ["dark", Moon, "Dark"], ["system", Laptop, "System"]] as const).map(([value, Icon, label]) => (
        <button key={value} type="button" onClick={() => setTheme(value)} aria-label={label} className={`rounded-md p-1.5 transition-colors ${theme === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
          <Icon size={14} strokeWidth={1.8} />
        </button>
      ))}
    </div>
  );
}
