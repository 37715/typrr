"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // on mount, restore persisted theme
    const stored = localStorage.getItem('typrr_theme');
    if (stored) {
      setIsDark(stored === 'dark');
    } else {
      // Default to system preference if no stored theme
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
      localStorage.setItem('typrr_theme', 'dark');
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      localStorage.setItem('typrr_theme', 'light');
    }
  }, [isDark]);

  return (
    <div
      className={[
        "flex w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-300",
        isDark ? "bg-zinc-950 border border-zinc-800" : "bg-white border border-zinc-200",
        className ?? "",
      ].join(" ")}
      onClick={() => setIsDark(!isDark)}
      role="button"
      tabIndex={0}
    >
      <div className="flex justify-between items-center w-full">
        <div
          className={[
            "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300",
            isDark ? "translate-x-0 bg-zinc-800" : "translate-x-8 bg-gray-200",
          ].join(" ")}
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-white" strokeWidth={1.5} />
          ) : (
            <Sun className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
          )}
        </div>
        <div
          className={[
            "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300",
            isDark ? "bg-transparent" : "-translate-x-8",
          ].join(" ")}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
          ) : (
            <Moon className="w-4 h-4 text-black" strokeWidth={1.5} />
          )}
        </div>
      </div>
    </div>
  );
}


