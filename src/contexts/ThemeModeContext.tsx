import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type ThemeMode = "dark" | "light";

type ThemeModeContextType = {
  mode: ThemeMode;
  toggleMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextType>({ mode: "dark", toggleMode: () => {} });

export const useThemeMode = () => useContext(ThemeModeContext);

const getInitialMode = (): ThemeMode => {
  const stored = localStorage.getItem("themeMode") as ThemeMode | null;
  if (stored === "dark" || stored === "light") return stored;
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) return "light";
  return "dark";
};

export const ThemeModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  useEffect(() => {
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  const toggleMode = () => setMode((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ThemeModeContext.Provider>
  );
};
