"use client";

import type React from "react";
import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// The saved theme lives in localStorage; subscribe to changes from this tab
// (a custom event) and from other tabs (the storage event).
const THEME_EVENT = "themechange";
const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
};
const getTheme = (): Theme => (localStorage.getItem("theme") === "dark" ? "dark" : "light");
// The server (and hydration) always renders the light theme
const getServerTheme = (): Theme => "light";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    localStorage.setItem("theme", theme === "light" ? "dark" : "light");
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
