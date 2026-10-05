import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Theme = "light" | "dark";

interface ThemeState {
	theme: Theme;
	_hasHydrated: boolean;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
	setHasHydrated: (state: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
	persist(
		(set, get) => ({
			theme: "light",
			_hasHydrated: false,

			setTheme: (theme) => {
				set({ theme });
				applyThemeToDOM(theme);
			},

			toggleTheme: () => {
				const next: Theme = get().theme === "dark" ? "light" : "dark";
				set({ theme: next });
				applyThemeToDOM(next);
			},

			setHasHydrated: (state) => set({ _hasHydrated: state }),
		}),
		{
			name: "color-theme", // clave en localStorage
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({ theme: state.theme }), // solo persistimos `theme`
			onRehydrateStorage: () => (state) => {
				// Se ejecuta tras leer localStorage. Aplica el tema al DOM.
				if (state) {
					applyThemeToDOM(state.theme);
					state.setHasHydrated(true);
				}
			},
		},
	),
);

/** Aplica/remueve la clase `dark` en <html> */
function applyThemeToDOM(theme: Theme) {
	if (typeof document === "undefined") return;
	document.documentElement.classList.toggle("dark", theme === "dark");
}
