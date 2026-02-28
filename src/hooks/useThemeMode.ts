import { useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type AppliedTheme = "light" | "dark";

const THEME_MODE_STORAGE_KEY = "quicktools.theme-mode";
const SYSTEM_DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

const isThemeMode = (value: string): value is ThemeMode =>
  value === "light" || value === "dark" || value === "system";

const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "system";
  }

  try {
    const stored = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
    return stored && isThemeMode(stored) ? stored : "system";
  } catch {
    return "system";
  }
};

const getInitialSystemDarkPreference = (): boolean => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(SYSTEM_DARK_MEDIA_QUERY).matches;
};

export const useThemeMode = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(
    getInitialSystemDarkPreference
  );

  const appliedTheme: AppliedTheme = useMemo(
    () => (themeMode === "system" ? (systemPrefersDark ? "dark" : "light") : themeMode),
    [systemPrefersDark, themeMode]
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia(SYSTEM_DARK_MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    setSystemPrefersDark(mediaQuery.matches);

    if (themeMode !== "system") {
      return;
    }

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    }

    mediaQuery.addListener(onChange);
    return () => mediaQuery.removeListener(onChange);
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
    } catch {
      // Keep running with in-memory theme state when localStorage writes fail.
    }
  }, [themeMode]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.dataset.theme = appliedTheme;
    document.documentElement.style.colorScheme = appliedTheme;
  }, [appliedTheme]);

  return {
    themeMode,
    appliedTheme,
    setThemeMode
  };
};
