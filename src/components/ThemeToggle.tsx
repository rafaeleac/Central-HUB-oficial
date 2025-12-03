import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const THEME_KEY = "theme_preference";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored) return stored === "dark";
      // default prefer dark if system prefers dark
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem(THEME_KEY, "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem(THEME_KEY, "light");
    }
  }, [isDark]);

  // ensure visible even if outside React hydration
  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark") root.classList.add("dark");
    if (stored === "light") root.classList.remove("dark");
  }, []);

  return (
    <button
      aria-label={isDark ? "Desativar modo escuro" : "Ativar modo escuro"}
      className={`theme-toggle blink`}
      onClick={() => setIsDark((s) => !s)}
      title={isDark ? "Desativar modo escuro" : "Ativar modo escuro"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

// Named export também
export { default as ThemeToggle } from "./ThemeToggle";
