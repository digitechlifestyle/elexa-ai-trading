"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "elexa_theme";

function applyTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const effective: Theme = saved ?? "dark";
    setTheme(effective);
    applyTheme(effective);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-[var(--background)] transition-colors text-lg"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
