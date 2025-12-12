export const THEME_STORAGE_KEY = "alzin-theme";
export const THEME_FEATURE_ENABLED = false;

export type ThemePreference = "auto" | "dark" | "light";
export type ThemeMode = "dark" | "light";

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

export function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia(COLOR_SCHEME_QUERY).matches ? "dark" : "light";
}

export function resolveTheme(preference: ThemePreference): ThemeMode {
  if (preference === "auto") {
    return getSystemTheme();
  }
  return preference;
}

export function applyThemePreference(preference: ThemePreference) {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  if (!THEME_FEATURE_ENABLED) {
    root.dataset.theme = "light";
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    return;
  }
  const resolved = resolveTheme(preference);
  root.dataset.theme = resolved;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}
