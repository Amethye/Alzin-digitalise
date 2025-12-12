import React, { useEffect, useMemo, useState } from "react";
import {
  applyThemePreference,
  resolveTheme,
  THEME_FEATURE_ENABLED,
  THEME_STORAGE_KEY,
  type ThemeMode,
  type ThemePreference,
} from "../lib/theme";

const themeCycle: ThemePreference[] = ["auto", "dark", "light"];

const preferenceLabels: Record<ThemePreference, string> = {
  auto: "Automatique",
  dark: "Sombre",
  light: "Clair",
};

const resolvedLabels: Record<ThemeMode, string> = {
  dark: "Sombre",
  light: "Clair",
};

const MoonIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M21 12.79A9 9 0 0111.21 3 7 7 0 1012.79 21 9 9 0 0121 12.79z" />
  </svg>
);

const SunIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const SystemIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M13 3.05a9 9 0 0 1 0 17.9" />
    <circle cx="12" cy="8" r="3" />
  </svg>
);

const isThemePreference = (value: string | null): value is ThemePreference => {
  return value === "auto" || value === "dark" || value === "light";
};

export default function ThemeToggle() {
  if (!THEME_FEATURE_ENABLED) {
    return null;
  }
  const [preference, setPreference] = useState<ThemePreference>("auto");
  const [resolved, setResolved] = useState<ThemeMode>("light");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedValue = localStorage.getItem(THEME_STORAGE_KEY);
    const initial = isThemePreference(storedValue) ? storedValue : "auto";
    setPreference(initial);
    setResolved(resolveTheme(initial));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      const nextMode = resolveTheme(preference);
      setResolved(nextMode);
      applyThemePreference(preference);
    };
    sync();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (preference === "auto") {
        sync();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [preference]);

  const handleCycle = () => {
    const currentIndex = themeCycle.indexOf(preference);
    const nextPreference = themeCycle[(currentIndex + 1) % themeCycle.length];
    setPreference(nextPreference);
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    }
  };

  const icon = useMemo(() => {
    if (preference === "dark") return <MoonIcon />;
    if (preference === "light") return <SunIcon />;
    return <SystemIcon />;
  }, [preference]);

  return (
    <button
      type="button"
      className="btn btn-ghost px-2 py-1 text-sm text-bordeau"
      onClick={handleCycle}
      title={`Préférence ${preferenceLabels[preference]} · Actuellement ${resolvedLabels[resolved]}`}
      aria-label="Changer le thème d’apparence"
      aria-pressed={resolved === "dark"}
    >
      <span className="sr-only">Changer entre mode clair, sombre ou automatique</span>
      <span className="flex items-center gap-2">
        {icon}
        <span className="hidden text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-bordeau/70 sm:inline">
          {preference === "auto" ? "Auto" : preference === "dark" ? "Sombre" : "Clair"}
        </span>
      </span>
    </button>
  );
}
