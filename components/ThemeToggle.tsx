"use client";

import { useThemeStore } from "@/store/theme.store";

interface ThemeToggleProps {
  variant?: "compact" | "full";
}

export default function ThemeToggle({ variant = "compact" }: ThemeToggleProps) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const hasHydrated = useThemeStore((s) => s._hasHydrated);

  const isFull = variant === "full";
  const isDark = theme === "dark";

  // Mientras no hidrate, mostramos un placeholder con las mismas dimensiones
  // para evitar layout shift.
  if (!hasHydrated) {
    return (
      <button
        type="button"
        aria-hidden="true"
        className={
          isFull
            ? "py-2.5 w-[97.6%] mb-3 flex justify-center items-center rounded-lg bg-gray-100 border border-gray-300 dark:bg-gray-700 dark:border-gray-600"
            : "py-1.5 px-3 m-1 bg-gray-100 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
        }
      >
        <span className={isFull ? "w-6 h-6" : "w-5 h-6"} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      aria-pressed={isDark}
      className={
        isFull
          ? "py-2.5 w-[97.6%] mb-3 flex justify-center items-center rounded-lg bg-gray-100 border border-gray-300 text-black hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 transition-colors"
          : "py-1.5 px-3 m-1 bg-gray-100 border border-gray-300 rounded-md text-black hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 transition-colors"
      }
    >
      {isDark ? (
        // Sol (modo oscuro activo)
        <svg
          className={isFull ? "w-6 h-6" : "w-5 h-6"}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
          />
        </svg>
      ) : (
        // Luna (modo claro activo)
        <svg
          className={isFull ? "w-6 h-6" : "w-5 h-6"}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}