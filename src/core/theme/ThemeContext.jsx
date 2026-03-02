import { createContext, useContext, useState, useCallback } from "react";
import { applyTheme } from "./theme";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem("sens-theme") || "dark"; }
    catch { return "dark"; }
  });

  // Apply on first render
  applyTheme(mode);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("sens-theme", next); } catch {}
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeMode must be inside ThemeProvider");
  return ctx;
};
